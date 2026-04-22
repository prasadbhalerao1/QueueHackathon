import logging
from datetime import datetime, timedelta
from typing import Optional
from beanie import PydanticObjectId
from beanie.operators import In
from google import genai
from google.genai import types

from src.common.config.config import settings
from src.modules.queue.queue_model import Token, Service, Branch
from src.modules.users.users_model import User
from src.common.constants.enums import QueueStatus, BookingType
from src.modules.whatsapp.whatsapp_schema import GeminiIntentSchema
from twilio.rest import Client

logger = logging.getLogger(__name__)

class WhatsAppService:
    @staticmethod
    async def send_outbound_whatsapp(to_phone: str, message: str):
        try:
            client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
            twilio_msg = client.messages.create(
                from_=f"whatsapp:{settings.TWILIO_WHATSAPP_NUMBER}",
                body=message,
                to=f"whatsapp:{to_phone}"
            )
            logger.info(f"Sent outbound WhatsApp message to {to_phone}: {twilio_msg.sid}")
        except Exception as e:
            logger.error(f"Failed to send outbound WhatsApp message to {to_phone}: {e}")

    @staticmethod
    async def process_webhook(sender_phone: str, message: str) -> str:
        phone = sender_phone.replace("whatsapp:", "").strip()
        if not phone.startswith("+"):
            phone = "+" + phone

        # Find or create User
        user = await User.find_one({"phone": phone})
        if not user:
            user = User(phone=phone, name="Citizen", role="CITIZEN")
            await user.save()

        # TEST CASE 4: Anti-Spam Check
        active_tokens_count = await Token.find(
            Token.user.id == user.id,
            In(Token.status, [QueueStatus.BOOKED, QueueStatus.WAITING, QueueStatus.ARRIVED])
        ).count()
        
        if active_tokens_count >= 2:
            return "?? Booking Failed: You already have 2 active tokens in the queue. Please complete or cancel your existing appointments before booking a new one."

        # TEST CASE 1 & 2: Gemini NLP Engine
        try:
            client = genai.Client(api_key=settings.GEMINI_API_KEY)
            prompt = f"""
            You are 'QueueOS Assistant', a highly intelligent queue management AI for public services.
            Your job is to read the user's WhatsApp message and determine their precise intent, the service they want, and their language.
            
            ### BACKEND LOGIC CONTEXT (How your output controls the system):
            - BOOKING: Output this when the user clearly states the service they want. The backend will instantly auto-assign them, calculate dynamic wait times based on live queue traffic, and generate a live tracking PWA link.
            - STATUS: Output this when the user asks about wait times, ETA, or queue position. The backend will cross-reference their phone number, count active tokens ahead of them, and reply with exact minutes remaining.
            - CLARIFICATION: Output this if the user wants to book but is vague (e.g., "I need help with documents"). The backend will dynamically fetch and list all available services for them to choose from.
            - HELP: Output this for cancellations, general questions, or unrecognized intents.
            
            ### TEST CASES & EXPECTED BEHAVIOR:
            
            User: "bhai mera aadhar update karna hai, jaldi slot de do"
            Expected Intent: BOOKING
            Expected Service: "Aadhaar Update"
            Language: "hi" (Hindi/Hinglish)
            
            User: "I need to get some government work done today."
            Expected Intent: CLARIFICATION
            Expected Service: null
            Language: "en"
            
            User: "Kitna time aur lagega mera token ko?"
            Expected Intent: STATUS
            Expected Service: null
            Language: "hi"
            
            User: "Majha pani bil bharaycha ahe" (Marathi for water bill)
            Expected Intent: BOOKING
            Expected Service: "Water Bill"
            Language: "mr"
            
            User: "I am running late by 15 mins!"
            Expected Intent: STATUS (We will guide them to use the tracker link for Grace Re-entry)
            Expected Service: null
            Language: "en"
            
            ### YOUR TASK:
            Analyze the following user message and output strictly the requested JSON schema:
            "{message}"
            """
            
            response = client.models.generate_content(
                model='gemini-flash-latest',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=GeminiIntentSchema,
                    temperature=0.0
                ),
            )
            
            intent_data = GeminiIntentSchema.model_validate_json(response.text)
        except Exception as e:
            logger.error(f"Gemini AI Error: {e}")
            return "System Error: Our AI is currently down. Please try again later."

        # Routing Logic based on Intent
        if intent_data.intent == "CLARIFICATION":
            services = await Service.find_all().to_list()
            service_names = "\n".join([f"{i+1}. {s.name}" for i, s in enumerate(services)])
            return f"I can help with that! What specific service do you need? Please reply with one of the following:\n{service_names}"
            
        elif intent_data.intent == "STATUS":
            # TEST CASE 3: Status Check
            active_token = await Token.find(
                Token.user.id == user.id,
                In(Token.status, [QueueStatus.BOOKED, QueueStatus.WAITING, QueueStatus.ARRIVED])
            ).sort("-created_at").skip(0).limit(1).to_list()
            
            if not active_token:
                return "You don't have any active tokens."
                
            active_token = active_token[0]
            
            # Count people ahead
            ahead_count = await Token.find(
                Token.branch.id == active_token.branch.id,
                Token.status == QueueStatus.WAITING,
                Token.expected_service_time < active_token.expected_service_time
            ).count()
            
            est_wait = ahead_count * 10
            if active_token.service and hasattr(active_token.service, "base_duration_minutes"):
                est_wait = ahead_count * active_token.service.base_duration_minutes
                
            return f"Your token {active_token.token_number} is currently {active_token.status.name}. There are {ahead_count} people ahead of you. Estimated time to your turn is {est_wait} minutes."
            
        elif intent_data.intent == "BOOKING":
            target_service = None
            if intent_data.service_name:
                services = await Service.find_all().to_list()
                for s in services:
                    if s.name.lower() in intent_data.service_name.lower() or intent_data.service_name.lower() in s.name.lower():
                        target_service = s
                        break
            
            if not target_service:
                 # Fallback if service not found
                 services = await Service.find_all().to_list()
                 service_names = "\n".join([f"{i+1}. {s.name}" for i, s in enumerate(services)])
                 return f"I couldn't identify that exact service. What specific service do you need? Please reply with one of the following:\n{service_names}"

            branch = await Branch.find_one()
            if not branch:
                 return "System error: No branches configured."
                 
            active_waiting = await Token.find(
                 Token.branch.id == branch.id,
                 In(Token.status, [QueueStatus.WAITING, QueueStatus.IN_PROGRESS])
            ).to_list()
            
            wait_sum_minutes = sum([t.service.base_duration_minutes if t.service else 10 for t in active_waiting])
            expected_time = datetime.utcnow() + timedelta(minutes=wait_sum_minutes)
            
            token_count = await Token.find(Token.branch.id == branch.id).count()
            tk_num = f"A-{100 + token_count + 1}"
            
            new_token = Token(
                token_number=tk_num,
                branch=branch,
                service=target_service,
                user=user,
                booking_type=BookingType.WHATSAPP,
                status=QueueStatus.WAITING,
                priority=3,
                expected_service_time=expected_time
            )
            await new_token.save()
            
            return f"Aapki booking confirm ho gayi hai! ? Aapka Token Number hai: {tk_num}. Branch: {branch.name}. Expected wait time: {wait_sum_minutes} mins. Track here: https://queueos.demo/track/{tk_num}"
            
        elif intent_data.intent == "HELP":
            return "Welcome to QueueOS! Text me to book an appointment (e.g., 'I want an Aadhar Update'), check your status ('status'), or ask for help."
            
        return "I am the QueueOS assistant. Tell me what service you need or ask for your token status!"
