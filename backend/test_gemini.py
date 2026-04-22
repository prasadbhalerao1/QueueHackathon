import os
import requests
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GEMINI_API_KEY")

r = requests.get(f"https://generativelanguage.googleapis.com/v1beta/models?key={api_key}")
print(r.json())
