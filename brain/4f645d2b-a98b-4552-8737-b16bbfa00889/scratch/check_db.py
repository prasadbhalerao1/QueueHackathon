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
    token_count = await Token.count()
    branch_count = await Branch.count()
    print(f"Token count: {token_count}")
    print(f"Branch count: {branch_count}")
    
    if branch_count > 0:
        branches = await Branch.find_all().to_list()
        for b in branches:
            print(f"Branch: {b.name} (ID: {b.id})")

if __name__ == "__main__":
    asyncio.run(check())
