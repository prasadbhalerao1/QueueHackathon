import asyncio
from src.common.database.connection import init_db
from src.modules.queue.queue_model import Token

async def check():
    await init_db()
    count = await Token.find_all().count()
    print(f"Total Tokens: {count}")

if __name__ == "__main__":
    asyncio.run(check())
