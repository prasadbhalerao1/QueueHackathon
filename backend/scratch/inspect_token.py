import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def inspect_token():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    token = await db.Token.find_one({"token_number": "D-777-999"})
    print("TOKEN CONTENT:")
    print(token)
    
    user = await db.User.find_one({"phone": "7777777777"})
    print("\nUSER CONTENT:")
    print(user)

if __name__ == "__main__":
    asyncio.run(inspect_token())
