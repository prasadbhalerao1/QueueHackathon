import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def force_seed_demo_user_plural():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    # 0. Cleanup singular collections
    for col in ["User", "Branch", "Service", "Token"]:
        await db[col].drop()
    
    # 1. Create User in 'users'
    user = {
        "phone": "7777777777",
        "name": "Test Citizen (Demo)",
        "role": "citizen",
        "hashed_password": "$2b$12$LQv3c1yqBWVHxkdZzF.uO.vS.fS.vS.vS.vS.vS.vS.vS.vS.vS.vS.vS" # 'password'
    }
    await db.users.update_one({"phone": "7777777777"}, {"$set": user}, upsert=True)
    user_doc = await db.users.find_one({"phone": "7777777777"})
    user_id = user_doc["_id"]
    
    # 2. Create Branch in 'branches'
    branch = {
        "name": "PCMC Main Hub (Pimpri)",
        "lat": 18.6279, "lng": 73.8014, "active_desks": 5, "total_desks": 5
    }
    await db.branches.update_one({"name": "PCMC Main Hub (Pimpri)"}, {"$set": branch}, upsert=True)
    branch_doc = await db.branches.find_one({"name": "PCMC Main Hub (Pimpri)"})
    branch_id = branch_doc["_id"]
    
    # 3. Create Service in 'services'
    service = {
        "name": "Aadhaar Card Update",
        "base_duration_minutes": 15, "priority_level": 1
    }
    await db.services.update_one({"name": "Aadhaar Card Update"}, {"$set": service}, upsert=True)
    service_doc = await db.services.find_one({"name": "Aadhaar Card Update"})
    service_id = service_doc["_id"]
    
    # 4. Create History in 'tokens'
    now = datetime.utcnow()
    tokens = [
        {
            "token_number": "HIST-001",
            "user": {"$ref": "users", "$id": user_id},
            "branch": {"$ref": "branches", "$id": branch_id},
            "service": {"$ref": "services", "$id": service_id},
            "booking_type": "whatsapp",
            "status": "COMPLETED",
            "created_at": now - timedelta(days=2),
            "actual_start_time": now - timedelta(days=2, minutes=30),
            "actual_end_time": now - timedelta(days=2, minutes=10),
            "rating": 5
        },
        {
            "token_number": "HIST-002",
            "user": {"$ref": "users", "$id": user_id},
            "branch": {"$ref": "branches", "$id": branch_id},
            "service": {"$ref": "services", "$id": service_id},
            "booking_type": "web",
            "status": "COMPLETED",
            "created_at": now - timedelta(days=5),
            "actual_start_time": now - timedelta(days=5, minutes=45),
            "actual_end_time": now - timedelta(days=5, minutes=20),
            "rating": 4
        },
        {
            "token_number": "ACT-777",
            "user": {"$ref": "users", "$id": user_id},
            "branch": {"$ref": "branches", "$id": branch_id},
            "service": {"$ref": "services", "$id": service_id},
            "booking_type": "whatsapp",
            "status": "WAITING",
            "created_at": now - timedelta(minutes=15),
            "expected_service_time": now + timedelta(minutes=25)
        }
    ]
    
    # Clear existing demo tokens for this user in plural collection
    await db.tokens.delete_many({"user.$id": user_id})
    await db.tokens.insert_many(tokens)
    print(f"FIXED: Forced history for 7777777777 in PLURAL collections ('users', 'tokens', etc.)")

if __name__ == "__main__":
    asyncio.run(force_seed_demo_user_plural())
