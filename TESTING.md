# QueueOS Testing Guide: WhatsApp, Gemini, and Twilio

This file is a quick-start guide. For the complete all-in-one runbook, use `WHATSAPP_TESTING_RUNBOOK.md`.

## 1. Environment Configuration

Ensure `backend/.env` includes:

```env
MONGODB_URI=...
GEMINI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+14155238886
SECRET_KEY=...
```

Important:
- Keep `TWILIO_WHATSAPP_NUMBER` as `+14155238886` (no `whatsapp:` prefix).

## **🔑 Live Demo Credentials (Password: password)**
| Role | Phone Number | Purpose |
| :--- | :--- | :--- |
| **Super Admin** | `9999999999` | Access analytics, capacity, and protocols |
| **Staff Officer** | `8888888888` | Operational dashboard (Call Next, Advance) |
| **Test Citizen** | `7777777777` | Check live status and feedback tracker |

---

## 2. Start Services

### Backend

```powershell
Set-Location E:\Programs\Hackathon\backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```powershell
Set-Location E:\Programs\Hackathon\frontend
npm run dev
```

### ngrok

```powershell
Set-Location E:\Programs\Hackathon\backend
ngrok http 8000
```

## 3. Twilio Sandbox Setup

In Twilio Console -> Try WhatsApp -> Sandbox settings:

- When a message comes in: `https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook`
- Method: `POST`

From phone, join sandbox by sending:

```text
join what-nervous
```

to `+1 415 523 8886`.

## 4. Local Simulation Test (No Twilio)

```bash
python backend/scripts/simulate_whatsapp.py --from_phone "+918055882377" --body "Check status"
```

## 5. Direct Webhook Test with curl (No Twilio UI)

### Git Bash

```bash
curl -X POST \
  -H "ngrok-skip-browser-warning: true" \
  -H "User-Agent: QueueOS-TestClient/1.0" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "From=whatsapp:%2B918055882377&Body=Check%20status" \
  "https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook"
```

### PowerShell

```powershell
curl.exe -X POST -H "ngrok-skip-browser-warning: true" -H "User-Agent: QueueOS-TestClient/1.0" -H "Content-Type: application/x-www-form-urlencoded" --data "From=whatsapp:%2B918055882377&Body=Check%20status" "https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook"
```

## 6. Postman Test

Request:
- Method: `POST`
- URL: `https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook`

Headers:
- `ngrok-skip-browser-warning: true`
- `User-Agent: QueueOS-TestClient/1.0`
- `Content-Type: application/x-www-form-urlencoded`

Body (`x-www-form-urlencoded`):
- `From = whatsapp:+918055882377`
- `Body = Check status`

## 7. Verify DB Reflection

Quick API check:

```bash
curl -s -H "ngrok-skip-browser-warning: true" -H "User-Agent: QueueOS-TestClient/1.0" "https://font-unmindful-manhood.ngrok-free.dev/api/queue/lookup-by-phone?phone=%2B918055882377"
```

MongoDB checks:
- `users` collection: `{ "phone": "+918055882377" }`
- `tokens` collection: `{ "booking_type": "WHATSAPP" }`

## 8. Prompt / Intent Scenarios

Use these message bodies to validate AI intent handling:
- `I need Aadhaar Update` (BOOKING)
- `Check status` (STATUS)
- `I need to get some government work done today` (CLARIFICATION)

## 9. Common Issues

### Twilio 429 / 63038

- Trial account exceeded daily message limit.
- Use local simulation or direct webhook calls while waiting for reset.

### ngrok warning page

- Include `ngrok-skip-browser-warning` or custom `User-Agent` header in programmatic calls.

### Gemini AI down message

- Validate `GEMINI_API_KEY`, quota, and restart backend.

---

Use `WHATSAPP_TESTING_RUNBOOK.md` for full details, troubleshooting matrix, and full checklist.
