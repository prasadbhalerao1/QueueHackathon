import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def find_user_with_history():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    # Find a user who has completed tokens
    completed_token = await db.Token.find_one({"status": "COMPLETED"})
    
    if completed_token:
        user_id = completed_token.get("user", {}).get("$id")
        if user_id:
            user = await db.User.find_one({"_id": user_id})
            print(f"FOUND USER WITH HISTORY:")
            print(f"Name: {user.get('name')}")
            print(f"Phone: {user.get('phone')}")
            print(f"Token Number: {completed_token.get('token_number')}")
        else:
            print("Completed token found but no user linked.")
    else:
        print("No completed tokens found in DB. Seeding may be required.")

if __name__ == "__main__":
    asyncio.run(find_user_with_history())
