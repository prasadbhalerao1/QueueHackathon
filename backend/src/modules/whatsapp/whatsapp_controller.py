import logging
from fastapi import Request
from fastapi.responses import Response
from src.modules.whatsapp.whatsapp_service import WhatsAppService

logger = logging.getLogger(__name__)

class WhatsAppController:
    @staticmethod
    async def webhook(request: Request):
        try:
            form_data = await request.form()
            sender_phone = form_data.get("From", "")
            message_body = form_data.get("Body", "")
            
            text_response = await WhatsAppService.process_webhook(sender_phone, message_body)
            
            xml_response = (
                f"<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n"
                f"<Response>\n"
                f"  <Message>{text_response}</Message>\n"
                f"</Response>"
            )
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
