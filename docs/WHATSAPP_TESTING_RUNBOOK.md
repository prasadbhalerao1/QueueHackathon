# QueueOS WhatsApp + Twilio + Citizen Testing Runbook

This is the one-stop test guide for local, ngrok, Twilio Sandbox, Postman, and DB verification.

## 1. Scope

Use this runbook to test:
- WhatsApp webhook ingestion
- Gemini intent parsing
- Token booking/status responses
- Citizen tracking flow in frontend
- Database reflection and debugging

## 2. Prerequisites

- Backend dependencies installed (`backend/requirements.txt`)
- Frontend dependencies installed (`frontend/package.json`)
- MongoDB reachable from backend
- ngrok installed and authenticated
- Twilio account (Sandbox for WhatsApp)
- Gemini API key

## 3. Environment Variables (backend/.env)

Required keys:

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
- The code adds the `whatsapp:` prefix internally when sending.

## 4. Start Services

Open separate terminals.

### Backend (PowerShell)

```powershell
Set-Location E:\Programs\Hackathon\backend
uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend (PowerShell)

```powershell
Set-Location E:\Programs\Hackathon\frontend
npm run dev
```

### ngrok (PowerShell)

```powershell
Set-Location E:\Programs\Hackathon\backend
ngrok http 8000
```

## 5. Webhook URL to Use in Twilio Sandbox

Set this in Twilio Console -> Messaging -> Try it out -> Try WhatsApp -> Sandbox settings:

- When a message comes in: `https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook`
- Method: `POST`

Optional status callback URL can be left blank during testing.

## 6. Join Twilio WhatsApp Sandbox

From your phone, send this message to `+1 415 523 8886`:

```text
join what-nervous
```

## 7. Fast Health Checks

### Health endpoint via ngrok

```bash
curl -s -D - -H "ngrok-skip-browser-warning: true" -H "User-Agent: QueueOS-TestClient/1.0" "https://font-unmindful-manhood.ngrok-free.dev/health"
```

Expected: HTTP 200 with JSON health payload.

## 8. Webhook Test Without Phone (Direct HTTP)

This simulates Twilio calling your webhook.

### Git Bash command

```bash
curl -X POST \
  -H "ngrok-skip-browser-warning: true" \
  -H "User-Agent: QueueOS-TestClient/1.0" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data "From=whatsapp:%2B918055882377&Body=Check%20status" \
  "https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook"
```

### PowerShell single-line equivalent

```powershell
curl.exe -X POST -H "ngrok-skip-browser-warning: true" -H "User-Agent: QueueOS-TestClient/1.0" -H "Content-Type: application/x-www-form-urlencoded" --data "From=whatsapp:%2B918055882377&Body=Check%20status" "https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook"
```

Expected: XML/TwiML response.

## 9. Postman Testing (Recommended)

Create request:
- Method: `POST`
- URL: `https://font-unmindful-manhood.ngrok-free.dev/api/whatsapp/webhook`

Headers:
- `ngrok-skip-browser-warning: true`
- `User-Agent: QueueOS-TestClient/1.0`
- `Content-Type: application/x-www-form-urlencoded`

Body (`x-www-form-urlencoded`):
- `From` = `whatsapp:+918055882377`
- `Body` = `Check status`

Suggested Tests tab script:

```javascript
pm.test("Status is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response is TwiML XML", function () {
  pm.expect(pm.response.text()).to.include("<Response>");
  pm.expect(pm.response.text()).to.include("<Message>");
});
```

## 10. Local Script Simulation (No Twilio Required)

Use script in `backend/scripts/simulate_whatsapp.py`.

Important argument name is `--from_phone`.

```bash
python backend/scripts/simulate_whatsapp.py --from_phone "+918055882377" --body "Check status"
```

## 11. End-to-End Citizen Flow

1. Send WhatsApp booking message (phone or direct webhook):
   - `I need Aadhaar Update`
2. Receive response with token.
3. Open frontend landing page.
4. Track token on route `/track/<TOKEN_NUMBER>`.
5. Verify live updates, delay action, and completion feedback flow.

## 12. Verify Data Actually Hit DB

### Via API

Lookup active tokens by phone:

```bash
curl -s -H "ngrok-skip-browser-warning: true" -H "User-Agent: QueueOS-TestClient/1.0" "https://font-unmindful-manhood.ngrok-free.dev/api/queue/lookup-by-phone?phone=%2B918055882377"
```

### Via MongoDB Compass / Atlas

Users collection filter:

```json
{ "phone": "+918055882377" }
```

Tokens collection filter:

```json
{ "booking_type": "WHATSAPP" }
```

Note:
- Current backend does not persist each inbound/outbound chat line as a message log collection.
- It persists users and tokens based on intent path.

## 13. Known Limits and Errors

### Twilio 63038 (429 too many requests)

Meaning:
- Trial account exceeded daily limit (commonly 50 messages in rolling 24h) or additional restrictions.

What to do:
- Pause sends and retry after rolling window resets.
- Check Twilio Console logs for volume spikes.
- Upgrade account if needed.

### ngrok interstitial warning

If programmatic calls fail due to interstitial, include either:
- `ngrok-skip-browser-warning` header
- Custom `User-Agent` header

### Gemini fallback response appears

If webhook returns:
- `System Error: Our AI is currently down. Please try again later.`

Check:
- `GEMINI_API_KEY` is valid
- API quota/rate limits
- Backend restarted after env changes

## 14. Current Gemini Integration Notes

In `backend/src/modules/whatsapp/whatsapp_service.py`:
- SDK usage is correct for `google-genai`.
- Structured output via `response_mime_type="application/json"` and `response_schema=GeminiIntentSchema` is valid.
- Model currently configured to: `gemini-3-flash-preview`.

## 15. Primary Endpoints

- Health: `/health`
- WhatsApp webhook: `/api/whatsapp/webhook`
- Queue phone lookup: `/api/queue/lookup-by-phone?phone=...`
- Token tracking: `/api/queue/track/{token_number}`
- Demo seed: `/api/queue/admin/seed/demo`

## 16. Quick Regression Checklist

- [ ] Backend starts without errors
- [ ] Frontend builds/runs
- [ ] ngrok tunnel is active
- [ ] Twilio sandbox webhook URL saved
- [ ] Sandbox joined from phone
- [ ] Direct webhook curl works
- [ ] Gemini intent path returns non-error message
- [ ] Booking creates token in DB
- [ ] Lookup-by-phone returns expected active token(s)
- [ ] Citizen tracker shows live token state

## 17. Security Notes

- Never commit real `.env` secrets.
- Rotate keys if they were exposed in logs/screenshots.
- Keep Twilio and Gemini credentials in environment variables only.
