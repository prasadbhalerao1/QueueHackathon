import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the backend/src directory to the path so we can import our modules
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from src.modules.queue.queue_model import Token, Branch
from src.common.database.connection import init_db

async def check():
    await init_db()
    branch = await Branch.find_one({"name": "Main Hub - Central Facilitation Center"})
    if not branch:
        print("Branch not found")
        return
    
    tokens = await Token.find(Token.branch.id == branch.id).to_list()
    print(f"Tokens fetched: {len(tokens)}")
    
    # Try fetching links manually for the first few
    if tokens:
        print("Attempting to fetch links for the first token...")
        t = tokens[0]
        await t.fetch_all_links()
        print(f"First token user: {t.user.name if t.user and hasattr(t.user, 'name') else 'Not fetched'}")

if __name__ == "__main__":
    asyncio.run(check())
