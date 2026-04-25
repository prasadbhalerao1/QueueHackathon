import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'backend'))

import asyncio
from dotenv import load_dotenv
load_dotenv("backend/.env")

from src.common.database.connection import init_db
from src.common.seed import seed_demo_data

async def main():
    print("Connecting to DB...")
    await init_db()
    print("Starting Seed...")
    await seed_demo_data()
    print("Seed Complete!")

if __name__ == "__main__":
    asyncio.run(main())
