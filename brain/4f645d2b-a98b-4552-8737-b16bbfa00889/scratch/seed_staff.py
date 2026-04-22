import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the backend/src directory to the path
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from src.modules.users.users_model import User
from src.common.database.connection import init_db
from src.common.constants.enums import UserRole

async def seed_staff():
    await init_db()
    
    staff_data = [
        {"phone": "+919000000001", "name": "Officer Rajesh Kumar", "role": UserRole.OFFICER},
        {"phone": "+919000000002", "name": "Officer Priya Sharma", "role": UserRole.OFFICER},
        {"phone": "+919000000003", "name": "Officer Amit Singh", "role": UserRole.OFFICER},
        {"phone": "+919000000004", "name": "Officer Sneha Patil", "role": UserRole.OFFICER},
        {"phone": "+919000000005", "name": "Officer Vikram Malhotra", "role": UserRole.OFFICER},
        {"phone": "+919000000006", "name": "Officer Anjali Desai", "role": UserRole.OFFICER},
        {"phone": "+919000000007", "name": "Officer Arjun Varma", "role": UserRole.OFFICER},
        {"phone": "+919000000008", "name": "Officer Kavita Reddy", "role": UserRole.OFFICER},
        {"phone": "+919000000009", "name": "Officer Sanjay Gupta", "role": UserRole.OFFICER},
        {"phone": "+919000000010", "name": "Officer Meera Iyer", "role": UserRole.OFFICER},
    ]
    
    count = 0
    for data in staff_data:
        existing = await User.find_one({"phone": data["phone"]})
        if not existing:
            user = User(**data)
            await user.save()
            count += 1
            
    print(f"Successfully seeded {count} new staff members.")

if __name__ == "__main__":
    asyncio.run(seed_staff())
