import logging
from datetime import datetime, timedelta
from beanie import PydanticObjectId
from beanie.operators import In
from google import genai
from google.genai import types

from src.common.config.config import settings
from src.modules.queue.queue_model import Token, Service, Branch
from src.modules.users.users_model import User
from src.common.constants.enums import QueueStatus
from src.modules.whatsapp.whatsapp_schema import GeminiIntentSchema
from twilio.rest import Client

logger = logging.getLogger(__name__)

class WhatsAppService:
    @staticmethod
    async def send_message(to: str, body: str):
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            message = client.messages.create(
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
                body=body,
                to=f"whatsapp:{to}"
            )
            logger.info(f"Sent WhatsApp message to {to}: {message.sid}")
        except Exception as e:
            logger.error(f"Failed to send WhatsApp message to {to}: {e}")

    @staticmethod
    async def process_incoming_message(sender_phone: str, message_body: str) -> str:
        # Clean the phone number
        phone = sender_phone.replace("whatsapp:", "").strip()
        
        # Find or create User
        user = await User.find_one({"phone": phone})
        if not user:
            user = User(phone=phone)
            await user.save()

        # 1. Anti-Spam Check
        active_tokens_count = await Token.find(
            Token.user.id == user.id,
            In(Token.status, [QueueStatus.BOOKED, QueueStatus.WAITING, QueueStatus.ARRIVED])
        ).count()
        
        if active_tokens_count >= 2:
            return (
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                "<Response>\n"
                "  <Message>Rate limit exceeded. You already have the maximum allowed active tokens (2). Please wait for your current appointments to finish.</Message>\n"
                "</Response>"
            )

        # 2. Gemini NLP - Native Structured Outputs
        client = genai.Client(api_key=settings.GEMINI_API_KEY)
        
        # Robust prompt for handling messy mixed language text
        prompt = f"""
        You are an AI assistant for a government queue system (Citizen Facilitation Center) in India.
        Extract the user's intent, the exact service name they are requesting (if booking), and their language.
        The user might type in messy Hindi (Hinglish), Marathi, or English.
        Example intents: 
        - "I want to book an appointment for driving license" -> BOOKING, "Driving License", "en"
        - "mera status kya hai" -> STATUS, null, "hi"
        - "mala certificate pahije" -> BOOKING, "Certificate", "mr"
        - "help me" -> HELP, null, "en"
        
        User Message: "{message_body}"
        """
        
        try:
            # FORCE Gemini to return strict JSON using response_schema natively
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiIntentSchema,
                    temperature=0.0
                ),
            )
            intent_data = GeminiIntentSchema.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            return (
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                "<Response>\n"
                "  <Message>System Error: Our AI is temporarily down. Please try again in a few minutes.</Message>\n"
                "</Response>"
            )

        # 3. Queue Math & Booking Logic
        if intent_data.intent == "BOOKING" and intent_data.service_name:
            service = await Service.find_one({"name": {"$regex": intent_data.service_name, "$options": "i"}})
            if not service:
                return (
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                    "<Response>\n"
                    f"  <Message>We could not find the service '{intent_data.service_name}'. Please clarify which service you need (e.g., 'Certificate', 'Payment').</Message>\n"
                    "</Response>"
                )
                
            branch = await Branch.find_one()
            if not branch:
                branch = Branch(name="Main Branch", lat=0.0, lng=0.0)
                await branch.save()
                
            last_waiting_token = await Token.find(
                Token.branch.id == branch.id,
                Token.status == QueueStatus.WAITING
            ).sort("-expected_service_time").first_or_none()
            
            now = datetime.utcnow()
            if last_waiting_token and last_waiting_token.expected_service_time > now:
                expected_time = last_waiting_token.expected_service_time + timedelta(minutes=service.base_duration_minutes)
            else:
                expected_time = now + timedelta(minutes=service.base_duration_minutes)
                
            token_count = await Token.find(Token.branch.id == branch.id).count()
            token_number = f"A-{token_count + 1}"
            
            new_token = Token(
                token_number=token_number,
                user=user,
                branch=branch,
                service=service,
                status=QueueStatus.BOOKED,
                expected_service_time=expected_time
            )
            await new_token.save()
            
            time_str = expected_time.strftime("%I:%M %p")
            
            return (
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                "<Response>\n"
                "  <Message>Booking Confirmed!\n"
                f"Token Number: {token_number}\n"
                f"Branch: {branch.name}\n"
                f"Expected Service Time: {time_str}</Message>\n"
                "</Response>"
            )
            
        elif intent_data.intent == "STATUS":
            active_token = await Token.find_one(
                Token.user.id == user.id,
                In(Token.status, [QueueStatus.BOOKED, QueueStatus.WAITING, QueueStatus.ARRIVED])
            ).sort("-created_at")
            
            if active_token:
                time_str = active_token.expected_service_time.strftime("%I:%M %p")
                return (
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                    "<Response>\n"
                    f"  <Message>Your Token {active_token.token_number} is currently {active_token.status.value}. Expected time: {time_str}.</Message>\n"
                    "</Response>"
                )
            else:
                return (
                    "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                    "<Response>\n"
                    "  <Message>You have no active tokens.</Message>\n"
                    "</Response>"
                )
        else:
            return (
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                "<Response>\n"
                "  <Message>Welcome to QueueOS! Please specify the service you want to book (e.g., 'Book an appointment for Driving License').</Message>\n"
                "</Response>"
            )
