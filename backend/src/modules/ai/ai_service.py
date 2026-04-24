from src.modules.queue.queue_model import Token, Branch
from beanie import PydanticObjectId
from src.common.constants.enums import QueueStatus
from google import genai
from src.common.config.config import settings

client = genai.Client(api_key=settings.GEMINI_API_KEY)

class AIService:
    @staticmethod
    async def predict_crowd(branch_id: str):
        waiting = await Token.find(Token.branch.id == PydanticObjectId(branch_id), Token.status == QueueStatus.WAITING).count()
        branch = await Branch.get(PydanticObjectId(branch_id))
        desks = branch.active_desks if branch and branch.active_desks > 0 else 1
        
        load_ratio = waiting / desks
        
        from datetime import datetime
        now = datetime.utcnow()
        current_hour = (now.hour + 5.5) % 24 # IST approx
        
        if load_ratio > 5:
            crowd_level = "HIGH"
            prob = min(99, int(load_ratio * 15))
            if 9 <= current_hour < 13:
                best_time = "Today 3:30 PM (Off-Peak)"
            else:
                best_time = "Tomorrow Morning 9:00 AM"
        elif load_ratio > 2:
            crowd_level = "MEDIUM"
            prob = min(60, int(load_ratio * 10))
            if 9 <= current_hour < 13:
                best_time = "Today 3:30 PM"
            else:
                best_time = "Tomorrow 10:00 AM"
        else:
            crowd_level = "LOW"
            prob = min(20, int(load_ratio * 5))
            best_time = "Right Now"
            
        return {
            "crowd_level": crowd_level,
            "overcrowding_probability": prob,
            "best_time_to_visit": best_time
        }

    @staticmethod
    async def ask_bot(message: str):
        import os
        import json
        prompts_dir = os.path.join(os.path.dirname(__file__), '..', '..', '..', 'prompts')
        context_path = os.path.join(prompts_dir, 'context.md')
        services_path = os.path.join(prompts_dir, 'services.json')
        
        try:
            with open(context_path, 'r', encoding='utf-8') as f:
                prompt_context = f.read()
        except Exception:
            prompt_context = "You are QueueOS AI, a smart assistant for Indian Citizen Facilitation Centers."
            
        try:
            with open(services_path, 'r', encoding='utf-8') as f:
                services_data = f.read()
        except Exception:
            services_data = "{}"
            
        system_instruction = (
            "You are QueueOS AI. You must follow the instructions and few-shot examples "
            "provided in the following context exactly to handle user queries:\n\n"
            f"=== CONTEXT.MD ===\n{prompt_context}\n\n"
            f"=== SERVICES.JSON ===\n{services_data}\n"
        )
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=f"{system_instruction}\n\nCitizen: {message}"
        )
        return response.text
