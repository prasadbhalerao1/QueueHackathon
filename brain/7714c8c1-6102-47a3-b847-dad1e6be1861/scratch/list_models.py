from google import genai
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="e:/Programs/Hackathon/backend/.env")
api_key = os.getenv("GEMINI_API_KEY")

client = genai.Client(api_key=api_key)

print("\nAvailable Models:")
try:
    for model in client.models.list():
        print(f"Name: {model.name}")
except Exception as e:
    print(f"Error listing models: {e}")
