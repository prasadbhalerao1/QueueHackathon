from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.common.database.connection import init_db
from src.common.exceptions.handlers import register_exception_handlers


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    # Seeding is now manual. Call POST /api/queue/admin/seed/demo
    yield

app = FastAPI(
    title="QueueOS API",
    description="Smart Queue Infrastructure for Public Services",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

from src.modules.queue.queue_routes import queue_router
from src.modules.whatsapp.whatsapp_routes import whatsapp_router
from src.modules.auth.auth_routes import auth_router

app.include_router(queue_router, prefix="/api/queue", tags=["Queue"])
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["WhatsApp"])
app.include_router(auth_router, prefix="/api/auth", tags=["Auth"])

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "QueueOS Full-Stack Node",
        "docs": "/docs",
        "health": "/health",
        "seed": "POST /api/queue/admin/seed/demo"
    }

import time
import platform
import sys

START_TIME = time.time()

@app.get("/health")
async def health_check():
    try:
        from motor.motor_asyncio import AsyncIOMotorClient
        from src.common.config.config import settings
        client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=2000)
        await client.admin.command('ping')
        db_status = "Connected to MongoDB securely"
    except Exception as e:
        db_status = f"Disconnected (Database Error: {str(e)})"
        
    uptime_seconds = int(time.time() - START_TIME)
    
    return {
        "status": "success",
        "message": "QueueOS API is running optimally.",
        "system_info": {
            "uptime_seconds": uptime_seconds,
            "python_version": sys.version.split(" ")[0],
            "platform": platform.platform(),
            "db_status": db_status
        }
    }
