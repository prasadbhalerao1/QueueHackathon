from fastapi import APIRouter, HTTPException
from src.modules.ml.ml_service import MLService
from datetime import datetime

ml_router = APIRouter()

@ml_router.get("/predict-crowd/{branch_id}")
async def predict_crowd(branch_id: str):
    """
    Returns crowd prediction and best time to visit for a specific branch.
    Uses a Scikit-learn Linear Regression model.
    """
    # In this MVP, we use the current hour for prediction
    current_hour = datetime.utcnow().hour + 5 # Adjust for IST approx
    if current_hour > 24: current_hour -= 24
    
    # We cap it between business hours for the model
    prediction_hour = max(9, min(18, current_hour))
    
    result = MLService.predict_crowd_level(prediction_hour)
    result["branch_id"] = branch_id
    
    return {
        "status": "success",
        "data": result
    }
