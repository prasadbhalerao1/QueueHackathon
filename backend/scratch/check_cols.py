import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv("backend/.env")

async def check_collections():
    uri = os.getenv("MONGODB_URI")
    client = AsyncIOMotorClient(uri)
    db = client["queueos"]
    
    names = await db.list_collection_names()
    print("COLLECTIONS IN DB:")
    print(names)

if __name__ == "__main__":
    asyncio.run(check_collections())
