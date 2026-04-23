import requests
import xml.etree.ElementTree as ET
import sys
import random

def simulate_citizen_message(message, phone):
    url = "http://localhost:8000/api/whatsapp/webhook"
    data = {
        "From": f"whatsapp:{phone}",
        "Body": message
    }
    
    print(f"\n[Citizen -> Bot]: {message}")
    try:
        response = requests.post(url, data=data)
        if response.status_code == 200:
            # Parse XML response from Twilio webhook
            root = ET.fromstring(response.content)
            bot_reply = root.find("Message").text
            print(f"[Bot -> Citizen]: {bot_reply}")
            return bot_reply
        else:
            print(f"Error: Backend returned status code {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"Error connecting to backend: {e}")
        print("Make sure your FastAPI server is running on http://localhost:8000")

if __name__ == "__main__":
    print("=== QueueOS Citizen WhatsApp Simulator ===")
    print("Type your message and press Enter.")
    print("Type 'new' to switch to a fresh citizen.")
    print("Type 'exit' to quit.")
    
    # Auto-random phone or specific one from args
    test_phone = (
        sys.argv[1]
        if len(sys.argv) > 1
        else "+91" + str(random.randint(7000000000, 9999999999))
    )
    
    print(f"Simulating phone: {test_phone}")
    
    while True:
        user_input = input("\nYou: ")
        
        if user_input.lower() in ["exit", "quit"]:
            break
            
        if user_input.lower() == "new":
            test_phone = "+91" + str(random.randint(7000000000, 9999999999))
            print(f"Switched citizen: {test_phone}")
            continue

        simulate_citizen_message(user_input, test_phone)
