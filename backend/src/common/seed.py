import logging
import random
from datetime import datetime, timedelta
from src.modules.users.users_model import User
from src.modules.queue.queue_model import Branch, Service, Token
from src.common.constants.enums import UserRole, QueueStatus, BookingType
from src.common.security import get_password_hash

logger = logging.getLogger(__name__)


async def seed_demo_data():
    """
    Seeds the QueueOS database with 200 citizens, 3 branches, 8 services,
    and 100+ tokens covering every real-world edge case for a production-grade demo.
    """
    logger.info("=== INITIATING PRODUCTION SEED (PUNE / PCMC REGION) ===")

    # ──────────────────────────────────────────────────────────────────────
    # 1. TACTICAL WIPE — Clean slate
    # ──────────────────────────────────────────────────────────────────────
    logger.info("Wiping existing collections to prevent collisions...")
    await User.find_all().delete()
    await Branch.find_all().delete()
    await Service.find_all().delete()
    await Token.find_all().delete()

    # ──────────────────────────────────────────────────────────────────────
    # 2. STAFF & ADMIN ACCOUNTS (Hardcoded demo credentials)
    # ──────────────────────────────────────────────────────────────────────
    admin_hash = get_password_hash("password")
    system_users = [
        User(phone="9999999999", name="Prasad Bhalerao (Super Admin)", role=UserRole.ADMIN, hashed_password=admin_hash),
        User(phone="8888888888", name="Officer Kadam", role=UserRole.OFFICER, hashed_password=admin_hash),
        User(phone="8888888877", name="Officer Joshi", role=UserRole.OFFICER, hashed_password=admin_hash),
        User(phone="8888888866", name="Officer Pawar", role=UserRole.OFFICER, hashed_password=admin_hash),
    ]
    for u in system_users:
        await u.save()

    # ──────────────────────────────────────────────────────────────────────
    # 3. SEED 200 CITIZENS (Realistic Pune / Maharashtra Names)
    # ──────────────────────────────────────────────────────────────────────
    logger.info("Generating 200 citizen demographic profiles...")
    first_names_male = [
        "Aarav", "Arjun", "Siddharth", "Karan", "Aditya", "Vikram", "Rohan", "Omkar",
        "Pratik", "Gaurav", "Sahil", "Tejas", "Yash", "Hrithik", "Nikhil", "Aniket",
        "Varun", "Shubham", "Tushar", "Pranav", "Abhishek", "Rajesh", "Sunil", "Manoj",
        "Ganesh", "Sachin", "Dinesh", "Amit", "Vishal", "Sagar"
    ]
    first_names_female = [
        "Priya", "Neha", "Anjali", "Kavya", "Sneha", "Pooja", "Riya", "Shruti",
        "Megha", "Sakshi", "Tanvi", "Manasi", "Pallavi", "Swati", "Komal", "Rutuja",
        "Ashwini", "Deepali", "Varsha", "Sonali", "Meera", "Anita", "Sunita", "Rekha",
        "Savita", "Smita", "Gauri", "Jyoti", "Kalyani", "Madhuri"
    ]
    last_names = [
        "Patil", "Deshmukh", "Joshi", "Kulkarni", "Shinde", "Pawar", "Gaikwad", "Kale",
        "Bhosale", "More", "Jadhav", "Chavan", "Wagh", "Mane", "Salunkhe", "Nikam",
        "Thorat", "Deshpande", "Gokhale", "Sathe", "Bhandari", "Naik", "Shirke", "Kamble",
        "Londhe"
    ]

    all_first_names = first_names_male + first_names_female
    citizens = []

    for i in range(1, 201):
        fname = random.choice(all_first_names)
        lname = random.choice(last_names)
        name = f"{fname} {lname}"
        phone = f"98{str(i).zfill(8)}"
        citizens.append(User(
            phone=phone,
            name=name,
            role=UserRole.CITIZEN,
            hashed_password=admin_hash
        ))

    # Add known test citizen for easy demo access
    demo_citizen = User(phone="7777777777", name="Test Citizen (Demo)", role=UserRole.CITIZEN, hashed_password=admin_hash)
    citizens.append(demo_citizen)

    for c in citizens:
        await c.save()

    logger.info(f"Created {len(citizens)} citizen profiles.")

    # ──────────────────────────────────────────────────────────────────────
    # 4. SEED BRANCHES (3 Pune/PCMC locations)
    # ──────────────────────────────────────────────────────────────────────
    branches = [
        Branch(name="PCMC Main Hub (Pimpri)", lat=18.6279, lng=73.8014, active_desks=5, total_desks=5),
        Branch(name="Tathawade Ward 32 Office", lat=18.6149, lng=73.7480, active_desks=3, total_desks=3),
        Branch(name="Kothrud CFC (Ward 15)", lat=18.5074, lng=73.8077, active_desks=4, total_desks=4),
    ]
    for b in branches:
        await b.save()

    main_branch = branches[0]
    secondary_branch = branches[1]
    third_branch = branches[2]

    # ──────────────────────────────────────────────────────────────────────
    # 5. SEED SERVICES (8 Realistic Indian Govt Services)
    # ──────────────────────────────────────────────────────────────────────
    services = [
        Service(name="Aadhaar Card Update (आधार कार्ड अपडेट)", base_duration_minutes=15, priority_level=3,
                required_docs=["Original Aadhaar", "Proof of Address", "Proof of Identity"]),
        Service(name="Income Certificate (उत्पन्नाचा दाखला)", base_duration_minutes=20, priority_level=2,
                required_docs=["Ration Card", "Aadhaar Card", "Salary Slip/Talathi Report", "Self-Declaration"]),
        Service(name="Caste Certificate (जातीचा दाखला)", base_duration_minutes=30, priority_level=2,
                required_docs=["Aadhaar Card", "School Leaving Certificate", "Caste Proof Extract"]),
        Service(name="Domicile Certificate (डोमिसाइल प्रमाणपत्र)", base_duration_minutes=25, priority_level=3,
                required_docs=["Aadhaar Card", "Birth Certificate", "Electricity Bill (10 yrs)"]),
        Service(name="Ration Card Name Addition (रेशन कार्ड नाव नोंदणी)", base_duration_minutes=20, priority_level=3,
                required_docs=["Original Ration Card", "Aadhaar Cards", "Marriage/Birth Certificate"]),
        Service(name="Property Tax Name Transfer (मालमत्ता कर नाव हस्तांतरण)", base_duration_minutes=35, priority_level=1,
                required_docs=["Registered Sale Deed", "NOC from Society", "Previous Tax Receipts"]),
        Service(name="Birth Certificate (जन्म प्रमाणपत्र)", base_duration_minutes=15, priority_level=3,
                required_docs=["Hospital Discharge Summary", "Aadhaar of Parents", "Marriage Certificate"]),
        Service(name="Marriage Certificate (विवाह प्रमाणपत्र)", base_duration_minutes=25, priority_level=2,
                required_docs=["Aadhaar Cards (Both)", "Wedding Invitation/Photos", "Age Proof", "Address Proof"]),
    ]
    for s in services:
        await s.save()

    # ──────────────────────────────────────────────────────────────────────
    # 6. SEED TOKENS — Every Real-World Edge Case
    # ──────────────────────────────────────────────────────────────────────
    logger.info("Generating production-grade token distribution...")
    now = datetime.utcnow()
    tokens_to_insert = []
    token_counter = 100
    citizen_idx = 0  # Track which citizen we assign

    def next_citizen():
        nonlocal citizen_idx
        c = citizens[citizen_idx % len(citizens)]
        citizen_idx += 1
        return c

    def gen_token_number(prefix):
        nonlocal token_counter
        num = f"{prefix}-{token_counter}"
        token_counter += 1
        return num

    # ─── A. HISTORICAL DATA (60 Completed/No-Show/Cancelled for analytics) ───
    for i in range(60):
        svc = random.choice(services)
        created_time = now - timedelta(hours=random.randint(1, 72), minutes=random.randint(0, 59))
        actual_start = created_time + timedelta(minutes=random.randint(5, 45))
        branch = random.choice([main_branch, secondary_branch, third_branch])

        status_choice = random.choices(
            [QueueStatus.COMPLETED, QueueStatus.NO_SHOW, QueueStatus.CANCELLED],
            weights=[75, 15, 10]
        )[0]
        is_completed = status_choice == QueueStatus.COMPLETED

        # Realistic rating distribution: most 4-5, some 3, rare 1-2
        rating = None
        if is_completed and random.random() > 0.25:
            rating = random.choices([5, 4, 3, 2, 1], weights=[45, 30, 15, 7, 3])[0]

        tokens_to_insert.append(Token(
            token_number=gen_token_number("H"),
            branch=branch,
            service=svc,
            user=next_citizen(),
            booking_type=random.choice([BookingType.WALK_IN, BookingType.WHATSAPP, BookingType.WEB]),
            status=status_choice,
            priority=svc.priority_level,
            expected_service_time=actual_start,
            actual_start_time=actual_start if is_completed else None,
            actual_end_time=(actual_start + timedelta(minutes=svc.base_duration_minutes + random.randint(-3, 10))) if is_completed else None,
            rating=rating,
            desk_number=random.randint(1, branch.active_desks) if is_completed else None,
            created_at=created_time,
        ))

    # ─── B. LIVE: IN_PROGRESS at desks (5 people currently being served) ───
    for desk in range(1, 6):
        svc = random.choice(services)
        # Desk 5 has been going for 40+ mins — simulates the "delay cascade" edge case
        if desk == 5:
            actual_start = now - timedelta(minutes=42)
            notes = "Complex case — prolonged service (delay cascade test)"
        else:
            actual_start = now - timedelta(minutes=random.randint(2, 12))
            notes = None

        tokens_to_insert.append(Token(
            token_number=gen_token_number("W"),
            branch=main_branch,
            service=svc,
            user=next_citizen(),
            booking_type=BookingType.WALK_IN,
            status=QueueStatus.IN_PROGRESS,
            priority=svc.priority_level,
            expected_service_time=actual_start,
            actual_start_time=actual_start,
            desk_number=desk,
            notes=notes,
            created_at=actual_start - timedelta(minutes=20),
        ))

    # ─── C. LIVE: CALLED tokens (2 people called, not yet at desk) ───
    for i in range(2):
        svc = random.choice(services)
        tokens_to_insert.append(Token(
            token_number=gen_token_number("A"),
            branch=main_branch,
            service=svc,
            user=next_citizen(),
            booking_type=BookingType.WHATSAPP,
            status=QueueStatus.CALLED,
            priority=svc.priority_level,
            expected_service_time=now - timedelta(minutes=random.randint(1, 3)),
            created_at=now - timedelta(minutes=random.randint(15, 30)),
        ))

    # ─── D. LIVE: WAITING queue (25 people in line) ───
    for i in range(25):
        svc = random.choice(services)
        est_time = now + timedelta(minutes=(i * 6) + random.randint(0, 3))
        booking = random.choices(
            [BookingType.WALK_IN, BookingType.WHATSAPP, BookingType.WEB],
            weights=[40, 35, 25]
        )[0]

        tokens_to_insert.append(Token(
            token_number=gen_token_number("A"),
            branch=main_branch,
            service=svc,
            user=next_citizen(),
            booking_type=booking,
            status=QueueStatus.WAITING,
            priority=svc.priority_level,
            expected_service_time=est_time,
            created_at=now - timedelta(minutes=random.randint(5, 60)),
        ))

    # ─── E. LIVE: BOOKED tokens (5 future appointments — web/whatsapp) ───
    for i in range(5):
        svc = random.choice(services)
        scheduled = now + timedelta(hours=random.randint(1, 4), minutes=random.randint(0, 59))

        tokens_to_insert.append(Token(
            token_number=gen_token_number("B"),
            branch=random.choice([main_branch, third_branch]),
            service=svc,
            user=next_citizen(),
            booking_type=random.choice([BookingType.WEB, BookingType.WHATSAPP]),
            status=QueueStatus.BOOKED,
            priority=svc.priority_level,
            expected_service_time=scheduled,
            created_at=now - timedelta(hours=random.randint(1, 12)),
        ))

    # ─── F. LIVE: ARRIVED tokens (3 citizens who scanned QR / checked in) ───
    for i in range(3):
        svc = random.choice(services)
        tokens_to_insert.append(Token(
            token_number=gen_token_number("A"),
            branch=main_branch,
            service=svc,
            user=next_citizen(),
            booking_type=BookingType.WHATSAPP,
            status=QueueStatus.ARRIVED,
            priority=svc.priority_level,
            expected_service_time=now + timedelta(minutes=random.randint(10, 40)),
            created_at=now - timedelta(minutes=random.randint(15, 45)),
        ))

    # ─── G. EDGE CASE: NO_SHOW tokens (for Grace Re-entry testing) ───
    for i in range(2):
        svc = random.choice(services)
        tokens_to_insert.append(Token(
            token_number=gen_token_number("A"),
            branch=main_branch,
            service=svc,
            user=next_citizen(),
            booking_type=BookingType.WALK_IN,
            status=QueueStatus.NO_SHOW,
            priority=svc.priority_level,
            expected_service_time=now - timedelta(minutes=random.randint(10, 25)),
            notes="Citizen was called but did not respond. Available for grace re-entry.",
            created_at=now - timedelta(minutes=random.randint(30, 60)),
        ))

    # ─── H. EDGE CASE: VIP OVERRIDE token ───
    tokens_to_insert.append(Token(
        token_number="VIP-001",
        branch=main_branch,
        service=services[4],
        user=next_citizen(),
        booking_type=BookingType.VIP,
        status=QueueStatus.WAITING,
        priority=1,
        expected_service_time=now + timedelta(minutes=2),
        notes="Priority Override — Emergency Directive from Admin.",
        created_at=now - timedelta(minutes=5),
    ))

    # ─── I. EDGE CASE: RETURN_LATER token (missing documents) ───
    tokens_to_insert.append(Token(
        token_number=gen_token_number("R"),
        branch=main_branch,
        service=services[2],  # Caste Certificate
        user=next_citizen(),
        booking_type=BookingType.WALK_IN,
        status=QueueStatus.RETURN_LATER,
        priority=services[2].priority_level,
        expected_service_time=now - timedelta(minutes=30),
        notes="Citizen missing School Leaving Certificate. Asked to return with docs today.",
        created_at=now - timedelta(hours=1),
    ))

    # ─── J. SECONDARY BRANCH: Active queue (10 waiting + 2 serving) ───
    for desk in range(1, 3):
        svc = random.choice(services)
        actual_start = now - timedelta(minutes=random.randint(3, 10))
        tokens_to_insert.append(Token(
            token_number=gen_token_number("T"),
            branch=secondary_branch,
            service=svc,
            user=next_citizen(),
            booking_type=BookingType.WALK_IN,
            status=QueueStatus.IN_PROGRESS,
            priority=svc.priority_level,
            expected_service_time=actual_start,
            actual_start_time=actual_start,
            desk_number=desk,
            created_at=actual_start - timedelta(minutes=15),
        ))

    for i in range(10):
        svc = random.choice(services)
        est_time = now + timedelta(minutes=(i * 7))
        tokens_to_insert.append(Token(
            token_number=gen_token_number("T"),
            branch=secondary_branch,
            service=svc,
            user=next_citizen(),
            booking_type=random.choice([BookingType.WALK_IN, BookingType.WHATSAPP]),
            status=QueueStatus.WAITING,
            priority=svc.priority_level,
            expected_service_time=est_time,
            created_at=now - timedelta(minutes=random.randint(5, 40)),
        ))

    # ─── K. THIRD BRANCH: Small queue (5 waiting + 1 serving) ───
    svc = random.choice(services)
    actual_start = now - timedelta(minutes=5)
    tokens_to_insert.append(Token(
        token_number=gen_token_number("K"),
        branch=third_branch,
        service=svc,
        user=next_citizen(),
        booking_type=BookingType.WALK_IN,
        status=QueueStatus.IN_PROGRESS,
        priority=svc.priority_level,
        expected_service_time=actual_start,
        actual_start_time=actual_start,
        desk_number=1,
        created_at=actual_start - timedelta(minutes=10),
    ))

    for i in range(5):
        svc = random.choice(services)
        tokens_to_insert.append(Token(
            token_number=gen_token_number("K"),
            branch=third_branch,
            service=svc,
            user=next_citizen(),
            booking_type=BookingType.WEB,
            status=QueueStatus.WAITING,
            priority=svc.priority_level,
            expected_service_time=now + timedelta(minutes=(i * 8)),
            created_at=now - timedelta(minutes=random.randint(10, 30)),
        ))

    # ─── L. EDGE CASE: Citizen with 2 active tokens (anti-spam boundary) ───
    dual_citizen = citizens[199]  # Last citizen
    for j in range(2):
        svc = random.choice(services)
        tokens_to_insert.append(Token(
            token_number=gen_token_number("D"),
            branch=random.choice([main_branch, secondary_branch]),
            service=svc,
            user=dual_citizen,
            booking_type=BookingType.WHATSAPP,
            status=QueueStatus.WAITING,
            priority=svc.priority_level,
            expected_service_time=now + timedelta(minutes=30 + (j * 60)),
            notes="Dual-token citizen — anti-spam boundary test." if j == 1 else None,
            created_at=now - timedelta(minutes=20 + (j * 10)),
        ))

    # ──────────────────────────────────────────────────────────────────────
    # 7. BULK INSERT ALL TOKENS
    # ──────────────────────────────────────────────────────────────────────
    await Token.insert_many(tokens_to_insert)
    logger.info(f"Inserted {len(tokens_to_insert)} tokens across {len(branches)} branches.")

    # ──────────────────────────────────────────────────────────────────────
    # 8. PRINT CREDENTIALS BLOCK
    # ──────────────────────────────────────────────────────────────────────
    total_users = len(system_users) + len(citizens)
    print("\n" + "=" * 60)
    print("  QUEUEOS PRODUCTION SEED COMPLETE")
    print("=" * 60)
    print(f"  Citizens: {len(citizens)}  |  Staff: {len(system_users)}  |  Total Users: {total_users}")
    print(f"  Tokens:   {len(tokens_to_insert)}  |  Branches: {len(branches)}  |  Services: {len(services)}")
    print("-" * 60)
    print("  DEMO CREDENTIALS (PASSWORD FOR ALL: password)")
    print("-" * 60)
    print("  Super Admin     →  Phone: 9999999999")
    print("  Staff Officer 1 →  Phone: 8888888888")
    print("  Staff Officer 2 →  Phone: 8888888877")
    print("  Staff Officer 3 →  Phone: 8888888866")
    print("  Test Citizen     →  Phone: 7777777777")
    print("-" * 60)
    print("  EDGE CASES SEEDED:")
    print("  • 60 historical tokens (analytics: completed/no-show/cancelled)")
    print("  • 5 IN_PROGRESS at desks (1 delayed 40+ min for cascade test)")
    print("  • 2 CALLED tokens (awaiting desk)")
    print("  • 25 WAITING in main queue")
    print("  • 5 BOOKED (future appointments)")
    print("  • 3 ARRIVED (checked in)")
    print("  • 2 NO_SHOW (grace re-entry test)")
    print("  • 1 VIP-001 override token")
    print("  • 1 RETURN_LATER (missing docs)")
    print("  • 1 dual-token citizen (anti-spam boundary)")
    print("  • Secondary + Third branch with active queues")
    print("=" * 60 + "\n")
