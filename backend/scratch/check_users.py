import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def check_users():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    users = await db.users.find().to_list(length=1000)
    print(f"Total Users in 'users': {len(users)}")
    for u in users:
        print(f"User: {u.get('name')} | Phone: {u.get('phone')}")

if __name__ == "__main__":
    asyncio.run(check_users())
