from fastapi import APIRouter
from src.modules.auth.auth_controller import AuthController
from src.modules.auth.auth_schema import LoginRequest, CitizenLoginRequest, RegisterRequest

auth_router = APIRouter()

@auth_router.post("/login")
async def login(request: LoginRequest):
    return await AuthController.login(request)

@auth_router.post("/citizen-login")
async def citizen_login(request: CitizenLoginRequest):
    return await AuthController.citizen_login(request)

@auth_router.post("/register")
async def register(request: RegisterRequest):
    return await AuthController.register(request)
