import asyncio
from src.common.seed import seed_demo_data
from src.common.database.connection import init_db

async def run():
    await init_db()
    await seed_demo_data()

if __name__ == "__main__":
    asyncio.run(run())
