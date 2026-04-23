from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field
from beanie import PydanticObjectId
from src.common.constants.enums import QueueStatus, BookingType


def serialize_token(token) -> dict:
    """Safely serialize a Token Beanie Document into a clean JSON-friendly dict.
    Handles Link fields that may or may not be fetched."""
    def _resolve_link(obj):
        if obj is None:
            return None
        # Fully fetched Beanie Document
        if hasattr(obj, "id") and hasattr(obj, "model_fields"):
            result = {"id": str(obj.id)}
            if hasattr(obj, "name") and obj.name is not None:
                result["name"] = obj.name
            if hasattr(obj, "phone") and obj.phone is not None:
                result["phone"] = obj.phone
            if hasattr(obj, "role") and obj.role is not None:
                result["role"] = obj.role.value if hasattr(obj.role, "value") else str(obj.role)
            if hasattr(obj, "base_duration_minutes") and obj.base_duration_minutes is not None:
                result["base_duration_minutes"] = obj.base_duration_minutes
            if hasattr(obj, "lat") and obj.lat is not None:
                result["lat"] = obj.lat
                result["lng"] = getattr(obj, "lng", None)
            if hasattr(obj, "active_desks") and obj.active_desks is not None:
                result["active_desks"] = obj.active_desks
            return result
        # Unfetched Link ref (DBRef or Beanie Link wrapper)
        if hasattr(obj, "ref"):
            return {"id": str(obj.ref.id)}
        if hasattr(obj, "id"):
            return {"id": str(obj.id)}
        return None

    data = {
        "id": str(token.id),
        "token_number": token.token_number,
        "user": _resolve_link(token.user),
        "branch": _resolve_link(token.branch),
        "service": _resolve_link(token.service),
        "booking_type": token.booking_type.value if hasattr(token.booking_type, "value") else str(token.booking_type),
        "status": token.status.value if hasattr(token.status, "value") else str(token.status),
        "priority": token.priority,
        "desk_number": token.desk_number,
        "expected_service_time": token.expected_service_time.isoformat() if token.expected_service_time else None,
        "actual_start_time": token.actual_start_time.isoformat() if token.actual_start_time else None,
        "actual_end_time": token.actual_end_time.isoformat() if token.actual_end_time else None,
        "delay_reported_minutes": token.delay_reported_minutes,
        "rating": token.rating,
        "notes": token.notes,
        "created_at": token.created_at.isoformat() if token.created_at else None,
    }
    return data



class TokenResponse(BaseModel):
    id: Optional[str] = None
    token_number: str
    user: Optional[dict] = None
    branch: Optional[dict] = None
    service: Optional[dict] = None
    booking_type: str = "WALK_IN"
    status: QueueStatus
    priority: int = 5
    desk_number: Optional[int] = None
    expected_service_time: Optional[str] = None
    actual_start_time: Optional[str] = None
    actual_end_time: Optional[str] = None
    delay_reported_minutes: Optional[int] = None
    rating: Optional[int] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None

    class Config:
        from_attributes = True


class AdvanceTokenRequest(BaseModel):
    new_status: QueueStatus
    desk_number: Optional[int] = None


class WalkInRequest(BaseModel):
    phone: str = "0000000000"
    name: str = "Walk-in Citizen"
    service_id: Optional[str] = None
    branch_id: Optional[str] = None


class TransferRequest(BaseModel):
    target_branch_id: str


class CheckInRequest(BaseModel):
    token_number: str


class DelayReportRequest(BaseModel):
    delay_minutes: int = Field(ge=1, le=120)


class FeedbackRequest(BaseModel):
    rating: int = Field(ge=1, le=5)


class AnalyticsResponse(BaseModel):
    active_desks: int = 0
    total_desks: int = 0
    avg_wait_minutes: float = 0.0
    tokens_served_today: int = 0
    tokens_waiting: int = 0
    no_show_count: int = 0
    no_show_percentage: float = 0.0
    rush_mode: bool = False


class BranchResponse(BaseModel):
    id: str
    name: str
    lat: float = 0.0
    lng: float = 0.0
    active_desks: int = 1
    total_desks: int = 1 # Capacity
    rush_mode: bool = False


class ServiceResponse(BaseModel):
    id: str
    name: str
    base_duration_minutes: int = 10
    priority_level: int = 2
    required_docs: List[str] = []
