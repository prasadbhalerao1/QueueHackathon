from fastapi import APIRouter, Depends
from src.modules.users.users_controller import UsersController
from src.modules.users.users_schema import OfficerAvailabilityUpdate
from src.modules.auth.auth_deps import RoleChecker
from src.common.constants.enums import UserRole

users_router = APIRouter()

@users_router.patch("/{user_id}/availability", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def update_availability(user_id: str, req: OfficerAvailabilityUpdate):
    return await UsersController.update_availability(user_id, req)
