# QueueOS - Testing & Validation Guide
This document serves as the master checklist to test all Hackathon features live on stage.

## 1. Twilio + Gemini AI Chatbot Testing
We must demonstrate that the AI does *not* use rigid menus.

**Test Case 1: The "Messy Hinglish" Booking**
* **Action:** Text the WhatsApp Twilio Number: *"bhai mera aadhar update karna hai, jaldi slot de do"*
* **Expected:** The Gemini model parses intent="BOOKING", guesses the service via fuzzy match against `Aadhaar`, and replies with:
  *"Aapki booking confirm ho gayi hai! ? Aapka Token Number hai: A-102. Branch: Main..."*

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
  *"?? Booking Failed: You already have 2 active tokens in the queue. Please complete or cancel your existing appointments before booking a new one."*

**Test Case 5: The Passive Auto-Delay Alert**
* **Action:** On the staff dashboard, move a token to `IN_PROGRESS`. Leave it there for `base_duration_minutes + 15` minutes past its actual start time. Then hit "Complete Service".
* **Expected:** The `QueueService.advance_token` intercepts the 15-minute SLA breach. It cascades `+15 minutes` to all `WAITING` tokens globally and actively sends an outbound WhatsApp alert to everyone waiting.

## 2. Frontend Dashboard Tests (WCAG AA & UI Rules)
* **Action:** Login as Officer to `/staff`. Make sure you are using Chrome DevTools Lighthouse to verify `Color Contrast >= 4.5:1`. (We adjusted MUI variants).
* **Action:** Click "Call Next", token moves to CALLED.
* **Action:** Click "+ Walk-In" and create an anonymous token without a phone number. Ensure it creates without crashing Twilio outbound hooks.
* **Offline Mock:** Disconnect internet hook (in Network tab). Keep clicking buttons. Connect back. Ensure `React Query Sync` or `IndexedDB` updates local data without losing context.

## 3. Automated Seeding
* Make sure database state is pristine before presentation:
  `curl -X POST http://localhost:8001/api/queue/admin/seed/demo -H "Authorization: Bearer <Admin_JWT>"`
* This replaces normal auto-boot cascades to ensure you do not wipe demo data down mid-presentation by accident if you reboot the server.
