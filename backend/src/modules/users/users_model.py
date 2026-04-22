from typing import Optional
from beanie import Document, Indexed
from src.common.constants.enums import UserRole

class User(Document):
    phone: Indexed(str, unique=True) # type: ignore
    name: Optional[str] = None
    language_pref: str = "en"
    role: UserRole = UserRole.CITIZEN
    hashed_password: Optional[str] = None

    class Settings:
        name = "users"
