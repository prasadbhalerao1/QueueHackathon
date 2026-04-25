import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def force_seed_demo_user():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    # 1. Create User
    user = {
        "phone": "7777777777",
        "name": "Test Citizen (Demo)",
        "role": "citizen",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkdZzF.uO.vS.fS.vS.vS.vS.vS.vS.vS.vS.vS.vS.vS" # 'password'
    }
    res = await db.User.update_one({"phone": "7777777777"}, {"$set": user}, upsert=True)
    user_id = (await db.User.find_one({"phone": "7777777777"}))["_id"]
    
    # 2. Create Branch
    branch = {
        "name": "PCMC Main Hub (Pimpri)",
        "lat": 18.6279, "lng": 73.8014, "active_desks": 5, "total_desks": 5
    }
    await db.Branch.update_one({"name": "PCMC Main Hub (Pimpri)"}, {"$set": branch}, upsert=True)
    branch_id = (await db.Branch.find_one({"name": "PCMC Main Hub (Pimpri)"}))["_id"]
    
    # 3. Create Service
    service = {
        "name": "Aadhaar Card Update",
        "base_duration_minutes": 15, "priority_level": 1
    }
    await db.Service.update_one({"name": "Aadhaar Card Update"}, {"$set": service}, upsert=True)
    service_id = (await db.Service.find_one({"name": "Aadhaar Card Update"}))["_id"]
    
    # 4. Create History (COMPLETED)
    now = datetime.utcnow()
    tokens = [
        {
            "token_number": "A-101-982",
            "user": {"$ref": "User", "$id": user_id},
            "branch": {"$ref": "Branch", "$id": branch_id},
            "service": {"$ref": "Service", "$id": service_id},
            "booking_type": "whatsapp",
            "status": "COMPLETED",
            "created_at": now - timedelta(days=2),
            "actual_start_time": now - timedelta(days=2, minutes=30),
            "actual_end_time": now - timedelta(days=2, minutes=10),
            "rating": 5
        },
        {
            "token_number": "B-204-112",
            "user": {"$ref": "User", "$id": user_id},
            "branch": {"$ref": "Branch", "$id": branch_id},
            "service": {"$ref": "Service", "$id": service_id},
            "booking_type": "web",
            "status": "COMPLETED",
            "created_at": now - timedelta(days=5),
            "actual_start_time": now - timedelta(days=5, minutes=45),
            "actual_end_time": now - timedelta(days=5, minutes=20),
            "rating": 4
        },
        {
            "token_number": "D-777-999",
            "user": {"$ref": "User", "$id": user_id},
            "branch": {"$ref": "Branch", "$id": branch_id},
            "service": {"$ref": "Service", "$id": service_id},
            "booking_type": "whatsapp",
            "status": "WAITING",
            "created_at": now - timedelta(minutes=15),
            "expected_service_time": now + timedelta(minutes=25)
        }
    ]
    
    await db.Token.delete_many({"user.$id": user_id})
    await db.Token.insert_many(tokens)
    print(f"DONE: Forced history for 7777777777")

if __name__ == "__main__":
    asyncio.run(force_seed_demo_user())
