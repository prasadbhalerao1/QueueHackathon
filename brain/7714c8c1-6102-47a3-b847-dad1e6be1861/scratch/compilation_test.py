import asyncio
from src.modules.queue.queue_service import QueueService
from src.common.constants.enums import QueueStatus

async def verify_compilation():
    print("Verifying Backend Compilation...")
    try:
        # Just check if we can access the classes and methods
        service = QueueService()
        print("QueueService loaded.")
        from src.modules.whatsapp.whatsapp_service import WhatsAppService
        print("WhatsAppService loaded.")
        print("✅ COMPILATION SUCCESSFUL")
    except Exception as e:
        print(f"❌ COMPILATION FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(verify_compilation())
