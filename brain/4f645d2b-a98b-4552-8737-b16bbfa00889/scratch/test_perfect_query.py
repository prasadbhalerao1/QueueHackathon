import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the backend/src directory to the path so we can import our modules
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from src.modules.queue.queue_model import Token, Branch
from src.common.database.connection import init_db
from beanie.operators import In
from src.common.constants.enums import QueueStatus

async def check():
    await init_db()
    branch = await Branch.find_one({"name": "Main Hub - Central Facilitation Center"})
    if not branch:
        print("Branch not found")
        return
    
    print(f"Checking tokens for branch ID: {branch.id}")
    
    try:
        # Style C with Beanie's string sort
        tokens = await Token.find({"branch.$id": branch.id}).sort("-priority", "+expected_service_time").to_list()
        print(f"Success with dict + string sort! Found: {len(tokens)}")
    except Exception as e:
        print(f"Failed with dict + string sort: {type(e).__name__}: {e}")

    try:
        # Style A with Beanie's string sort
        tokens = await Token.find(Token.branch.id == branch.id).sort("-priority", "+expected_service_time").to_list()
        print(f"Success with Style A (.id) + string sort! Found: {len(tokens)}")
    except Exception as e:
        print(f"Failed with Style A (.id) + string sort: {type(e).__name__}: {e}")

if __name__ == "__main__":
    asyncio.run(check())
