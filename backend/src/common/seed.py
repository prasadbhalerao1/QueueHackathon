import logging
import random
from datetime import datetime, timedelta
from src.modules.users.users_model import User
from src.modules.queue.queue_model import Branch, Service, Token
from src.common.constants.enums import UserRole, QueueStatus, BookingType
from src.common.security import get_password_hash

logger = logging.getLogger(__name__)

async def seed_demo_data():
    logger.info("=== INITIATING OPTIMIZED DEMO SEED (PUNE REGION) ===")

    # 1. TACTICAL WIPE - Clear the board
    logger.info("Wiping existing collections to prevent collisions...")
    await User.find_all().delete()
    await Branch.find_all().delete()
    await Service.find_all().delete()
    await Token.find_all().delete()

    # 2. SEED STAFF & ADMIN (With hardcoded demo creds)
    admin_hash = get_password_hash("password")
    system_users = [
        User(phone="9999999999", name="Prasad Bhalerao (Super Admin)", role=UserRole.ADMIN, hashed_password=admin_hash),
        User(phone="8888888888", name="Officer Kadam", role=UserRole.OFFICER, hashed_password=admin_hash),
    ]
    for u in system_users: await u.save()

    # 3. SEED CITIZENS (Realistic Local Names)
    logger.info("Generating citizen demographic data...")
    first_names = [
        "Aarav", "Priya", "Rahul", "Neha", "Arjun", "Anjali", "Siddharth", "Kavya", 
        "Karan", "Sneha", "Aditya", "Pooja", "Vikram", "Riya", "Rohan", "Shruti",
        "Omkar", "Pratik", "Gaurav", "Megha"
    ]
    last_names = ["Patil", "Deshmukh", "Joshi", "Kulkarni", "Shinde", "Pawar", "Gaikwad", "Kale"]
    
    citizens = []
    # Generate exactly 50 citizens for a fast, snappy demo
    for i in range(1, 51):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        phone = f"9822{str(i).zfill(6)}"
        citizens.append(User(phone=phone, name=name, role=UserRole.CITIZEN, hashed_password=admin_hash))
    
    # Add one specific demo citizen for easy testing
    demo_citizen = User(phone="7777777777", name="Test Citizen", role=UserRole.CITIZEN, hashed_password=admin_hash)
    citizens.append(demo_citizen)
    
    for c in citizens: await c.save()

    # 4. SEED BRANCHES (Localized)
    branches = [
        Branch(name="PCMC Main Hub (Pimpri)", lat=18.6279, lng=73.8014, active_desks=5),
        Branch(name="Tathawade Ward 32 Office", lat=18.6149, lng=73.7480, active_desks=3)
    ]
    for b in branches: await b.save()

    # 5. SEED SERVICES
    services = [
        Service(name="Aadhaar Card Biometric Update", base_duration_minutes=15, priority_level=3),
        Service(name="Income Certificate", base_duration_minutes=20, priority_level=2, required_docs=["ID Proof", "Salary Slip"]),
        Service(name="Property Tax Dispute", base_duration_minutes=30, priority_level=2, required_docs=["Title Deed", "ID Proof"]),
        Service(name="Water Bill Name Change", base_duration_minutes=10, priority_level=3),
        Service(name="Driving License Renewal", base_duration_minutes=25, priority_level=1),
    ]
    for s in services: await s.save()

    # 6. SEED TOKENS (Perfectly Balanced for Demo)
    logger.info("Generating optimized token load...")
    main_branch = branches[0]
    now = datetime.utcnow()
    
    tokens_to_insert = []
    token_counter = 100

    # --- A. HISTORICAL DATA (30 Completed/Cancelled tokens for Analytics) ---
    for i in range(30):
        t_service = random.choice(services)
        created_time = now - timedelta(hours=random.randint(1, 48), minutes=random.randint(0, 59))
        actual_start = created_time + timedelta(minutes=random.randint(5, 30))
        
        status_choice = random.choices(
            [QueueStatus.COMPLETED, QueueStatus.NO_SHOW, QueueStatus.CANCELLED], 
            weights=[80, 10, 10]
        )[0]
        is_completed = status_choice == QueueStatus.COMPLETED

        tokens_to_insert.append(Token(
            token_number=f"H-{token_counter}", branch=main_branch, service=t_service, user=random.choice(citizens), 
            booking_type=random.choice([BookingType.WALK_IN, BookingType.WHATSAPP]), status=status_choice, 
            priority=t_service.priority_level, expected_service_time=actual_start,
            actual_start_time=actual_start if is_completed else None,
            actual_end_time=(actual_start + timedelta(minutes=t_service.base_duration_minutes)) if is_completed else None,
            rating=random.randint(4, 5) if is_completed and random.random() > 0.3 else None,
            created_at=created_time
        ))
        token_counter += 1

    # --- B. LIVE ACTIVE DESKS (3 people currently being served) ---
    for desk in range(1, 4):
        t_service = random.choice(services)
        actual_start = now - timedelta(minutes=random.randint(1, 10))
        
        tokens_to_insert.append(Token(
            token_number=f"W-{token_counter}", branch=main_branch, service=t_service, user=citizens[desk],
            booking_type=BookingType.WALK_IN, status=QueueStatus.IN_PROGRESS, priority=t_service.priority_level,
            expected_service_time=actual_start, actual_start_time=actual_start, desk_number=desk,
            created_at=actual_start - timedelta(minutes=15)
        ))
        token_counter += 1

    # --- C. THE WAITING QUEUE (20 People waiting) ---
    for i in range(20):
        t_service = random.choice(services)
        est_time = now + timedelta(minutes=(i * 5))
        
        # Make the very first person "CALLED" to show that state
        status = QueueStatus.CALLED if i == 0 else QueueStatus.WAITING
        
        tokens_to_insert.append(Token(
            token_number=f"A-{token_counter}", branch=main_branch, service=t_service,
            user=citizens[i + 10], booking_type=BookingType.WHATSAPP, status=status, 
            priority=t_service.priority_level, expected_service_time=est_time,
            created_at=now - timedelta(minutes=random.randint(1, 20))
        ))
        token_counter += 1

    # --- D. VIP OVERRIDE ---
    tokens_to_insert.append(Token(
        token_number="VIP-001", branch=main_branch, service=services[4], user=citizens[-2],
        booking_type=BookingType.VIP, status=QueueStatus.WAITING, priority=1,
        expected_service_time=now + timedelta(minutes=2), notes="Emergency Directive."
    ))

    await Token.insert_many(tokens_to_insert)

    # Print a massive, unmissable block of credentials in the terminal
    print("\n" + "="*50)
    print("DEMO SEED COMPLETE! SYSTEM READY.")
    print("="*50)
    print("DEMO CREDENTIALS (PASSWORD FOR ALL: password)")
    print("-" * 50)
    print("Admin Portal   -> Phone: 9999999999")
    print("Staff/Officer -> Phone: 8888888888")
    print("Test Citizen  -> Phone: 7777777777")
    print("="*50 + "\n")
