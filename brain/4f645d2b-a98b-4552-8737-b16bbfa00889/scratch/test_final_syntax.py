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
    
    active_statuses = [
        QueueStatus.BOOKED, QueueStatus.ARRIVED, QueueStatus.WAITING,
        QueueStatus.CALLED, QueueStatus.IN_PROGRESS, QueueStatus.RETURN_LATER
    ]
    
    # Try the exact syntax I just used in the service
    tokens = await Token.find(
        Token.branch == branch.id,
        In(Token.status, active_statuses)
    ).sort("-priority", "+expected_service_time").to_list()
    
    print(f"Tokens found: {len(tokens)}")
    if tokens:
        print("Success! No Motor cursor error.")

if __name__ == "__main__":
    asyncio.run(check())
