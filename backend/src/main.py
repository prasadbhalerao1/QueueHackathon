from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.common.database.connection import init_db
from src.common.exceptions.handlers import register_exception_handlers
from src.common.seed import seed_demo_data

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    await seed_demo_data()
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

@app.get("/health")
async def health_check():
    return {"status": "success", "message": "QueueOS API is running"}
