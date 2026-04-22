from enum import Enum

class QueueStatus(str, Enum):
    BOOKED = "BOOKED"
    ARRIVED = "ARRIVED"
    WAITING = "WAITING"
    CALLED = "CALLED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    NO_SHOW = "NO_SHOW"
    RETURN_LATER = "RETURN_LATER"
    CANCELLED = "CANCELLED"

class UserRole(str, Enum):
    CITIZEN = "CITIZEN"
    OFFICER = "OFFICER"
    ADMIN = "ADMIN"

class BookingType(str, Enum):
    WALK_IN = "WALK_IN"
    WHATSAPP = "WHATSAPP"
    VIP = "VIP"
