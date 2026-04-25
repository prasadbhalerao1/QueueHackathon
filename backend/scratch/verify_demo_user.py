import os
import pymongo
from dotenv import load_dotenv

load_dotenv(dotenv_path="d:/Programming/QueueOS/QueueHackathon/backend/.env")
client = pymongo.MongoClient(os.getenv("MONGODB_URI"))
db = client["queueos"]

def check_user(phone):
    u = db["users"].find_one({"phone": phone})
    if not u:
        print(f"User with phone {phone} not found.")
        return
    
    h = list(db["tokens"].find({"user.$id": u["_id"], "status": "COMPLETED"}))
    a = list(db["tokens"].find({"user.$id": u["_id"], "status": {"$in": ["BOOKED", "ARRIVED", "WAITING", "CALLED", "IN_PROGRESS"]}}))
    
    print(f"User: {u.get('name')} ({u.get('phone')})")
    print(f"History: {len(h)} completed tokens")
    print(f"Active: {[t.get('token_number') for t in a]}")
    print("-" * 20)

print("Checking potential demo users:\n")
check_user("7777777777") # Test Citizen
check_user("9800000002") # Sunita Bhandari (has history)
check_user("9800000061") # Sakshi Deshpande (has active)

# Find someone with BOTH
print("Searching for someone with BOTH history and active...")
citizens = list(db["users"].find({"role": "CITIZEN"}))
found = False
for c in citizens:
    h_count = db["tokens"].count_documents({"user.$id": c["_id"], "status": "COMPLETED"})
    a_count = db["tokens"].count_documents({"user.$id": c["_id"], "status": {"$in": ["BOOKED", "ARRIVED", "WAITING", "CALLED", "IN_PROGRESS"]}})
    if h_count > 0 and a_count > 0:
        print(f"FOUND: {c.get('name')} ({c.get('phone')}) - History: {h_count}, Active: {a_count}")
        found = True

if not found:
    print("No user has both. I will find a user with history and create an active token for them?")
    # No, I should just report the best options.
