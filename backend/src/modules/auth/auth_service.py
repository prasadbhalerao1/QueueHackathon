from src.modules.users.users_model import User
from src.common.security import verify_password
from src.common.exceptions.handlers import QueueOSException

class AuthService:
    @staticmethod
    async def authenticate_user(phone: str, password: str) -> User:
        user = await User.find_one({"phone": phone})
        if not user or not user.hashed_password:
            raise QueueOSException(401, "Incorrect phone number or password")
        if not verify_password(password, user.hashed_password):
            raise QueueOSException(401, "Incorrect phone number or password")
        return user
