# QueueOS - Testing & Validation Guide

This document serves as the master checklist to test all Hackathon features live on stage.

---

## 0. Hackathon Test Credentials

After running the demo seed (`POST /api/queue/admin/seed/demo`), the following credentials will be active in the system.

### Staff / Admin Portals (Requires Password)
*   **Super Admin:**
    *   Phone: `9999999999`
    *   Password: `password`
*   **Officer (Branch Staff):**
    *   Phone: `8888888888`
    *   Password: `password`

### Citizen Portal (Passwordless)
*   **Demo Citizens:**
    *   Phones: `7770000001` up to `7770000090`
    *   *Note: Citizens do not use passwords. Simply enter the phone number in the Citizen login tab to instantly view their tokens.*

---

## 1. Twilio + Gemini AI Chatbot Testing

To present the WhatsApp NLP Bot live, you must expose your local FastAPI backend to the internet using `ngrok` so Twilio can send messages to it.

### Setup Instructions (Pre-Demo)
1. Start your backend server:
   ```bash
   uvicorn src.main:app --reload --port 8000
   ```
2. Start ngrok on the same port:
   ```bash
   ngrok http 8000
   ```
3. Copy the secure Forwarding URL (e.g., `https://1234-abcd.ngrok-free.app`).
4. Log into your **Twilio Console** -> Phone Numbers -> Manage -> Active Numbers.
5. Under **Messaging Configuration**, find "A message comes in" and paste your ngrok URL appended with the webhook route:
   `https://1234-abcd.ngrok-free.app/api/whatsapp/webhook`
6. Save the configuration.

### Live Chatbot Test Cases
We must demonstrate that the AI does *not* use rigid menus.

**Test Case 1: The "Messy Hinglish" Booking**
* **Action:** Text the WhatsApp Twilio Number: *"bhai mera aadhar update karna hai, jaldi slot de do"*
* **Expected:** The Gemini model parses intent="BOOKING", guesses the service via fuzzy match against `Aadhaar`, and replies with:
  *"Aapki booking confirm ho gayi hai! 🎉 Aapka Token Number hai: A-102. Branch: Main..."*

**Test Case 2: Graceful Clarification (The Vague Citizen)**
* **Action:** Text: *"I need to get some government work done today."*
* **Expected:** The bot cannot find a service name. Intent="CLARIFICATION". It replies:
  *"I can help with that! What specific service do you need? Please reply with one of the following: 1. Aadhaar Update..."*

**Test Case 3: The Status Check**
* **Action:** Text: *"Kitna time aur lagega mera token ko?"*
* **Expected:** Bot matches the sending phone number, finds the active token, calculates people ahead in `WAITING` status. Replies:
  *"Your token A-XXX is currently WAITING. There are X people ahead of you. Estimated time to your turn is Y minutes."*

**Test Case 4: Anti-Spam**
* **Action:** Have two active `.WAITING` or `.BOOKED` tokens against your phone. Text: *"Book another appointment"*
* **Expected:**
  *"🚫 Booking Failed: You already have 2 active tokens in the queue. Please complete or cancel your existing appointments before booking a new one."*

**Test Case 5: The Passive Auto-Delay Alert**
* **Action:** On the staff dashboard, move a token to `IN_PROGRESS`. Leave it there for `base_duration_minutes + 15` minutes past its actual start time. Then hit "Complete Service".
* **Expected:** The `QueueService.advance_token` intercepts the 15-minute SLA breach. It cascades `+15 minutes` to all `WAITING` tokens globally and actively sends an outbound WhatsApp alert to everyone waiting.

---

## 2. Frontend Dashboard Tests (WCAG AA & UI Rules)
* **Action:** Login as Officer to `/staff`. Make sure you are using Chrome DevTools Lighthouse to verify `Color Contrast >= 4.5:1`.
* **Action:** Click "Call Next", token moves to CALLED.
* **Action:** Click "+ Walk-In" and create an anonymous token without a phone number. Ensure it creates without crashing Twilio outbound hooks.
* **Offline Mock:** Disconnect internet hook (in Network tab). Keep clicking buttons. Connect back. Ensure `React Query Sync` or `IndexedDB` updates local data without losing context.

---

## 3. Automated Seeding
Make sure the database state is pristine before presentation:
```bash
curl -X POST http://localhost:8000/api/queue/admin/seed/demo
```
*This will inject 90+ realistic citizens, historical data, current active desks, and VIP priority overrides to immediately populate the Staff Dashboard with hyper-realistic metrics.*
