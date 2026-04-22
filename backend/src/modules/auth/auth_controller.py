from datetime import timedelta
from src.modules.auth.auth_service import AuthService
from src.modules.auth.auth_schema import LoginRequest, TokenResponse
from src.common.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES

class AuthController:
    @staticmethod
    async def login(request: LoginRequest) -> dict:
        user = await AuthService.authenticate_user(request.phone, request.password)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(subject=user.phone, expires_delta=access_token_expires)
        
        response = TokenResponse(
            access_token=access_token,
            role=user.role,
            user_name=user.name,
            user_id=str(user.id)
        )
        return {"status": "success", "data": response.model_dump(by_alias=True) if hasattr(response, "model_dump") else response}

    @staticmethod
    async def citizen_login(request: dict) -> dict:
        # Request is passed as CitizenLoginRequest schema, so request.phone
        user = await AuthService.authenticate_citizen(request.phone)
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(subject=user.phone, expires_delta=access_token_expires)
        
        response = TokenResponse(
            access_token=access_token,
            role=user.role,
            user_name=user.name,
            user_id=str(user.id)
        )
        return {"status": "success", "data": response.model_dump(by_alias=True) if hasattr(response, "model_dump") else response}
