import logging
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
    Loops through all subsequent WAITING tokens for a branch
    and adds the delay to their expected_service_time.
    """
    try:
        waiting_tokens = await Token.find(
            Token.branch.id == PydanticObjectId(branch_id),
            Token.status == QueueStatus.WAITING
        ).sort("expected_service_time").to_list()

        for t in waiting_tokens:
            t.expected_service_time += timedelta(minutes=delay_minutes)
            await t.save()

        logger.info(f"[Cascade] Delayed {len(waiting_tokens)} tokens by {delay_minutes}min at branch {branch_id}")

        # Attempt to send WhatsApp apology notifications
        try:
            from src.modules.whatsapp.whatsapp_service import WhatsAppService
            for t in waiting_tokens:
                if t.user and hasattr(t.user, "phone") and t.user.phone:
                    await WhatsAppService.send_message(
                        t.user.phone,
                        f"We apologize for the delay. Your new expected time is {t.expected_service_time.strftime('%I:%M %p')}."
                    )
        except Exception as notify_err:
            logger.warning(f"[Cascade] WhatsApp notification failed (non-critical): {notify_err}")

    except Exception as e:
        logger.error(f"[Cascade] Failed to cascade delay: {e}")


class QueueService:

    @staticmethod
    async def get_branches() -> List[Branch]:
        return await Branch.find_all().to_list()

    @staticmethod
    async def get_services() -> List[Service]:
        return await Service.find_all().to_list()

    @staticmethod
    async def get_default_branch() -> Branch:
        branch = await Branch.find_one()
        if not branch:
            branch = Branch(name="Main Branch CFC", lat=19.076, lng=72.8777, active_desks=5)
            await branch.save()
        return branch

    @staticmethod
    async def get_active_queue(branch_id: str) -> List[Token]:
        """Fetches the active queue for a branch, ordered by priority then expected_service_time."""
        tokens = await Token.find(
            Token.branch.id == PydanticObjectId(branch_id),
            In(Token.status, [
                QueueStatus.BOOKED,
                QueueStatus.ARRIVED,
                QueueStatus.WAITING,
                QueueStatus.CALLED,
                QueueStatus.IN_PROGRESS,
                QueueStatus.RETURN_LATER
            ]),
            fetch_links=True
        ).sort("+priority", "+expected_service_time").to_list()

        return tokens

    @staticmethod
    async def advance_token(token_id: str, new_status: QueueStatus, background_tasks: Optional[BackgroundTasks] = None) -> Token:
        """Advances the token state, calculates wait times, and triggers cascading delays if necessary."""
        token = await Token.get(PydanticObjectId(token_id), fetch_links=True)
        if not token:
            raise QueueOSException(404, "Token not found")

        old_status = token.status
        token.status = new_status

        now = datetime.utcnow()

        # Update timestamps based on the status transition
        if new_status == QueueStatus.IN_PROGRESS and old_status != QueueStatus.IN_PROGRESS:
            token.actual_start_time = now
        elif new_status == QueueStatus.COMPLETED:
            token.actual_end_time = now

        # Grace Re-entry Rule: If NO_SHOW -> WAITING
        if old_status == QueueStatus.NO_SHOW and new_status == QueueStatus.WAITING:
            branch_id = token.branch.id if token.branch and hasattr(token.branch, "id") else None
            if branch_id:
                active_token = await Token.find(
                    Token.branch.id == branch_id,
                    In(Token.status, [QueueStatus.IN_PROGRESS, QueueStatus.CALLED])
                ).sort("-expected_service_time").first_or_none()

                if active_token:
                    token.expected_service_time = active_token.expected_service_time + timedelta(minutes=1)
                else:
                    token.expected_service_time = now

        # 15-Minute Cascade Rule: IN_PROGRESS -> COMPLETED
        if new_status == QueueStatus.COMPLETED and token.actual_start_time and token.actual_end_time:
            duration = token.actual_end_time - token.actual_start_time
            duration_minutes = duration.total_seconds() / 60.0

            base_duration = 10
            if token.service and hasattr(token.service, "base_duration_minutes"):
                base_duration = token.service.base_duration_minutes

            if duration_minutes > (base_duration + 15):
                branch_id = token.branch.id if token.branch and hasattr(token.branch, "id") else None
                if branch_id and background_tasks:
                    background_tasks.add_task(cascade_delay, str(branch_id), 15)

        # Send WhatsApp notification when token is CALLED
        if new_status == QueueStatus.CALLED and old_status != QueueStatus.CALLED:
            try:
                from src.modules.whatsapp.whatsapp_service import WhatsAppService
                if token.user and hasattr(token.user, "phone") and token.user.phone:
                    desk_msg = f" Desk {token.desk_number}" if token.desk_number else ""
                    await WhatsAppService.send_message(
                        token.user.phone,
                        f"It's your turn! Token {token.token_number}. Please proceed to{desk_msg} now."
                    )
            except Exception as notify_err:
                logger.warning(f"WhatsApp CALLED notification failed (non-critical): {notify_err}")

        await token.save()
        return token

    @staticmethod
    async def create_vip_token(branch_id: str) -> Token:
        branch = await Branch.get(PydanticObjectId(branch_id)) if branch_id and len(branch_id) == 24 else None
        if not branch:
            branch = await QueueService.get_default_branch()

        token_count = await Token.find(Token.branch.id == branch.id).count()
        token_number = f"VIP-{token_count + 1}"

        new_token = Token(
            token_number=token_number,
            branch=branch,
            booking_type=BookingType.VIP,
            status=QueueStatus.WAITING,
            priority=1,
            expected_service_time=datetime.utcnow(),
            notes="VIP Override Protocol",
        )
        await new_token.save()
        return new_token

    @staticmethod
    async def get_token_status(token_number: str) -> dict:
        token = await Token.find_one({"token_number": token_number}, fetch_links=True)
        if not token:
            raise QueueOSException(404, "Token not found")

        people_ahead = 0
        if token.branch and hasattr(token.branch, "id"):
            people_ahead = await Token.find(
                Token.branch.id == token.branch.id,
                In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED]),
                Token.created_at < token.created_at
            ).count()

        # Calculate estimated wait
        estimated_wait_minutes = people_ahead * 10
        if token.service and hasattr(token.service, "base_duration_minutes"):
            estimated_wait_minutes = people_ahead * token.service.base_duration_minutes

        return {
            "token": token,
            "people_ahead": people_ahead,
            "estimated_wait_minutes": estimated_wait_minutes
        }

    @staticmethod
    async def register_walk_in(phone: str, name: str, service_id: Optional[str], branch_id: Optional[str]) -> Token:
        logger.info(f"Registering walk-in for phone {phone} at branch {branch_id}")

        # Check rush mode
        branch = None
        if branch_id and len(branch_id) == 24:
            branch = await Branch.get(PydanticObjectId(branch_id))
        if not branch:
            branch = await QueueService.get_default_branch()

        if branch.rush_mode:
            raise QueueOSException(503, "Rush Protocol is active. New walk-ins are temporarily blocked. Please try again later.")

        user = await User.find_one({"phone": phone})
        if not user:
            user = User(phone=phone, name=name, role=UserRole.CITIZEN)
            await user.save()
        elif name and name != "Walk-in Citizen":
            user.name = name
            await user.save()

        # Anti-spam: max 2 active tokens per phone
        active_count = await Token.find(
            Token.user.id == user.id,
            In(Token.status, [QueueStatus.BOOKED, QueueStatus.WAITING, QueueStatus.ARRIVED])
        ).count()
        if active_count >= 2:
            raise QueueOSException(429, "Maximum 2 active tokens allowed per user.")

        service = None
        if service_id and len(service_id) == 24:
            service = await Service.get(PydanticObjectId(service_id))
        if not service:
            service = await Service.find_one()
        if not service:
            service = Service(name="General Service", base_duration_minutes=10)
            await service.save()

        # Calculate expected time based on last waiting token
        last_waiting = await Token.find(
            Token.branch.id == branch.id,
            In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED])
        ).sort("-expected_service_time").first_or_none()

        now = datetime.utcnow()
        if last_waiting and last_waiting.expected_service_time > now:
            expected_time = last_waiting.expected_service_time + timedelta(minutes=service.base_duration_minutes)
        else:
            expected_time = now + timedelta(minutes=service.base_duration_minutes)

        token_count = await Token.find(Token.branch.id == branch.id).count()
        token_number = f"W-{token_count + 1}"

        new_token = Token(
            token_number=token_number,
            user=user,
            branch=branch,
            service=service,
            booking_type=BookingType.WALK_IN,
            status=QueueStatus.ARRIVED,
            expected_service_time=expected_time
        )
        await new_token.save()
        return new_token

    @staticmethod
    async def get_analytics(branch_id: str) -> dict:
        """Compute real-time analytics for a branch."""
        branch = await Branch.get(PydanticObjectId(branch_id)) if branch_id and len(branch_id) == 24 else None
        if not branch:
            branch = await QueueService.get_default_branch()

        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

        # Tokens served today
        tokens_served = await Token.find(
            Token.branch.id == branch.id,
            Token.status == QueueStatus.COMPLETED,
            Token.actual_end_time >= today_start
        ).count()

        # Currently waiting
        tokens_waiting = await Token.find(
            Token.branch.id == branch.id,
            In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED])
        ).count()

        # No-shows today
        no_show_count = await Token.find(
            Token.branch.id == branch.id,
            Token.status == QueueStatus.NO_SHOW,
            Token.created_at >= today_start
        ).count()

        # Total tokens today
        total_today = await Token.find(
            Token.branch.id == branch.id,
            Token.created_at >= today_start
        ).count()

        no_show_pct = (no_show_count / total_today * 100) if total_today > 0 else 0.0

        # Active desks (count of IN_PROGRESS tokens)
        active_desks = await Token.find(
            Token.branch.id == branch.id,
            Token.status == QueueStatus.IN_PROGRESS
        ).count()

        # Average wait time from completed tokens today
        completed_tokens = await Token.find(
            Token.branch.id == branch.id,
            Token.status == QueueStatus.COMPLETED,
            Token.actual_start_time != None,
            Token.created_at >= today_start
        ).to_list()

        avg_wait = 0.0
        if completed_tokens:
            total_wait = sum(
                (t.actual_start_time - t.created_at).total_seconds() / 60.0
                for t in completed_tokens
                if t.actual_start_time and t.created_at
            )
            avg_wait = total_wait / len(completed_tokens)

        return {
            "active_desks": active_desks,
            "total_desks": branch.active_desks,
            "avg_wait_minutes": round(avg_wait, 1),
            "tokens_served_today": tokens_served,
            "tokens_waiting": tokens_waiting,
            "no_show_count": no_show_count,
            "no_show_percentage": round(no_show_pct, 1),
            "rush_mode": branch.rush_mode
        }

    @staticmethod
    async def transfer_branch(token_id: str, target_branch_id: str) -> Token:
        """Transfer a token from one branch to another."""
        token = await Token.get(PydanticObjectId(token_id), fetch_links=True)
        if not token:
            raise QueueOSException(404, "Token not found")

        target_branch = await Branch.get(PydanticObjectId(target_branch_id))
        if not target_branch:
            raise QueueOSException(404, "Target branch not found")

        # Save reference to original branch
        token.transfer_from_branch = token.branch
        token.branch = target_branch

        # Recalculate expected time for new branch
        last_waiting = await Token.find(
            Token.branch.id == target_branch.id,
            In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED])
        ).sort("-expected_service_time").first_or_none()

        now = datetime.utcnow()
        base_dur = 10
        if token.service and hasattr(token.service, "base_duration_minutes"):
            base_dur = token.service.base_duration_minutes

        if last_waiting and last_waiting.expected_service_time > now:
            token.expected_service_time = last_waiting.expected_service_time + timedelta(minutes=base_dur)
        else:
            token.expected_service_time = now + timedelta(minutes=base_dur)

        token.notes = f"Transferred from another branch"
        await token.save()
        return token

    @staticmethod
    async def check_in(token_number: str) -> Token:
        """QR Check-in: BOOKED -> ARRIVED."""
        token = await Token.find_one({"token_number": token_number})
        if not token:
            raise QueueOSException(404, "Token not found")

        if token.status != QueueStatus.BOOKED:
            raise QueueOSException(400, f"Token is {token.status.value}, expected BOOKED for check-in")

        token.status = QueueStatus.ARRIVED
        await token.save()
        return token

    @staticmethod
    async def report_delay(token_id: str, delay_minutes: int) -> Token:
        """Citizen self-reports delay. Holds their spot."""
        token = await Token.get(PydanticObjectId(token_id))
        if not token:
            raise QueueOSException(404, "Token not found")

        if token.status not in [QueueStatus.BOOKED, QueueStatus.ARRIVED, QueueStatus.WAITING]:
            raise QueueOSException(400, "Can only report delay for active tokens")

        token.delay_reported_minutes = delay_minutes
        token.expected_service_time += timedelta(minutes=delay_minutes)
        token.notes = f"Citizen reported {delay_minutes}min delay"
        await token.save()
        return token

    @staticmethod
    async def submit_feedback(token_id: str, rating: int) -> Token:
        """Citizen submits feedback rating (1-5)."""
        token = await Token.get(PydanticObjectId(token_id))
        if not token:
            raise QueueOSException(404, "Token not found")

        if token.status != QueueStatus.COMPLETED:
            raise QueueOSException(400, "Feedback can only be given for completed tokens")

        token.rating = rating
        await token.save()
        return token

    @staticmethod
    async def toggle_rush_protocol(branch_id: str) -> Branch:
        """Toggle rush mode for a branch."""
        branch = await Branch.get(PydanticObjectId(branch_id)) if branch_id and len(branch_id) == 24 else None
        if not branch:
            branch = await QueueService.get_default_branch()

        branch.rush_mode = not branch.rush_mode
        await branch.save()

        # If rush mode enabled, send mass WhatsApp warning
        if branch.rush_mode:
            try:
                from src.modules.whatsapp.whatsapp_service import WhatsAppService
                waiting_tokens = await Token.find(
                    Token.branch.id == branch.id,
                    In(Token.status, [QueueStatus.WAITING, QueueStatus.ARRIVED, QueueStatus.BOOKED]),
                    fetch_links=True
                ).to_list()
                for t in waiting_tokens:
                    if t.user and hasattr(t.user, "phone") and t.user.phone:
                        await WhatsAppService.send_message(
                            t.user.phone,
                            "⚠️ RUSH PROTOCOL: The office is currently overwhelmed. New walk-ins are temporarily blocked. We apologize for the inconvenience."
                        )
            except Exception as e:
                logger.warning(f"Rush protocol WhatsApp notification failed (non-critical): {e}")

        return branch
