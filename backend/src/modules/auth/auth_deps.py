from typing import List
from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from src.common.security import SECRET_KEY, ALGORITHM
from src.modules.users.users_model import User
from src.common.constants.enums import UserRole
from src.common.exceptions.handlers import QueueOSException

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        phone: str = payload.get("sub")
        if phone is None:
            raise QueueOSException(401, "Invalid authentication credentials")
    except JWTError:
        raise QueueOSException(401, "Invalid authentication credentials")
    
    user = await User.find_one({"phone": phone})
    if user is None:
        raise QueueOSException(401, "User not found")
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_user)):
        if user.role not in self.allowed_roles:
            raise QueueOSException(403, "Operation not permitted")
        return user
