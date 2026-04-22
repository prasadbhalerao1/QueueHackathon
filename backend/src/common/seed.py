import logging
from src.modules.users.users_model import User
from src.modules.queue.queue_model import Branch, Service
from src.common.constants.enums import UserRole
from src.common.security import get_password_hash

logger = logging.getLogger(__name__)

async def seed_demo_data():
    # Seed Users
    admin = await User.find_one({"role": UserRole.ADMIN})
    if not admin:
        logger.info("Seeding demo users...")
        users = [
            User(phone="9999999999", name="Admin Manager", role=UserRole.ADMIN, hashed_password=get_password_hash("password123")),
            User(phone="8888888888", name="Desk Officer", role=UserRole.OFFICER, hashed_password=get_password_hash("password123")),
            User(phone="7777777777", name="Citizen John", role=UserRole.CITIZEN, hashed_password=get_password_hash("password123"))
        ]
        for u in users:
            await u.save()
        logger.info("User seeding complete.")

    # Seed Branches
    branch = await Branch.find_one()
    if not branch:
        logger.info("Seeding demo branches...")
        branches = [
            Branch(name="Main Branch CFC", lat=19.076, lng=72.8777, active_desks=5),
            Branch(name="West Branch CFC", lat=19.0596, lng=72.8295, active_desks=3),
            Branch(name="North Branch CFC", lat=19.1136, lng=72.8697, active_desks=2),
        ]
        for b in branches:
            await b.save()
        logger.info("Branch seeding complete.")

    # Seed Services
    service = await Service.find_one()
    if not service:
        logger.info("Seeding demo services...")
        services = [
            Service(name="General Service", base_duration_minutes=10, priority_level=3),
            Service(name="Income Certificate", base_duration_minutes=15, priority_level=2, required_docs=["Aadhaar Card", "Salary Slip"]),
            Service(name="Driving License", base_duration_minutes=20, priority_level=2, required_docs=["Aadhaar Card", "Address Proof", "Passport Photo"]),
            Service(name="Property Tax Payment", base_duration_minutes=10, priority_level=3, required_docs=["Property Card"]),
            Service(name="Birth Certificate", base_duration_minutes=12, priority_level=2, required_docs=["Hospital Records", "Parent ID"]),
            Service(name="Affidavit", base_duration_minutes=8, priority_level=3, required_docs=["ID Proof"]),
        ]
        for s in services:
            await s.save()
        logger.info("Service seeding complete.")
