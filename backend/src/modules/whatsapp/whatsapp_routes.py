from fastapi import APIRouter, Request
from src.modules.whatsapp.whatsapp_controller import WhatsAppController

whatsapp_router = APIRouter()

@whatsapp_router.post("/webhook")
async def twilio_webhook(request: Request):
    return await WhatsAppController.webhook(request)
