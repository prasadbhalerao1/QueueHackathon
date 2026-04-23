import asyncio
from src.common.database.connection import init_db
from src.common.seed import seed_demo_data

async def run():
    print("Connecting to DB...")
    await init_db()
    print("Running Seed...")
    await seed_demo_data()
    print("Done!")

if __name__ == "__main__":
    asyncio.run(run())
