from fastapi import APIRouter, BackgroundTasks, Depends
from src.modules.queue.queue_controller import QueueController
from src.modules.queue.queue_schema import (
    AdvanceTokenRequest, WalkInRequest, TransferRequest,
    CheckInRequest, DelayReportRequest, FeedbackRequest,
    WebBookingRequest, RescheduleRequest
)
from src.modules.auth.auth_deps import RoleChecker, get_current_user
from src.common.constants.enums import UserRole

queue_router = APIRouter()


# --- PUBLIC ROUTES (no auth required) ---

@queue_router.post("/web-booking")
async def register_web_booking(request: WebBookingRequest):
    return await QueueController.register_web_booking(request)

@queue_router.patch("/reschedule/{token_id}")
async def reschedule_token(token_id: str, request: RescheduleRequest):
    return await QueueController.reschedule_token(token_id, request)

@queue_router.patch("/cancel/{token_id}")
async def cancel_token(token_id: str):
    return await QueueController.cancel_token(token_id)

@queue_router.get("/branches")
async def get_branches():
    return await QueueController.get_branches()

@queue_router.get("/services")
async def get_services():
    return await QueueController.get_services()

@queue_router.get("/track/{token_number}")
async def track_token(token_number: str):
    return await QueueController.track_token(token_number)

@queue_router.get("/lookup-by-phone")
async def lookup_tokens_by_phone(phone: str):
    """Public endpoint: citizen enters phone number to find their active tokens."""
    return await QueueController.lookup_by_phone(phone)

@queue_router.get("/my-tokens")
async def get_my_tokens(current_user = Depends(get_current_user)):
    return await QueueController.get_my_tokens(current_user)


# --- STAFF/ADMIN ROUTES ---

@queue_router.post("/walk-in", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def register_walk_in(request: WalkInRequest):
    return await QueueController.register_walk_in(request)

@queue_router.patch("/advance/{token_id}", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def advance_token(token_id: str, request: AdvanceTokenRequest, background_tasks: BackgroundTasks):
    return await QueueController.advance_token(token_id, request, background_tasks)

@queue_router.post("/undo/{token_id}", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def undo_last_action(token_id: str):
    return await QueueController.undo_last_action(token_id)

@queue_router.post("/transfer/{token_id}", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def transfer_branch(token_id: str, request: TransferRequest):
    return await QueueController.transfer_branch(token_id, request)

@queue_router.post("/delay/{token_id}")
async def report_delay(token_id: str, request: DelayReportRequest):
    return await QueueController.report_delay(token_id, request)

@queue_router.post("/feedback/{token_id}")
async def submit_feedback(token_id: str, request: FeedbackRequest):
    return await QueueController.submit_feedback(token_id, request)


# --- ADMIN / DASHBOARD ROUTES ---

@queue_router.get("/analytics/{branch_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def get_analytics(branch_id: str):
    return await QueueController.get_analytics(branch_id)

@queue_router.post("/vip/{branch_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def trigger_vip_override(branch_id: str):
    return await QueueController.create_vip_token(branch_id)

@queue_router.post("/rush/{branch_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def toggle_rush_protocol(branch_id: str):
    return await QueueController.toggle_rush_protocol(branch_id)

@queue_router.post("/pause-desk/{branch_id}/{desk_number}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def pause_desk(branch_id: str, desk_number: int):
    return await QueueController.pause_desk(branch_id, desk_number)

@queue_router.post("/admin/reset/{branch_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def reset_branch_queue(branch_id: str):
    return await QueueController.reset_branch_queue(branch_id)

@queue_router.patch("/admin/branch/{branch_id}/capacity", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def update_branch_capacity(branch_id: str, capacity: int):
    return await QueueController.update_branch_capacity(branch_id, capacity)

@queue_router.post("/admin/seed/demo", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def seed_demo():
    from src.common.seed import seed_demo_data
    await seed_demo_data()
    return {"message": "Demo data seeded successfully!"}


# --- PARAMETERIZED ROUTES LAST ---

@queue_router.get("/{branch_id}")
async def get_active_queue(branch_id: str):
    return await QueueController.get_active_queue(branch_id)
