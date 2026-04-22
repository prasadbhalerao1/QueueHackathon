from fastapi import BackgroundTasks
from src.common.exceptions.handlers import QueueOSException
from src.modules.queue.queue_service import QueueService
from src.modules.queue.queue_schema import (
    AdvanceTokenRequest, WalkInRequest, TransferRequest,
    CheckInRequest, DelayReportRequest, FeedbackRequest,
    serialize_token
)


class QueueController:
    @staticmethod
    async def get_active_queue(branch_id: str):
        try:
            tokens = await QueueService.get_active_queue(branch_id)
            return {
                "status": "success",
                "data": [serialize_token(t) for t in tokens]
            }
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def get_my_tokens(user):
        try:
            tokens = await QueueService.get_user_tokens(str(user.id))
            return {
                "status": "success",
                "data": [serialize_token(t) for t in tokens]
            }
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def advance_token(token_id: str, req: AdvanceTokenRequest, background_tasks: BackgroundTasks):
        try:
            token = await QueueService.advance_token(token_id, req.new_status, background_tasks)
            return {
                "status": "success",
                "data": serialize_token(token)
            }
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def register_walk_in(req: WalkInRequest):
        try:
            token = await QueueService.register_walk_in(req.phone, req.name, req.service_id, req.branch_id)
            return {
                "status": "success",
                "data": serialize_token(token)
            }
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def get_analytics(branch_id: str):
        try:
            data = await QueueService.get_analytics(branch_id)
            return {"status": "success", "data": data}
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def transfer_branch(token_id: str, req: TransferRequest):
        try:
            token = await QueueService.transfer_branch(token_id, req.target_branch_id)
            return {"status": "success", "data": serialize_token(token)}
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def check_in(req: CheckInRequest):
        try:
            token = await QueueService.check_in(req.token_number)
            return {"status": "success", "data": serialize_token(token)}
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def report_delay(token_id: str, req: DelayReportRequest):
        try:
            token = await QueueService.report_delay(token_id, req.delay_minutes)
            return {"status": "success", "data": serialize_token(token)}
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def submit_feedback(token_id: str, req: FeedbackRequest):
        try:
            token = await QueueService.submit_feedback(token_id, req.rating)
            return {"status": "success", "data": serialize_token(token)}
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def toggle_rush_protocol(branch_id: str):
        try:
            branch = await QueueService.toggle_rush_protocol(branch_id)
            return {
                "status": "success",
                "data": {
                    "id": str(branch.id),
                    "name": branch.name,
                    "rush_mode": branch.rush_mode
                }
            }
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def get_branches():
        try:
            branches = await QueueService.get_branches()
            return {
                "status": "success",
                "data": [
                    {"id": str(b.id), "name": b.name, "lat": b.lat, "lng": b.lng,
                     "active_desks": b.active_desks, "rush_mode": b.rush_mode}
                    for b in branches
                ]
            }
        except Exception as e:
            raise QueueOSException(500, str(e))

    @staticmethod
    async def get_services():
        try:
            services = await QueueService.get_services()
            return {
                "status": "success",
                "data": [
                    {"id": str(s.id), "name": s.name, "base_duration_minutes": s.base_duration_minutes,
                     "priority_level": s.priority_level, "required_docs": s.required_docs}
                    for s in services
                ]
            }
        except Exception as e:
            raise QueueOSException(500, str(e))

    @staticmethod
    async def create_vip_token(branch_id: str):
        try:
            token = await QueueService.create_vip_token(branch_id)
            return {"status": "success", "data": serialize_token(token)}
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))

    @staticmethod
    async def track_token(token_number: str):
        try:
            status_data = await QueueService.get_token_status(token_number)
            return {
                "status": "success",
                "data": {
                    "token": serialize_token(status_data["token"]),
                    "people_ahead": status_data["people_ahead"],
                    "estimated_wait_minutes": status_data["estimated_wait_minutes"],
                    "current_serving": status_data["current_serving"]
                }
            }
        except Exception as e:
            if isinstance(e, QueueOSException):
                raise e
            raise QueueOSException(500, str(e))
