import logging
from fastapi import Request
from fastapi.responses import Response
from src.modules.whatsapp.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)

class WhatsAppController:
    @staticmethod
    async def webhook(request: Request):
        try:
            # Parse incoming Twilio Form data
            form_data = await request.form()
            sender_phone = form_data.get("From", "")
            message_body = form_data.get("Body", "")
            
            xml_response = await WhatsAppService.process_incoming_message(sender_phone, message_body)
            
            # Return strict raw XML per Twilio webhooks spec
            return Response(content=xml_response, media_type="application/xml")
            
        except Exception as e:
            logger.error(f"Webhook processing error: {e}")
            error_xml = (
                "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                "<Response>\n"
                "  <Message>A critical system error occurred. Please try again later.</Message>\n"
                "</Response>"
            )
            return Response(content=error_xml, media_type="application/xml")
