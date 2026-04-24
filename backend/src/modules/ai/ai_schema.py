from pydantic import BaseModel

class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class CrowdPredictionResponse(BaseModel):
    crowd_level: str
    overcrowding_probability: int
    best_time_to_visit: str
