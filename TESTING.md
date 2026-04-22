# QueueOS Testing Guide: WhatsApp, Gemini, and Twilio

This document explains how to test the AI-powered WhatsApp integration for the QueueOS Hackathon.

## 1. Environment Configuration
Ensure your `backend/.env` contains the following keys:
```env
# Twilio Configuration
TWILIO_ACCOUNT_SID=your_sid_here
TWILIO_AUTH_TOKEN=your_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886 (Twilio Sandbox)

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_key_here
```

## 2. Testing the WhatsApp Chatbot (Local Simulation)
Since you might not have a public URL (ngrok) yet, you can simulate a WhatsApp message coming into the system.

### A. The "Check Status" Flow
1. Open a terminal and run:
   ```bash
   # Replace with a real token number from your DB (e.g., A-101)
   python backend/scripts/simulate_whatsapp.py --from "+919999999999" --body "Check status for A-101"
   ```
2. The system will:
   - Call Gemini to "understand" the user intent.
   - Query MongoDB for token A-101.
   - Print the simulated WhatsApp response.

### B. The AI Natural Language Flow
Gemini is used to parse intent. You can test natural phrases:
- "Hey, what's my position in the line? My token is B-202"
- "How long until I'm called for A-123?"

## 3. Testing the Automated Alerts
Alerts are triggered automatically during staff operations:

### A. Status Updates
When a staff member clicks **"Call Next"** or **"Start Service"**:
- The backend triggers a `WhatsAppService.send_status_update`.
- You can check the backend logs to see: `[WhatsApp] Sending update to +91...: Your token A-101 is now CALLED at Desk 4.`

### B. Rush Protocol (Mass Broadcast)
1. Go to the **Admin Dashboard**.
2. Click **"Activate Rush Protocol"**.
3. Check logs: You will see a broadcast loop sending messages to ALL waiting citizens informing them of high delays.

## 4. Live End-to-End Testing (Requires ngrok)
1. Start ngrok: `ngrok http 8000`.
2. Copy the `https` URL.
3. In your Twilio Console (WhatsApp Sandbox Settings), set the "When a message comes in" URL to:
   `https://YOUR_NGROK_URL.ngrok-free.app/api/whatsapp/webhook`
4. Send a WhatsApp message to the Twilio Sandbox number from your phone.

## 5. Gemini Prompt Engineering
If you want to tweak the AI's personality, look at `backend/src/modules/whatsapp/whatsapp_service.py` in the `_parse_intent_with_ai` method. You can modify the system instruction to be more formal or helpful.
