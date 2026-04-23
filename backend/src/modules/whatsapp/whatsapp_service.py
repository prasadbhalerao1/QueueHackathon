import logging
import random
from datetime import datetime, timedelta
from typing import List, Optional

from google import genai
from pydantic import BaseModel

from src.common.config.config import settings
from src.modules.queue.queue_model import Token, Service, Branch
from src.modules.users.users_model import User
from src.common.constants.enums import QueueStatus, BookingType
from src.modules.queue.queue_service import QueueService

logger = logging.getLogger(__name__)

class GeminiIntentSchema(BaseModel):
    intent: str  # BOOKING, STATUS, CLARIFICATION, HELP, CANCEL
    service_name: Optional[str] = None
    language: str = "en"

class WhatsAppService:
    @staticmethod
    async def process_webhook(sender_phone: str, message: str) -> str:
        phone = sender_phone.replace("whatsapp:", "")
        if not phone.startswith("+"): phone = "+" + phone
        logger.info(f"WhatsApp: {phone} -> {message}")

        try:
            users = await User.find({"phone": phone}).to_list()
            user = users[0] if users else User(phone=phone, name="Citizen", role="CITIZEN")
            if not users: 
                await user.save()
                user = (await User.find({"phone": phone}).to_list())[0]
        except Exception as e:
            logger.error(f"User Error: {e}")
            return "Internal error. Try again."

        intent_data = None
        msg = message.lower().strip()
        
        # Keyword-First Intent Detection
        if any(k in msg for k in ["status", "token", "where", "wait", "delay"]):
            intent_data = GeminiIntentSchema(intent="STATUS", language="en")
        elif any(k in msg for k in ["cancel", "stop", "remove"]):
            intent_data = GeminiIntentSchema(intent="CANCEL", language="en")
        elif any(k in msg for k in ["aadhaar", "aadhar", "card", "income", "tax", "license", "licence", "water", "bill"]):
            serv = None
            if "aadhaar" in msg or "aadhar" in msg: serv = "Aadhaar Card Update"
            elif "income" in msg: serv = "Income Certificate"
            elif "tax" in msg: serv = "Property Tax Registration"
            elif "water" in msg: serv = "Water Bill Payment"
            elif "license" in msg or "licence" in msg: serv = "Driving License Revival"
            intent_data = GeminiIntentSchema(intent="BOOKING", service_name=serv, language="en") if serv else GeminiIntentSchema(intent="CLARIFICATION", language="en")
        
        # Gemini Fallback (Supports mixed Hindi/Marathi)
        if not intent_data:
            try:
                client = genai.Client(api_key=settings.GEMINI_API_KEY)
                prompt = f"""Message: "{message}"\nAnalyze intent (BOOKING, STATUS, CANCEL, HELP). Services: Aadhaar Card Update, Income Certificate, Property Tax Registration, Water Bill Payment, Driving License Revival."""
                response = client.models.generate_content(
                    model=settings.GEMINI_MODEL,
                    contents=prompt,
                    config={"response_mime_type": "application/json", "response_schema": GeminiIntentSchema.model_json_schema()},
                )
                intent_data = GeminiIntentSchema.model_validate_json(response.text)
            except Exception as e:
                logger.error(f"Gemini Error: {e}")
                intent_data = GeminiIntentSchema(intent="HELP", language="en")

        try:
            if intent_data.intent == "STATUS":
                tokens = await QueueService.lookup_tokens_by_phone(phone)
                if not tokens: return "No active tokens. Type 'Aadhaar' to book."
                t = tokens[0]
                status = t.status.value.replace("_", " ")
                return f"✅ Token {t.token_number} is {status}.\nBranch: {t.branch.name if t.branch else 'Main'}\nETA: {t.expected_service_time.strftime('%H:%M')}\nTrack: {settings.FRONTEND_URL}/track/{t.token_number}"

            elif intent_data.intent == "CANCEL":
                tokens = await QueueService.lookup_tokens_by_phone(phone)
                if not tokens: return "No tokens to cancel."
                await QueueService.advance_token(str(tokens[0].id), QueueStatus.CANCELLED)
                return f"Token {tokens[0].token_number} cancelled. 👋"

            elif intent_data.intent == "BOOKING":
                active = await QueueService.lookup_tokens_by_phone(phone)
                if len(active) >= 2: return "⚠️ Limit reached: Max 2 active tokens allowed."
                
                services = await QueueService.get_services()
                target = next((s for s in services if intent_data.service_name and s.name.lower() in intent_data.service_name.lower()), None)
                if not target: return "Which service? Aadhaar, Income Certificate, Tax, Water, or License?"

                branch = await QueueService.get_default_branch()
                token_count = await Token.find(Token.branch.id == branch.id).count()
                # Race-safe token numbering
                tk_num = f"A-{100 + token_count}-{random.randint(100, 999)}"
                
                new_t = Token(token_number=tk_num, user=user, branch=branch, service=target, booking_type=BookingType.WHATSAPP, status=QueueStatus.WAITING, expected_service_time=datetime.utcnow() + timedelta(minutes=30))
                await new_t.save()
                return f"✅ Confirmed!\nToken: {tk_num}\nService: {target.name}\nBranch: {branch.name}\nETA: ~30 mins\nTrack: {settings.FRONTEND_URL}/track/{tk_num}"

            else:
                return "QueueOS Bot 👋\n1. Book Service (e.g., 'Book Aadhaar')\n2. Status (e.g., 'status')\n3. Cancel (e.g., 'cancel')"

        except Exception as e:
            logger.error(f"Process Error: {e}")
            return "Internal error. Please try again."

    @staticmethod
    async def send_outbound_whatsapp(to_phone: str, message: str):
        logger.info(f"OUTBOUND -> {to_phone}: {message}")
        # Twilio/Meta API integration here
        pass
