import httpx
import json

base_url = "https://queueos-backend-552912088240.us-central1.run.app"

# 1. Login
login_data = {"phone": "9999999999", "password": "password"}
resp = httpx.post(f"{base_url}/api/auth/login", json=login_data)
if resp.status_code != 200:
    print(f"Login failed: {resp.text}")
    exit(1)

token = resp.json()["data"]["access_token"]
print("Logged in successfully.")

# 2. Seed
headers = {"Authorization": f"Bearer {token}"}
resp = httpx.post(f"{base_url}/api/queue/admin/seed/demo", headers=headers, timeout=60)
if resp.status_code == 200:
    print("Seeding successful!")
    print(resp.json())
else:
    print(f"Seeding failed: {resp.text}")
