import asyncio
import sys
import os
import argparse
from dotenv import load_dotenv

# Add the backend/src directory to the path
sys.path.append(os.path.join(os.getcwd(), "backend"))
load_dotenv(os.path.join(os.getcwd(), "backend", ".env"))

from src.modules.whatsapp.whatsapp_service import WhatsAppService
from src.common.database.connection import init_db

async def simulate(sender: str, body: str):
    await init_db()
    print(f"\n[Simulating WhatsApp Message]")
    print(f"From: {sender}")
    print(f"Body: {body}\n")
    
    response = await WhatsAppService.process_incoming_message(sender, body)
    
    print("-" * 30)
    print(f"[System Response]\n{response}")
    print("-" * 30)

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--from_phone", default="+919999999999")
    parser.add_argument("--body", required=True)
    args = parser.parse_args()
    
    asyncio.run(simulate(args.from_phone, args.body))
