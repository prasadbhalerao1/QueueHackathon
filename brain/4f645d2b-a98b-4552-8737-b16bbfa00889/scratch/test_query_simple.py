import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the backend/src directory to the path so we can import our modules
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from src.modules.queue.queue_model import Token, Branch
from src.common.database.connection import init_db
from beanie import PydanticObjectId

async def check():
    await init_db()
    branch = await Branch.find_one({"name": "Main Hub - Central Facilitation Center"})
    if not branch:
        print("Branch not found")
        return
    
    print(f"Checking tokens for branch ID: {branch.id}")
    
    # Try WITHOUT fetch_links
    tokens = await Token.find(
        Token.branch.id == branch.id
    ).to_list()
    print(f"Tokens found (No fetch_links): {len(tokens)}")

if __name__ == "__main__":
    asyncio.run(check())
