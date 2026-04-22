import asyncio
import sys
import os
from datetime import datetime
from dotenv import load_dotenv

# Add the backend/src directory to the path so we can import our modules
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from src.modules.queue.queue_service import QueueService
from src.common.database.connection import init_db
from src.common.constants.enums import QueueStatus

async def test_advance():
    await init_db()
    token_id = "69e9020fabcda309086aa333" # From the user's logs
    print(f"Testing advance_token for ID: {token_id}")
    
    try:
        # Try to transition to CALLED as an example
        token = await QueueService.advance_token(token_id, QueueStatus.CALLED)
        print(f"Success! Token {token.token_number} advanced to {token.status}")
    except Exception as e:
        print(f"FAILED with error: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_advance())
