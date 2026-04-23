import google.generativeai as genai
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path="e:/Programs/Hackathon/backend/.env")
api_key = os.getenv("GEMINI_API_KEY")

genai.configure(api_key=api_key)

print("Testing model: gemini-2.5-flash")
try:
    model = genai.GenerativeModel("gemini-2.5-flash")
    response = model.generate_content("hello")
    print(f"Success! Response: {response.text}")
except Exception as e:
    print(f"FAILED: {e}")
