from fastapi import APIRouter
from src.modules.auth.auth_controller import AuthController
from src.modules.auth.auth_schema import LoginRequest

auth_router = APIRouter()

@auth_router.post("/login")
async def login(request: LoginRequest):
    return await AuthController.login(request)
