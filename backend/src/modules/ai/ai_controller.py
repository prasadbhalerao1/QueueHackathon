from src.modules.ai.ai_service import AIService
from src.modules.ai.ai_schema import ChatRequest
from src.common.exceptions.handlers import QueueOSException

class AIController:
    @staticmethod
    async def predict_crowd(branch_id: str):
        try:
            data = await AIService.predict_crowd(branch_id)
            return {"status": "success", "data": data}
        except Exception as e:
            raise QueueOSException(500, str(e))

    @staticmethod
    async def ask_bot(req: ChatRequest):
        try:
            reply = await AIService.ask_bot(req.message)
            return {"status": "success", "data": {"reply": reply}}
        except Exception as e:
            raise QueueOSException(500, str(e))
