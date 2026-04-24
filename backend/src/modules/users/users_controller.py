from src.modules.users.users_model import User
from src.modules.users.users_schema import OfficerAvailabilityUpdate
from src.common.exceptions.handlers import QueueOSException
from beanie import PydanticObjectId

class UsersController:
    @staticmethod
    async def update_availability(user_id: str, req: OfficerAvailabilityUpdate):
        try:
            user = await User.get(PydanticObjectId(user_id))
            if not user:
                raise QueueOSException(404, "User not found")
            user.is_available = req.is_available
            await user.save()
            return {"status": "success", "message": "Availability updated", "is_available": user.is_available}
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))
