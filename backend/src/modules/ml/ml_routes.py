from fastapi import APIRouter, HTTPException
from src.modules.ml.ml_service import MLService
from datetime import datetime

ml_router = APIRouter()

@ml_router.get("/predict-crowd/{branch_id}")
async def predict_crowd(branch_id: str):
    """
    Returns crowd prediction and best time to visit for a specific branch.
    Uses real-time branch data + Scikit-learn Linear Regression.
    """
    # Get current hour (approx IST)
    current_hour = (datetime.utcnow().hour + 5) % 24
    prediction_hour = max(9, min(18, current_hour))
    
    result = await MLService.predict_crowd_level(branch_id, prediction_hour)
    
    return {
        "status": "success",
        "data": result
    }
