from typing import Optional
from pydantic import BaseModel, Field

class TwilioWebhookRequest(BaseModel):
    From: str
    Body: str

class GeminiIntentSchema(BaseModel):
    intent: str = Field(description="Must be 'BOOKING', 'STATUS', 'CLARIFICATION', or 'HELP'")
    service_name: Optional[str] = Field(description="The name of the service the user wants to book (e.g., 'Aadhaar Update', 'Income Certificate')", default=None)
    language: str = Field(description="The detected language of the user (e.g., 'en', 'hi', 'mr')")
