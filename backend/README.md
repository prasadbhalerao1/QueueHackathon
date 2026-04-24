# QueueOS Backend

FastAPI server powering the QueueOS queue management platform.

## Tech Stack

- **Framework:** FastAPI (Python 3.10+)
- **Database:** MongoDB Atlas via Beanie ODM (Pydantic v2)
- **AI:** Google Gemini 2.5 Flash (WhatsApp NLP + Document Chat)
- **ML:** Scikit-learn (Crowd Prediction)
- **Auth:** JWT (PyJWT) + bcrypt
- **Messaging:** Twilio WhatsApp API

## Initial Setup

1. **Create Virtual Environment:**

   ```powershell
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. **Install Dependencies:**

   ```powershell
   pip install -r requirements.txt
   ```

3. **Configure Environment:**
   Ensure `.env` is present in `backend/` (copy from `.env.example`):

   ```powershell
   Copy-Item .env.example .env
   # Edit .env with your MongoDB, Gemini, Twilio credentials
   ```

## Running the Development Server

```powershell
python -m uvicorn src.main:app --reload --port 8000
```

- **API:** <http://localhost:8000>
- **Swagger Docs:** <http://localhost:8000/docs>
- **ReDoc:** <http://localhost:8000/redoc>

The server auto-seeds demo data (200 citizens, 100+ tokens) on first startup.

## Module Structure

```text
src/
├── main.py                    # App entry, CORS, lifespan, auto-seed
├── common/
│   ├── config/config.py       # Environment & CORS configuration
│   ├── database/database.py   # MongoDB connection (Beanie init)
│   ├── constants/enums.py     # QueueStatus, UserRole, BookingType
│   ├── security.py            # JWT creation, password hashing
│   └── seed.py                # Production seed (200 citizens, edge cases)
└── modules/
    ├── auth/                  # Login, register, JWT middleware
    ├── users/                 # User model (Citizen, Officer, Admin)
    ├── queue/                 # Queue engine, tokens, branches, services
    ├── whatsapp/              # Twilio webhook + Gemini intent parsing
    └── ai/                    # AI chat service + ML crowd prediction
```

## Demo Credentials (Password: `password`)

| Role            | Phone        |
| --------------- | ------------ |
| Super Admin     | `9999999999` |
| Staff Officer 1 | `8888888888` |
| Staff Officer 2 | `8888888877` |
| Staff Officer 3 | `8888888866` |
| Test Citizen    | `7777777777` |

## Seed Data

The seed creates:

- 200 citizens with realistic Pune/Maharashtra names
- 3 branches (PCMC Pimpri, Tathawade, Kothrud)
- 8 government services with required documents
- 100+ tokens covering every edge case (VIP, NO_SHOW, RETURN_LATER, delay cascade, etc.)

To re-seed manually:

```powershell
Invoke-RestMethod http://localhost:8000/api/queue/admin/seed/demo
```

## WhatsApp Webhook Testing

For local Twilio webhook testing:

```powershell
ngrok http 8000
```

Then update Twilio Sandbox webhook URL to: `https://<your-ngrok-url>/api/whatsapp/webhook`

See `WHATSAPP_TESTING_RUNBOOK.md` for full details.
