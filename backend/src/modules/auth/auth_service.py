from src.modules.users.users_model import User
from src.common.security import verify_password, get_password_hash
from src.common.exceptions.handlers import QueueOSException
from src.common.constants.enums import UserRole

class AuthService:
    @staticmethod
    async def authenticate_user(phone: str, password: str) -> User:
        user = await User.find_one({"phone": phone})
        if not user or not user.hashed_password:
            raise QueueOSException(401, "Incorrect phone number or password")
        if not verify_password(password, user.hashed_password):
            raise QueueOSException(401, "Incorrect phone number or password")
        return user

    @staticmethod
    async def authenticate_citizen(phone: str) -> User:
        user = await User.find_one({"phone": phone})
        if not user:
            user = User(phone=phone, name="Citizen", role=UserRole.CITIZEN)
            await user.save()
        return user

    @staticmethod
    async def register_citizen(name: str, phone: str, password: str) -> User:
        user = await User.find_one({"phone": phone})
        if user:
            if user.hashed_password:
                raise QueueOSException(400, "User with this phone number is already registered.")
            # If user exists but has no password (e.g. from a walk-in), upgrade them
            user.name = name
            user.hashed_password = get_password_hash(password)
            await user.save()
            return user
        
        # New user
        user = User(
            phone=phone, 
            name=name, 
            role=UserRole.CITIZEN, 
            hashed_password=get_password_hash(password)
        )
        await user.save()
        return user
