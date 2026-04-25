from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from src.common.config.config import settings
from src.modules.users.users_model import User
from src.modules.queue.queue_model import Branch, Service, Token

_db_initialized = False

async def init_db():
    global _db_initialized
    if _db_initialized:
        return
        
    client = AsyncIOMotorClient(settings.MONGODB_URI)
    database = client["queueos"]
    
    await init_beanie(
        database=database,
        document_models=[
            User,
            Branch,
            Service,
            Token
        ]
    )
    _db_initialized = True
