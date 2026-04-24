from fastapi import APIRouter
from src.modules.ai.ai_controller import AIController
from src.modules.ai.ai_schema import ChatRequest

ai_router = APIRouter()

@ai_router.get("/ml/predict-crowd/{branch_id}")
async def predict_crowd(branch_id: str):
    return await AIController.predict_crowd(branch_id)

@ai_router.post("/chat/ask")
async def ask_bot(req: ChatRequest):
    return await AIController.ask_bot(req)
