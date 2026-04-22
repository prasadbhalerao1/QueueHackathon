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
from beanie.operators import In
from src.common.constants.enums import QueueStatus

async def check():
    await init_db()
    branch = await Branch.find_one({"name": "Main Hub - Central Facilitation Center"})
    if not branch:
        print("Branch not found")
        return
    
    print(f"Checking tokens for branch ID: {branch.id}")
    
    # Try different query styles
    
    # Style 1: .id
    tokens1 = await Token.find(
        Token.branch.id == branch.id,
        fetch_links=True
    ).to_list()
    print(f"Tokens found (Style 1: .id): {len(tokens1)}")
    
    # Style 2: direct
    tokens2 = await Token.find(
        Token.branch == branch.id,
        fetch_links=True
    ).to_list()
    print(f"Tokens found (Style 2: direct): {len(tokens2)}")
    
    # Style 3: string ID if needed?
    tokens3 = await Token.find(
        {"branch.$id": branch.id},
        fetch_links=True
    ).to_list()
    print(f"Tokens found (Style 3: dict raw): {len(tokens3)}")

if __name__ == "__main__":
    asyncio.run(check())
