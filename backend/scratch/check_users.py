import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def check_users():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    users = await db.User.find().to_list()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"User: {u.get('name')} | Phone: {u.get('phone')}")

if __name__ == "__main__":
    asyncio.run(check_users())
