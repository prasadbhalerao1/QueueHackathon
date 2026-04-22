from fastapi import APIRouter, BackgroundTasks, Depends
from src.modules.queue.queue_controller import QueueController
from src.modules.queue.queue_schema import (
    AdvanceTokenRequest, WalkInRequest, TransferRequest,
    CheckInRequest, DelayReportRequest, FeedbackRequest
)
from src.modules.auth.auth_deps import RoleChecker
from src.common.constants.enums import UserRole

queue_router = APIRouter()


# --- PUBLIC ROUTES (no auth required) ---

@queue_router.get("/branches")
async def get_branches():
    return await QueueController.get_branches()

@queue_router.get("/services")
async def get_services():
    return await QueueController.get_services()

@queue_router.get("/track/{token_number}")
async def track_token(token_number: str):
    return await QueueController.track_token(token_number)

@queue_router.post("/check-in")
async def check_in(request: CheckInRequest):
    return await QueueController.check_in(request)


# --- STAFF/ADMIN ROUTES ---

@queue_router.post("/walk-in", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def register_walk_in(request: WalkInRequest):
    return await QueueController.register_walk_in(request)

@queue_router.patch("/advance/{token_id}", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def advance_token(token_id: str, request: AdvanceTokenRequest, background_tasks: BackgroundTasks):
    return await QueueController.advance_token(token_id, request, background_tasks)

@queue_router.post("/transfer/{token_id}", dependencies=[Depends(RoleChecker([UserRole.OFFICER, UserRole.ADMIN]))])
async def transfer_branch(token_id: str, request: TransferRequest):
    return await QueueController.transfer_branch(token_id, request)

@queue_router.post("/delay/{token_id}")
async def report_delay(token_id: str, request: DelayReportRequest):
    return await QueueController.report_delay(token_id, request)

@queue_router.post("/feedback/{token_id}")
async def submit_feedback(token_id: str, request: FeedbackRequest):
    return await QueueController.submit_feedback(token_id, request)


# --- ADMIN ONLY ROUTES ---

@queue_router.get("/analytics/{branch_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def get_analytics(branch_id: str):
    return await QueueController.get_analytics(branch_id)

@queue_router.post("/vip/{branch_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def trigger_vip_override(branch_id: str):
    return await QueueController.create_vip_token(branch_id)

@queue_router.post("/rush/{branch_id}", dependencies=[Depends(RoleChecker([UserRole.ADMIN]))])
async def toggle_rush_protocol(branch_id: str):
    return await QueueController.toggle_rush_protocol(branch_id)


# --- PARAMETERIZED ROUTES LAST (to avoid conflicts) ---

@queue_router.get("/{branch_id}")
async def get_active_queue(branch_id: str):
    return await QueueController.get_active_queue(branch_id)
