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
    Seeds the QueueOS database with 200 citizens, 3 branches, 13 mapped services,
    and 100+ tokens covering every real-world edge case, including a pre-configured Test Citizen.
    """
    logger.info("=== INITIATING PRODUCTION SEED (PUNE / PCMC REGION) ===")

    # 1. WIPE COLLECTIONS
    logger.info("Wiping existing collections to prevent collisions...")
    await User.find_all().delete()
    await Branch.find_all().delete()
    await Service.find_all().delete()
    await Token.find_all().delete()

    # 2. SYSTEM USERS & ADMIN
    admin_hash = get_password_hash("password")
    system_users = [
        User(phone="9999999999", name="Prasad Bhalerao (Super Admin)", role=UserRole.ADMIN, hashed_password=admin_hash),
        User(phone="8888888888", name="Officer Kadam", role=UserRole.OFFICER, hashed_password=admin_hash),
        User(phone="8888888877", name="Officer Joshi", role=UserRole.OFFICER, hashed_password=admin_hash),
        User(phone="8888888866", name="Officer Pawar", role=UserRole.OFFICER, hashed_password=admin_hash),
    ]
    for u in system_users:
        await u.save()

    # 3. SEED CITIZENS
    logger.info("Generating 200 citizen demographic profiles...")
    first_names = [
        "Aarav", "Arjun", "Siddharth", "Karan", "Aditya", "Vikram", "Rohan", "Omkar",
        "Priya", "Neha", "Anjali", "Kavya", "Sneha", "Pooja", "Riya", "Shruti"
    ]
    last_names = [
        "Patil", "Deshmukh", "Joshi", "Kulkarni", "Shinde", "Pawar", "Gaikwad", "Kale",
        "Bhosale", "More", "Jadhav", "Chavan", "Wagh", "Mane"
    ]

    citizens = []
    for i in range(1, 201):
        name = f"{random.choice(first_names)} {random.choice(last_names)}"
        phone = f"98{str(i).zfill(8)}"
        citizens.append(User(phone=phone, name=name, role=UserRole.CITIZEN, hashed_password=admin_hash))

    # Add specific Test Citizen for demonstrations
    demo_citizen = User(phone="7777777777", name="Test Citizen (Demo)", role=UserRole.CITIZEN, hashed_password=admin_hash)
    citizens.append(demo_citizen)

    for c in citizens:
        await c.save()

    # 4. SEED BRANCHES
    branches = [
        Branch(name="PCMC Main Hub (Pimpri)", lat=18.6279, lng=73.8014, active_desks=5, total_desks=5),
        Branch(name="Tathawade Ward 32 Office", lat=18.6149, lng=73.7480, active_desks=3, total_desks=3),
        Branch(name="Kothrud CFC (Ward 15)", lat=18.5074, lng=73.8077, active_desks=4, total_desks=4),
    ]
    for b in branches:
        await b.save()

    main_branch, secondary_branch, third_branch = branches[0], branches[1], branches[2]

    # 5. SEED AI-MAPPED SERVICES (Devnagari + Custom Docs)
    services_data = [
        Service(name="Aadhaar Update (आधार अपडेट)", base_duration_minutes=15, priority_level=3, required_docs=["Original Aadhaar Card", "Identity Proof (PAN/Voter ID)", "Address Proof"]),
        Service(name="Income Certificate (उत्पन्नाचा दाखला)", base_duration_minutes=20, priority_level=2, required_docs=["Aadhaar Card", "Salary Slip/ITR/Talathi Report"]),
        Service(name="Caste Certificate (जात प्रमाणपत्र)", base_duration_minutes=30, priority_level=2, required_docs=["Aadhaar Card", "School Leaving Certificate", "Lineage Proof Extract"]),
        Service(name="Non-Creamy Layer (नॉन-क्रीमी लेयर)", base_duration_minutes=25, priority_level=2, required_docs=["Caste Certificate", "Aadhaar Card", "ITR/Talathi Income Report (3 yrs)"]),
        Service(name="EWS Certificate (आर्थिक दुर्बल घटक)", base_duration_minutes=25, priority_level=2, required_docs=["Aadhaar Card", "Domicile Certificate", "Income Proof"]),
        Service(name="Domicile Certificate (रहिवासी दाखला)", base_duration_minutes=20, priority_level=3, required_docs=["Aadhaar Card", "Birth/School Cert", "Old Electricity Bill/Rent Agreement"]),
        Service(name="Ration Card (रेशन कार्ड)", base_duration_minutes=25, priority_level=3, required_docs=["Aadhaar of all family members", "Address Proof"]),
        Service(name="Senior Citizen Certificate (ज्येष्ठ नागरिक)", base_duration_minutes=15, priority_level=1, required_docs=["Aadhaar Card", "Age Proof", "Medical Fitness Cert"]),
        Service(name="Birth Certificate (जन्म दाखला)", base_duration_minutes=15, priority_level=3, required_docs=["Hospital Letter/Gram Panchayat Record", "Parents Aadhaar Card"]),
        Service(name="Death Certificate (मृत्यू दाखला)", base_duration_minutes=15, priority_level=3, required_docs=["Doctor Death Certificate", "Applicant Aadhaar", "Deceased Aadhaar", "Cremation Receipt"]),
        Service(name="Voter ID (मतदार ओळखपत्र)", base_duration_minutes=20, priority_level=3, required_docs=["Aadhaar Card", "Age Proof", "Address Proof"]),
        Service(name="Learner License (शिकाऊ परवाना)", base_duration_minutes=30, priority_level=2, required_docs=["Aadhaar Card", "Age Proof", "Address Proof", "Form 1A (if >40)"]),
        Service(name="PAN Card (पॅन कार्ड)", base_duration_minutes=15, priority_level=3, required_docs=["Aadhaar Card", "2 Passport Photos", "Form 49A"])
    ]
    for s in services_data:
        await s.save()
    
    # 6. GENERATE TOKENS
    logger.info("Generating tokens and edge cases...")
    now = datetime.utcnow()
    tokens_to_insert = []
    token_counter = 100
    
    def gen_token_number(prefix):
        nonlocal token_counter
        num = f"{prefix}-{token_counter}"
        token_counter += 1
        return num

    # ─── A. TEST CITIZEN (7777777777) EXACT HISTORY & LIVE STATE ───
    # History 1: Completed Aadhaar Update 3 days ago
    past_start_1 = now - timedelta(days=3, hours=2)
    tokens_to_insert.append(Token(
        token_number="W-090", branch=main_branch, service=services_data[0], user=demo_citizen,
        booking_type=BookingType.WALK_IN, status=QueueStatus.COMPLETED, priority=3,
        expected_service_time=past_start_1, actual_start_time=past_start_1, 
        actual_end_time=past_start_1 + timedelta(minutes=14), rating=5, desk_number=2, created_at=past_start_1 - timedelta(minutes=45)
    ))

    # History 2: Cancelled Voter ID yesterday
    tokens_to_insert.append(Token(
        token_number="A-091", branch=secondary_branch, service=services_data[10], user=demo_citizen,
        booking_type=BookingType.WHATSAPP, status=QueueStatus.CANCELLED, priority=3,
        expected_service_time=now - timedelta(days=1, hours=4), created_at=now - timedelta(days=1, hours=6)
    ))

    # History 3: Completed PAN Card this morning
    past_start_3 = now - timedelta(hours=6)
    tokens_to_insert.append(Token(
        token_number="B-092", branch=main_branch, service=services_data[12], user=demo_citizen,
        booking_type=BookingType.WEB, status=QueueStatus.COMPLETED, priority=3,
        expected_service_time=past_start_3, actual_start_time=past_start_3 + timedelta(minutes=5), 
        actual_end_time=past_start_3 + timedelta(minutes=22), rating=4, desk_number=1, created_at=now - timedelta(days=1)
    ))

    # LIVE STATE: 1 Active token Waiting right now
    tokens_to_insert.append(Token(
        token_number="W-093", branch=main_branch, service=services_data[5], # Domicile
        user=demo_citizen, booking_type=BookingType.WALK_IN, status=QueueStatus.WAITING,
        priority=3, expected_service_time=now + timedelta(minutes=15), created_at=now - timedelta(minutes=20)
    ))


    # ─── B. GENERAL HISTORY (60 Tokens) ───
    for i in range(60):
        svc = random.choice(services_data)
        user = random.choice(citizens[:-1]) # exclude demo citizen
        created = now - timedelta(hours=random.randint(1, 72), minutes=random.randint(0, 59))
        actual_start = created + timedelta(minutes=random.randint(5, 45))
        
        status = random.choices([QueueStatus.COMPLETED, QueueStatus.NO_SHOW, QueueStatus.CANCELLED], weights=[75, 15, 10])[0]
        is_completed = status == QueueStatus.COMPLETED

        tokens_to_insert.append(Token(
            token_number=gen_token_number("H"), branch=random.choice(branches), service=svc, user=user,
            booking_type=random.choice(list(BookingType)), status=status, priority=svc.priority_level,
            expected_service_time=actual_start, actual_start_time=actual_start if is_completed else None,
            actual_end_time=(actual_start + timedelta(minutes=svc.base_duration_minutes)) if is_completed else None,
            rating=random.randint(3, 5) if is_completed and random.random() > 0.3 else None,
            desk_number=random.randint(1, 4) if is_completed else None, created_at=created,
        ))

    # ─── C. LIVE IN_PROGRESS & CASCADE TEST ───
    for desk in range(1, 6):
        svc = random.choice(services_data)
        if desk == 5:
            actual_start = now - timedelta(minutes=42) # Delay cascade trigger
            notes = "Complex verification — delay cascade test"
        else:
            actual_start = now - timedelta(minutes=random.randint(2, 12))
            notes = None

        tokens_to_insert.append(Token(
            token_number=gen_token_number("W"), branch=main_branch, service=svc, user=random.choice(citizens[:-1]),
            booking_type=BookingType.WALK_IN, status=QueueStatus.IN_PROGRESS, priority=svc.priority_level,
            expected_service_time=actual_start, actual_start_time=actual_start, desk_number=desk, notes=notes,
            created_at=actual_start - timedelta(minutes=20),
        ))

    # ─── D. OTHER QUEUE STATES ───
    # 25 Waiting
    for i in range(25):
        svc = random.choice(services_data)
        tokens_to_insert.append(Token(
            token_number=gen_token_number("A"), branch=main_branch, service=svc, user=random.choice(citizens[:-1]),
            booking_type=random.choice([BookingType.WALK_IN, BookingType.WHATSAPP]), status=QueueStatus.WAITING, 
            priority=svc.priority_level, expected_service_time=now + timedelta(minutes=(i * 6)), created_at=now - timedelta(minutes=10)
        ))

    # Edge cases
    tokens_to_insert.extend([
        Token(token_number="VIP-001", branch=main_branch, service=services_data[7], user=random.choice(citizens[:-1]),
              booking_type=BookingType.VIP, status=QueueStatus.WAITING, priority=1, expected_service_time=now + timedelta(minutes=2),
              notes="Priority Override", created_at=now - timedelta(minutes=5)),
        Token(token_number=gen_token_number("R"), branch=main_branch, service=services_data[2], user=random.choice(citizens[:-1]),
              booking_type=BookingType.WALK_IN, status=QueueStatus.RETURN_LATER, priority=2, expected_service_time=now - timedelta(minutes=30),
              notes="Missing School Leaving Certificate.", created_at=now - timedelta(hours=1))
    ])

    await Token.insert_many(tokens_to_insert)

    print("\n" + "=" * 60)
    print("  QUEUEOS PRODUCTION SEED COMPLETE (AI MAPPED SERVICES)")
    print("=" * 60)
    print(f"  Citizens: {len(citizens)}  |  Staff: {len(system_users)}  |  Tokens: {len(tokens_to_insert)}")
    print("-" * 60)
    print("  DEMO CREDENTIALS (PASSWORD: password)")
    print("  Super Admin  ->  Phone: 9999999999")
    print("  Test Citizen ->  Phone: 7777777777  (History: 3, Live: 1)")
    print("=" * 60 + "\n")
