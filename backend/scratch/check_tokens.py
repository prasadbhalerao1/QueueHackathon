import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def check_tokens():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    # Find user ID
    user = await db.users.find_one({"phone": "7777777777"})
    if not user:
        print("User 7777777777 not found.")
        return
    
    user_id = user["_id"]
    print(f"User ID: {user_id}")
    
    # Query tokens where user.$id matches
    tokens = await db.tokens.find({"user.$id": user_id}).to_list(length=100)
    print(f"Total Tokens found for this user: {len(tokens)}")
    for t in tokens:
        print(f"Token: {t.get('token_number')} | Status: {t.get('status')}")

if __name__ == "__main__":
    asyncio.run(check_tokens())
