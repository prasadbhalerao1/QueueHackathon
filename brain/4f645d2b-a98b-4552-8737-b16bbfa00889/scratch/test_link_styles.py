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
    
    # Style A: Token.branch.id
    tokens_a = await Token.find(Token.branch.id == branch.id).to_list()
    print(f"Style A (.id): {len(tokens_a)}")
    
    # Style B: Token.branch == branch.id
    tokens_b = await Token.find(Token.branch == branch.id).to_list()
    print(f"Style B (==): {len(tokens_b)}")
    
    # Style C: {"branch.$id": branch.id}
    tokens_c = await Token.find({"branch.$id": branch.id}).to_list()
    print(f"Style C (dict): {len(tokens_c)}")

if __name__ == "__main__":
    asyncio.run(check())
