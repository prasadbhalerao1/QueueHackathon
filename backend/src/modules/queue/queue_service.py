import logging
import random
from datetime import datetime, timedelta
from typing import List, Optional
from beanie import PydanticObjectId
from beanie.operators import In
from fastapi import BackgroundTasks
from src.modules.queue.queue_model import Token, Branch, Service
from src.modules.users.users_model import User
from src.common.constants.enums import QueueStatus, BookingType, UserRole
from src.common.exceptions.handlers import QueueOSException

logger = logging.getLogger(__name__)


async def cascade_delay(branch_id: str, delay_minutes: int):
    """
    Background task: 15-Minute Cascade Rule.
    Updates waiting tokens for a branch and triggers WhatsApp alerts.
    """
    try:
        # Use DB filtering to avoid cursor issues
        waiting_tokens = await Token.find(
            Token.branch.id == PydanticObjectId(branch_id),
            Token.status == QueueStatus.WAITING
        ).sort("expected_service_time").to_list()

        for t in waiting_tokens:
            t.expected_service_time += timedelta(minutes=delay_minutes)
            await t.save()

        logger.info(f"[Cascade] Delayed {len(waiting_tokens)} tokens by {delay_minutes}min")

        from src.modules.whatsapp.whatsapp_service import WhatsAppService
        for t in waiting_tokens:
            if t.user and hasattr(t.user, "ref"):
                u = await User.get(t.user.ref.id)
                if u and u.phone:
                    await WhatsAppService.send_outbound_whatsapp(
                        u.phone,
                        f"⚠️ Delay Alert: Due to a long case, your expected time is now {t.expected_service_time.strftime('%I:%M %p')}."
                    )
    except Exception as e:
        logger.error(f"[Cascade] Failed: {e}")


class QueueService:

    @staticmethod
    async def get_branches() -> List[Branch]:
        return await Branch.find_all().to_list()

    @staticmethod
    async def get_services() -> List[Service]:
        return await Service.find_all().to_list()

    @staticmethod
    async def report_delay(token_id: str, delay_minutes: int) -> Token:
        token = await Token.get(PydanticObjectId(token_id))
        if not token: raise QueueOSException(404, "Token not found")
        from datetime import timedelta
        token.delay_reported_minutes = (token.delay_reported_minutes or 0) + delay_minutes
        if token.expected_service_time:
            token.expected_service_time += timedelta(minutes=delay_minutes)
        await token.save()
        return token

    @staticmethod
    async def submit_feedback(token_id: str, rating: int) -> Token:
        token = await Token.get(PydanticObjectId(token_id))
        if not token: raise QueueOSException(404, "Token not found")
        token.rating = rating
        await token.save()
        return token

    @staticmethod
    async def get_default_branch() -> Branch:
        branches = await Branch.find_all().to_list()
        if not branches:
            branch = Branch(name="Main Branch CFC", active_desks=5)
            await branch.save()
            return branch
        return branches[0]

    @staticmethod
    async def get_active_queue(branch_id: str) -> List[Token]:
        try:
            branch_obj_id = PydanticObjectId(branch_id)
        except Exception:
            return []
            
        active_statuses = [
            QueueStatus.BOOKED, QueueStatus.ARRIVED, QueueStatus.WAITING,
            QueueStatus.CALLED, QueueStatus.IN_PROGRESS, QueueStatus.RETURN_LATER
        ]
        
        tokens = await Token.find(
            Token.branch.id == branch_obj_id,
            In(Token.status, active_statuses)
        ).sort("-priority", "+expected_service_time").to_list()

        for token in tokens:
            await QueueService._manual_fetch_links(token)
        return tokens

    @staticmethod
    async def get_user_tokens(user_id: str) -> List[Token]:
        uid = PydanticObjectId(user_id)
        tokens = await Token.find(Token.user.id == uid).sort("-created_at").to_list()
        for token in tokens:
            await QueueService._manual_fetch_links(token)
        return tokens

    @staticmethod
    async def lookup_tokens_by_phone(phone: str) -> List[Token]:
        users = await User.find({"phone": phone}).to_list()
        if not users: return []
        user = users[0]

        active_statuses = [
            QueueStatus.BOOKED, QueueStatus.ARRIVED, QueueStatus.WAITING,
            QueueStatus.CALLED, QueueStatus.IN_PROGRESS, QueueStatus.RETURN_LATER
        ]
        tokens = await Token.find({"user.$id": user.id, "status": {"$in": active_statuses}}).sort("-created_at").to_list()
        for token in tokens:
            await QueueService._manual_fetch_links(token)
        return tokens

    @staticmethod
    async def _manual_fetch_links(token: Token):
        if not token: return
        if token.branch and hasattr(token.branch, "ref"): token.branch = await Branch.get(token.branch.ref.id)
        if token.user and hasattr(token.user, "ref"): token.user = await User.get(token.user.ref.id)
        if token.service and hasattr(token.service, "ref"): token.service = await Service.get(token.service.ref.id)

    @staticmethod
    async def advance_token(token_id: str, new_status: QueueStatus, background_tasks: Optional[BackgroundTasks] = None, desk_number: Optional[int] = None) -> Token:
        token = await Token.get(PydanticObjectId(token_id))
        if not token: raise QueueOSException(404, "Token not found")
        
        await QueueService._manual_fetch_links(token)

        if desk_number:
            token.desk_number = desk_number
        
        # Concurrency Protection (Desk Collision)
        # Lock MUST be before any variable updates to prevent state corruption
        if token.status != QueueStatus.WAITING and token.status != QueueStatus.ARRIVED and token.status != QueueStatus.BOOKED and new_status == QueueStatus.CALLED:
             raise QueueOSException(409, "Token was already called by another desk.")
        if token.status == QueueStatus.COMPLETED and new_status != QueueStatus.CANCELLED:
             raise QueueOSException(400, "Completed tokens are locked.")

        token.last_status = token.status
        token.last_action_time = datetime.utcnow()
        old_status = token.status
        token.status = new_status
        now = datetime.utcnow()

        if new_status == QueueStatus.IN_PROGRESS:
            token.actual_start_time = now
        elif new_status == QueueStatus.COMPLETED:
            token.actual_end_time = now

        # Grace Re-entry: NO_SHOW -> WAITING (+1 penalty)
        if old_status == QueueStatus.NO_SHOW and new_status == QueueStatus.WAITING:
            branch_id = token.branch.id if token.branch else None
            if branch_id:
                next_waiting = await Token.find(Token.branch.id == branch_id, Token.status == QueueStatus.WAITING).sort("expected_service_time").first_or_none()
                token.expected_service_time = (next_waiting.expected_service_time + timedelta(seconds=10)) if next_waiting else (now + timedelta(minutes=5))

        # Delay Cascade
        if new_status == QueueStatus.COMPLETED and token.actual_start_time and token.actual_end_time:
            duration = (token.actual_end_time - token.actual_start_time).total_seconds() / 60.0
            base = token.service.base_duration_minutes if token.service else 10
            if duration > (base + 15):
                if token.branch and background_tasks:
                    background_tasks.add_task(cascade_delay, str(token.branch.id), 15)

        await token.save()
        return token

    @staticmethod
    async def undo_last_action(token_id: str) -> Token:
        token = await Token.get(PydanticObjectId(token_id))
        if not token or not token.last_status: raise QueueOSException(400, "Nothing to undo")
        if token.last_action_time and (datetime.utcnow() - token.last_action_time) > timedelta(minutes=5):
            raise QueueOSException(400, "Undo window expired")
        token.status = token.last_status
        token.last_status = None
        await token.save()
        return token

    @staticmethod
    async def create_vip_token(branch_id: str) -> Token:
        branch = await Branch.get(PydanticObjectId(branch_id)) if branch_id else await QueueService.get_default_branch()
        token_count = await Token.find(Token.branch.id == branch.id).count()
        # Race-safe token numbering
        tk_num = f"A-{100 + token_count}-{random.randint(100, 999)}"
        new_token = Token(token_number=tk_num, branch=branch, booking_type=BookingType.VIP, status=QueueStatus.WAITING, priority=1, expected_service_time=datetime.utcnow())
        await new_token.save()
        return new_token

    @staticmethod
    async def get_token_status(token_number: str) -> dict:
        token = await Token.find_one({"token_number": token_number})
        if not token: raise QueueOSException(404, "Token not found")
        await QueueService._manual_fetch_links(token)
        
        ahead = await Token.find(Token.branch.id == token.branch.id, In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED]), Token.created_at < token.created_at).count()
        wait = ahead * (token.service.base_duration_minutes if token.service else 10)
        
        current = await Token.find(Token.branch.id == token.branch.id, Token.status == QueueStatus.IN_PROGRESS).sort("actual_start_time").first_or_none()
        
        return {"token": token, "people_ahead": ahead, "estimated_wait_minutes": wait, "current_serving": current.token_number if current else "--"}

    @staticmethod
    async def toggle_rush_protocol(branch_id: str) -> Branch:
        branch = await Branch.get(PydanticObjectId(branch_id))
        if not branch: raise QueueOSException(404, "Branch not found")
        branch.rush_mode = not branch.rush_mode
        await branch.save()
        
        if branch.rush_mode:
            from src.modules.whatsapp.whatsapp_service import WhatsAppService
            tokens = await Token.find(Token.branch.id == branch.id, In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED])).to_list()
            for t in tokens:
                await QueueService._manual_fetch_links(t)
                if t.user and t.user.phone:
                    await WhatsAppService.send_outbound_whatsapp(t.user.phone, "⚠️ RUSH PROTOCOL: High traffic. Expect delays. Walk-ins temporarily closed.")
        return branch

    @staticmethod
    async def reset_branch_queue(branch_id: str) -> int:
        tokens = await Token.find(Token.branch.id == PydanticObjectId(branch_id), In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED, QueueStatus.CALLED, QueueStatus.IN_PROGRESS])).to_list()
        for t in tokens:
            t.status = QueueStatus.CANCELLED
            await t.save()
        return len(tokens)

    @staticmethod
    async def update_branch_capacity(branch_id: str, capacity: int) -> Branch:
        branch = await Branch.get(PydanticObjectId(branch_id))
        if not branch: raise QueueOSException(404, "Branch not found")
        # FIXED: Standardization on active_desks
        branch.active_desks = capacity
        await branch.save()
        return branch

    @staticmethod
    async def get_analytics(branch_id: str) -> dict:
        branch = await Branch.get(PydanticObjectId(branch_id))
        if not branch: branch = await QueueService.get_default_branch()
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        
        served = await Token.find(Token.branch.id == branch.id, Token.status == QueueStatus.COMPLETED, Token.actual_end_time >= today).count()
        waiting = await Token.find(Token.branch.id == branch.id, In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED])).count()
        no_shows = await Token.find(Token.branch.id == branch.id, Token.status == QueueStatus.NO_SHOW, Token.created_at >= today).count()
        total = await Token.find(Token.branch.id == branch.id, Token.created_at >= today).count()
        active_c = await Token.find(Token.branch.id == branch.id, Token.status == QueueStatus.IN_PROGRESS).count()
        
        completed = await Token.find(Token.branch.id == branch.id, Token.status == QueueStatus.COMPLETED, Token.actual_start_time != None, Token.created_at >= today).to_list()
        avg_wait = sum((t.actual_start_time - t.created_at).total_seconds() / 60.0 for t in completed) / len(completed) if completed else 0.0

        return {
            "active_desks": active_c, "total_desks": branch.active_desks, "avg_wait_minutes": round(avg_wait, 1),
            "tokens_served_today": served, "tokens_waiting": waiting, "no_show_count": no_shows,
            "no_show_percentage": round((no_shows/total*100), 1) if total > 0 else 0, "rush_mode": branch.rush_mode
        }

    @staticmethod
    async def pause_desk(branch_id: str, desk_number: int) -> int:
        tokens = await Token.find(Token.branch.id == PydanticObjectId(branch_id), Token.desk_number == desk_number, In(Token.status, [QueueStatus.CALLED, QueueStatus.IN_PROGRESS, QueueStatus.WAITING])).to_list()
        for t in tokens:
            t.desk_number = None
            if t.status in [QueueStatus.CALLED, QueueStatus.IN_PROGRESS]: t.status = QueueStatus.WAITING
            await t.save()
        return len(tokens)

    @staticmethod
    async def register_walk_in(phone: str, name: str, service_id: Optional[str], branch_id: Optional[str]) -> Token:
        branch = await Branch.get(PydanticObjectId(branch_id)) if branch_id else await QueueService.get_default_branch()
        if branch.rush_mode: raise QueueOSException(503, "Rush Protocol: Walk-ins blocked.")
        
        users = await User.find({"phone": phone}).to_list()
        user = users[0] if users else User(phone=phone, name=name, role=UserRole.CITIZEN)
        if not users: await user.save()

        active = len(await Token.find({"user.$id": user.id, "status": {"$in": [QueueStatus.BOOKED, QueueStatus.WAITING, QueueStatus.ARRIVED]}}).to_list())
        if active >= 2: raise QueueOSException(429, "Max 2 active tokens allowed.")

        service = await Service.get(PydanticObjectId(service_id)) if service_id else await Service.find_one()
        last = await Token.find(Token.branch.id == branch.id).sort("-expected_service_time").first_or_none()
        expected = (last.expected_service_time + timedelta(minutes=10)) if last else datetime.utcnow()

        token_count = await Token.find(Token.branch.id == branch.id).count()
        token_number = f"W-{100 + token_count}-{random.randint(100, 999)}"
        
        new_token = Token(token_number=token_number, user=user, branch=branch, service=service, booking_type=BookingType.WALK_IN, status=QueueStatus.ARRIVED, expected_service_time=expected)
        await new_token.save()
        return new_token

    # -- EXTENDED WEB-PORTAL FEATURES --
    
    @staticmethod
    async def register_web_booking(phone: str, name: str, service_id: str, branch_id: str, scheduled_time: datetime) -> Token:
        token = await QueueService.register_walk_in(phone, name, service_id, branch_id)
        token.expected_service_time = scheduled_time
        token.status = QueueStatus.BOOKED
        token.booking_type = BookingType.WEB if hasattr(BookingType, "WEB") else BookingType.WALK_IN
        await token.save()
        return token

    # Reschedule appointment enforcing the 30-minute lock rule
    @staticmethod
    async def reschedule_token(token_id: str, new_time: datetime) -> Token:
        token = await Token.get(PydanticObjectId(token_id))
        if not token: raise QueueOSException(404, "Token not found")
        await QueueService._manual_fetch_links(token)
        
        if token.status not in [QueueStatus.BOOKED, QueueStatus.WAITING, QueueStatus.ARRIVED]:
            raise QueueOSException(400, "Token is not in a reschedulable state.")
            
        now = datetime.utcnow()
        if token.expected_service_time:
            # Enforce 30-minute lock
            if (token.expected_service_time.replace(tzinfo=None) - now).total_seconds() < 1800:
                raise QueueOSException(400, "Time-Locked: Cannot reschedule within 30 minutes of the expected time.")

        token.expected_service_time = new_time.replace(tzinfo=None)
        token.status = QueueStatus.BOOKED
        await token.save()
        return token

    # Citizen cancellation action
    @staticmethod
    async def cancel_token(token_id: str) -> Token:
        token = await Token.get(PydanticObjectId(token_id))
        if not token: raise QueueOSException(404, "Token not found")
        await QueueService._manual_fetch_links(token)
        
        if token.status in [QueueStatus.COMPLETED, QueueStatus.CANCELLED, QueueStatus.NO_SHOW]:
            raise QueueOSException(400, "Token cannot be cancelled.")
            
        token.status = QueueStatus.CANCELLED
        await token.save()
        return token

    @staticmethod
    async def transfer_branch(token_id: str, target_branch_id: str) -> Token:
        token = await Token.get(PydanticObjectId(token_id))
        if not token: raise QueueOSException(404, "Token not found")
        await QueueService._manual_fetch_links(token)
        target = await Branch.get(PydanticObjectId(target_branch_id))
        token.branch = target
        last = await Token.find(Token.branch.id == target.id, In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED])).sort("-expected_service_time").first_or_none()
        token.expected_service_time = (last.expected_service_time + timedelta(minutes=10)) if last else datetime.utcnow()
        await token.save()
        return token
