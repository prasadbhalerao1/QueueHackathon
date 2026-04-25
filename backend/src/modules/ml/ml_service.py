import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import datetime
import logging
from beanie import PydanticObjectId
from src.modules.queue.queue_model import Token, Branch
from src.common.constants.enums import QueueStatus
from beanie.operators import In

logger = logging.getLogger(__name__)

class MLService:
    @staticmethod
    async def predict_crowd_level(branch_id: str, hour: int) -> dict:
        """
        Uses a Linear Regression model to predict crowd levels.
        Dynamic: Factors in the ACTUAL current waiting count of the branch.
        """
        try:
            # 1. Fetch real-time data from the branch to make the prediction dynamic
            current_waiting = await Token.find(
                Token.branch.id == PydanticObjectId(branch_id),
                In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED, QueueStatus.CALLED, QueueStatus.IN_PROGRESS])
            ).count()

            # 2. Scikit-learn Logic
            # Features: [Hour of Day, Current Active Tokens]
            # Target: Expected additional tokens in the next hour
            # Mock historical training set (Hour, CurrentCount) -> Resulting Load
            X_train = np.array([
                [9, 5], [10, 15], [11, 40], [12, 60], [13, 20], 
                [14, 10], [15, 30], [16, 50], [17, 25], [18, 5]
            ])
            y_train = np.array([10, 20, 50, 70, 25, 15, 35, 60, 20, 8])
            
            model = LinearRegression()
            model.fit(X_train, y_train)
            
            # 3. Predict for current state
            prediction = model.predict(np.array([[hour, current_waiting]]))[0]
            
            # 4. Standardize for Frontend (Must match CitizenPortal.tsx expectations)
            # Frontend expects: crowd_level (HIGH, MEDIUM, LOW) and best_time_to_visit
            if prediction > 45:
                level = "HIGH"
                status = "High Density"
            elif prediction > 20:
                level = "MEDIUM"
                status = "Moderate"
            else:
                level = "LOW"
                status = "Low Traffic"
            
            # 5. Suggest best time (find minimum predicted hour in future)
            future_hours = []
            for h in range(hour + 1, 19):
                # Predict assuming current waiting count stays similar or decreases
                future_hours.append([h, max(0, current_waiting - (h - hour)*5)])
            
            if future_hours:
                future_preds = model.predict(np.array(future_hours))
                best_hour = range(hour + 1, 19)[np.argmin(future_preds)]
                best_time = f"{best_hour}:00"
            else:
                best_time = "Tomorrow Morning"

            return {
                "crowd_level": level,  # Match frontend uppercase
                "crowd_status": status,
                "predicted_load": max(0, int(prediction)),
                "best_time_to_visit": best_time,
                "current_waiting_count": current_waiting,
                "model": "LinearRegression (sklearn)"
            }

        except Exception as e:
            logger.error(f"ML Error: {e}")
            return {
                "crowd_level": "LOW",
                "best_time_to_visit": "Now",
                "error": str(e)
            }
