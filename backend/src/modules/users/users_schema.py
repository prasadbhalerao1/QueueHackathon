from pydantic import BaseModel

class OfficerAvailabilityUpdate(BaseModel):
    is_available: bool
