from typing import Optional, List
from datetime import datetime
from beanie import Document, Link, Indexed
from pydantic import Field
from src.modules.users.users_model import User
from src.common.constants.enums import QueueStatus, BookingType

class Branch(Document):
    name: str
    lat: float = 0.0
    lng: float = 0.0
    active_desks: int = 1
    total_desks: int = 1
    rush_mode: bool = False

    class Settings:
        name = "branches"

class Service(Document):
    name: str
    base_duration_minutes: int = 10
    priority_level: int = 2
    required_docs: List[str] = []

    class Settings:
        name = "services"

class Token(Document):
    token_number: Indexed(str, unique=True)  # type: ignore
    user: Optional[Link[User]] = None
    branch: Optional[Link[Branch]] = None
    service: Optional[Link[Service]] = None
    booking_type: BookingType = BookingType.WALK_IN
    status: QueueStatus = QueueStatus.BOOKED
    priority: int = Field(default=5, ge=1, le=10)
    desk_number: Optional[int] = None
    expected_service_time: datetime = Field(default_factory=datetime.utcnow)
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    delay_reported_minutes: Optional[int] = None
    transfer_from_branch: Optional[Link[Branch]] = None
    rating: Optional[int] = Field(default=None, ge=1, le=5)
    notes: Optional[str] = None
    last_status: Optional[QueueStatus] = None
    last_action_time: Optional[datetime] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "tokens"
