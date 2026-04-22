from pydantic import BaseModel
from typing import Optional
from src.common.constants.enums import UserRole

class LoginRequest(BaseModel):
    phone: str
    password: str

class CitizenLoginRequest(BaseModel):
    phone: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_name: Optional[str] = None
    user_id: Optional[str] = None
