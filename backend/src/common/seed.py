import logging
import random
from datetime import datetime, timedelta
from typing import List
from beanie import PydanticObjectId
from src.modules.users.users_model import User
from src.modules.queue.queue_model import Branch, Service, Token
from src.common.constants.enums import UserRole, QueueStatus, BookingType
from src.common.security import get_password_hash

logger = logging.getLogger(__name__)

async def seed_demo_data():
    logger.info("=== STARTING HEAVY DEMO SEED PASS FOR HACKATHON ===")

    # WIPE OUT EXISTING TO PREVENT CORRUPTION
    await User.find_all().delete()
    await Branch.find_all().delete()
    await Service.find_all().delete()
    await Token.find_all().delete()

    # 1. Staff Members & Admin
    admin_hash = get_password_hash("password")
    users = [
        User(phone="9999999999", name="Super Admin (Hackathon)", role=UserRole.ADMIN, hashed_password=admin_hash),
        User(phone="8888888888", name="Officer Ramesh", role=UserRole.OFFICER, hashed_password=admin_hash),
    ]
    
    # 2. Add 100+ citizens dynamically for extreme realism
    citizen_names = [
        "Aarav", "Priya", "Rahul", "Neha", "Arjun", "Anjali", "Siddharth", "Kavya", 
        "Karan", "Sneha", "Aditya", "Pooja", "Vikram", "Riya", "Rohan", "Shruti",
        "Deepak", "Aisha", "Varun", "Simran", "Amit", "Nisha", "Gaurav", "Megha",
        "Suresh", "Swati", "Nitin", "Shikha", "Manoj", "Kriti"
    ]
    
    for i in range(1, 91): # 90 citizens
        first_name = random.choice(citizen_names)
        last_name = random.choice(["Sharma", "Patel", "Verma", "Singh", "Gupta", "Rao", "Jain", "Desai"])
        phone_num = f"777{str(i).zfill(7)}"
        users.append(User(phone=phone_num, name=f"{first_name} {last_name}", role=UserRole.CITIZEN, hashed_password=admin_hash))

    for u in users:
        await u.save()

    # 3. Branches
    branches = [
        Branch(name="Main Hub - Central Facilitation Center", lat=19.076, lng=72.8777, active_desks=12),
        Branch(name="Ward 6 Regional Office", lat=19.0596, lng=72.8295, active_desks=4)
    ]
    for b in branches:
        await b.save()

    # 4. Services
    services = [
        Service(name="Aadhaar Card Update", base_duration_minutes=10, priority_level=3),
        Service(name="Income Certificate", base_duration_minutes=15, priority_level=2, required_docs=["ID Proof", "Salary Slip", "Affidavit"]),
        Service(name="Property Tax Registration", base_duration_minutes=25, priority_level=2, required_docs=["Title Deed", "ID Proof", "Photos"]),
        Service(name="Water Bill Payment", base_duration_minutes=5, priority_level=3),
        Service(name="Driving License Revival", base_duration_minutes=20, priority_level=1),
    ]
    for s in services:
        await s.save()

    main_branch = branches[0]
    citizens = [u for u in users if u.role == UserRole.CITIZEN]
    now = datetime.utcnow()

    tokens_to_insert = []
    
    # --- DOMINATE SEEDING WITH REAL EDGE CASES ---
    
    # HISTORY (Past 2 Hours) - 20 Completed tokens for analytics padding
    for i in range(20):
        t_service = random.choice(services)
        actual_start = now - timedelta(minutes=150 - i*6)
        actual_finish = actual_start + timedelta(minutes=t_service.base_duration_minutes + random.randint(-2, 3))
        
        tokens_to_insert.append(Token(
            token_number=f"A-{100+i}", branch=main_branch, service=t_service,
            user=citizens[i], booking_type=random.choice([BookingType.WALK_IN, BookingType.WHATSAPP]), 
            status=QueueStatus.COMPLETED, priority=3, 
            expected_service_time=actual_start,
            actual_start_time=actual_start,
            actual_end_time=actual_finish
        ))

    # ACTIVE DESKS (IN_PROGRESS) - Simulation of current staff working
    tokens_to_insert.append(Token(
        token_number="A-120", branch=main_branch, service=services[2], user=citizens[20],
        booking_type=BookingType.WALK_IN, status=QueueStatus.IN_PROGRESS, priority=3,
        expected_service_time=now - timedelta(minutes=5), actual_start_time=now - timedelta(minutes=5), desk_number=1
    ))
    tokens_to_insert.append(Token(
        token_number="A-121", branch=main_branch, service=services[0], user=citizens[21],
        booking_type=BookingType.WHATSAPP, status=QueueStatus.IN_PROGRESS, priority=3,
        expected_service_time=now - timedelta(minutes=1), actual_start_time=now - timedelta(minutes=1), desk_number=2
    ))

    # THE WAITING LINE (40 people waiting)
    for i in range(22, 62):
        status = QueueStatus.WAITING
        
        # Inject Specific UI Edge Cases explicitly
        if i == 23: status = QueueStatus.CALLED  # Next person explicitly called
        if i == 25: status = QueueStatus.NO_SHOW # Person missed their turn
        if i == 28: status = QueueStatus.RETURN_LATER # Forget docs, put on hold
        
        # Gradual time staggering
        t_service = random.choice(services)
        est_time = now + timedelta(minutes=(i-21)*t_service.base_duration_minutes)
        
        tokens_to_insert.append(Token(
            token_number=f"A-{100+i}", branch=main_branch, service=t_service,
            user=citizens[i], booking_type=random.choice([BookingType.WHATSAPP, BookingType.WALK_IN]), 
            status=status, priority=3, expected_service_time=est_time
        ))

    # THE VIP CORRUPTION (Hackathon Edge Case #1: Overriding)
    tokens_to_insert.append(Token(
        token_number="VIP-001", branch=main_branch, service=services[4], user=citizens[63],
        booking_type=BookingType.VIP, status=QueueStatus.WAITING, priority=1,
        expected_service_time=now + timedelta(minutes=1), notes="Minister Signature Priority."
    ))

    for t in tokens_to_insert:
         await t.save()

    logger.info(f"Loaded {len(tokens_to_insert)} hyper-realistic tokens successfully. Ready for DOMINATION.")
