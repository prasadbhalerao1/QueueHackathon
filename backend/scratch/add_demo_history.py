import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from datetime import datetime, timedelta
from bson import ObjectId
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def add_custom_history():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    # 1. Find the Demo Citizen
    user = await db.User.find_one({"phone": "7777777777"})
    if not user:
        print("Demo user not found. Please run seed first.")
        return

    # 2. Get a branch and services for the tokens
    branch = await db.Branch.find_one()
    services = await db.Service.find_all().to_list() if hasattr(db.Service, "find_all") else await db.Service.find().to_list()
    
    # Fallback if find_all/to_list fails (manual check)
    if not services:
        services = await db.Service.find().to_list()
    
    if not branch or not services:
        print("Branch or Services not found. Please run seed first.")
        return

    # 3. Add 3 Completed Tokens (History)
    now = datetime.utcnow()
    completed_tokens = [
        {
            "token_number": "A-101-982",
            "user": {"$ref": "User", "$id": user["_id"]},
            "branch": {"$ref": "Branch", "$id": branch["_id"]},
            "service": {"$ref": "Service", "$id": services[0]["_id"]},
            "booking_type": "WHATSAPP",
            "status": "COMPLETED",
            "priority": 1,
            "created_at": now - timedelta(days=2),
            "actual_start_time": now - timedelta(days=2, minutes=30),
            "actual_end_time": now - timedelta(days=2, minutes=10),
            "rating": 5
        },
        {
            "token_number": "B-204-112",
            "user": {"$ref": "User", "$id": user["_id"]},
            "branch": {"$ref": "Branch", "$id": branch["_id"]},
            "service": {"$ref": "Service", "$id": services[1]["_id"]},
            "booking_type": "WEB",
            "status": "COMPLETED",
            "priority": 1,
            "created_at": now - timedelta(days=5),
            "actual_start_time": now - timedelta(days=5, minutes=45),
            "actual_end_time": now - timedelta(days=5, minutes=20),
            "rating": 4
        }
    ]

    # 4. Add 1 Active Token (Waiting)
    active_token = {
        "token_number": "D-777-999",
        "user": {"$ref": "User", "$id": user["_id"]},
        "branch": {"$ref": "Branch", "$id": branch["_id"]},
        "service": {"$ref": "Service", "$id": services[2]["_id"]},
        "booking_type": "WHATSAPP",
        "status": "WAITING",
        "priority": 2,
        "created_at": now - timedelta(minutes=15),
        "expected_service_time": now + timedelta(minutes=25)
    }

    # Insert tokens
    await db.Token.insert_many(completed_tokens + [active_token])
    print(f"SUCCESS: Added 2 COMPLETED and 1 WAITING token for {user['name']} (7777777777)")

if __name__ == "__main__":
    asyncio.run(add_custom_history())
