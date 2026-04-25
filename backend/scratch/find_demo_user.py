import os
import pymongo
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="d:/Programming/QueueOS/QueueHackathon/backend/.env")

MONGODB_URI = os.getenv("MONGODB_URI")
if not MONGODB_URI:
    print("MONGODB_URI not found in .env")
    exit(1)

client = pymongo.MongoClient(MONGODB_URI)

# Try to get the database name from the URI or list them
try:
    db = client.get_default_database()
except pymongo.errors.ConfigurationError:
    dbs = client.list_database_names()
    print(f"Available databases: {dbs}")
    if "test" in dbs:
        target_db_name = "test"
    elif "queue_os" in dbs:
        target_db_name = "queue_os"
    else:
        # Just pick the first non-system DB
        non_system_dbs = [d for d in dbs if d not in ["admin", "local", "config"]]
        target_db_name = non_system_dbs[0] if non_system_dbs else "test"
    db = client[target_db_name]

print(f"Using database: {db.name}")

users_col = db["users"]
tokens_col = db["tokens"]

citizens = list(users_col.find({"role": "CITIZEN"}))
print(f"Found {len(citizens)} citizens.")

candidates = []

for citizen in citizens:
    user_id = citizen["_id"]
    # Beanie stores links as DBRef or just ID? 
    # Let's check a sample token first.
    sample_token = tokens_col.find_one()
    # print(f"Sample token: {sample_token}")
    
    # Assume user is stored as a reference or ID
    # Usually Beanie uses $id in a dict if it's a Link
    
    # DEBUG: print first token to see structure
    if citizen == citizens[0]:
        t = tokens_col.find_one({"user.$id": {"$exists": True}})
        if t:
            print(f"Token with $id: {t.get('user')}")
        else:
            t = tokens_col.find_one({"user": {"$exists": True}})
            if t:
                print(f"Token with direct user: {t.get('user')}")

    # Try both ways
    tokens = list(tokens_col.find({"$or": [{"user.$id": user_id}, {"user": user_id}]}))
    completed_tokens = [t for t in tokens if t.get("status") == "COMPLETED"]
    active_tokens = [t for t in tokens if t.get("status") in ["BOOKED", "ARRIVED", "WAITING", "CALLED", "IN_PROGRESS"]]
    
# Find top 5 users by completed history
print("\nTop 5 users by completed history:")
user_history = []
for citizen in citizens:
    user_id = citizen["_id"]
    tokens = list(tokens_col.find({"user.$id": user_id}))
    completed = [t for t in tokens if t.get("status") == "COMPLETED"]
    if completed:
        user_history.append({
            "name": citizen.get("name"),
            "phone": citizen.get("phone"),
            "completed": len(completed)
        })

user_history.sort(key=lambda x: x["completed"], reverse=True)
for h in user_history[:5]:
    print(f"Name: {h['name']}, Phone: {h['phone']}, Completed: {h['completed']}")

# Check for any active tokens in the system
print("\nActive tokens in the system:")
active_tokens = list(tokens_col.find({"status": {"$in": ["BOOKED", "ARRIVED", "WAITING", "CALLED", "IN_PROGRESS"]}}))
if not active_tokens:
    print("No active tokens found.")
else:
    for t in active_tokens:
        user_ref = t.get("user")
        user_name = "Unknown"
        user_phone = "Unknown"
        user_id = None
        if user_ref:
            if hasattr(user_ref, "id"):
                user_id = user_ref.id
            elif isinstance(user_ref, dict) and "$id" in user_ref:
                user_id = user_ref["$id"]
        
        if user_id:
            u = users_col.find_one({"_id": user_id})
            if u:
                user_name = u.get("name")
                user_phone = u.get("phone")
        print(f"Token: {t.get('token_number')}, Status: {t.get('status')}, User: {user_name} ({user_phone})")

# If no user has both, suggest the one with history and the one with active token
if active_tokens:
    best_active = active_tokens[0]
    user_ref = best_active.get("user")
    user_id = None
    if user_ref:
        if hasattr(user_ref, "id"):
            user_id = user_ref.id
        elif isinstance(user_ref, dict) and "$id" in user_ref:
            user_id = user_ref["$id"]
            
    if user_id:
        u = users_col.find_one({"_id": user_id})
        if u:
            # Check history for this specific user
            hist = list(tokens_col.find({"user.$id": u["_id"], "status": "COMPLETED"}))
            print(f"\nRecommended Demo User (has active token):")
            print(f"Name: {u.get('name')}, Phone: {u.get('phone')}, Active: {best_active.get('token_number')}, History: {len(hist)} completed")
