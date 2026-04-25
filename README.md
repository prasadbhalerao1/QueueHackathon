# QueueOS — Smart Queue Infrastructure for Public Services

A full-stack, multilingual (English / मराठी) queue management platform for Indian public service centers with WhatsApp integration, AI-powered document assistance, ML-based crowd prediction, and real-time citizen tracking.

**[📖 Full Deployment Guide →](./docs/DEPLOYMENT.md)** · **[🧪 Testing Guide →](./docs/TESTING.md)** · **[📊 Architecture Diagrams →](./docs/Diagrams.md)**

---

## 🔑 Demo Credentials

| Role | Phone | Password | Access |
|------|-------|----------|--------|
| **Super Admin** | `9999999999` | `password` | Analytics, capacity, rush protocol, VIP override |
| **Staff Officer (Kadam)** | `8888888888` | `password` | Call next, advance tokens, walk-ins, transfers |
| **Staff Officer (Joshi)** | `8888888877` | `password` | Call next, advance tokens, walk-ins, transfers |
| **Staff Officer (Pawar)** | `8888888866` | `password` | Call next, advance tokens, walk-ins, transfers |
| **Test Citizen (Demo)** | `7777777777` | `password` | Live Dashboard (3 past activities, 1 active token) |

---

## Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB Atlas account
- Twilio account (for WhatsApp)
- Google Gemini API key

### 1. Backend Setup

```powershell
cd QueueHackathon\backend

# Create & activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Setup environment
Copy-Item .env.example .env
# Edit .env with your credentials (see docs/DEPLOYMENT.md)

# Run backend (auto-seeds demo data on first run)
python -m uvicorn src.main:app --reload --port 8000
```

**Backend:** http://localhost:8000 · **API Docs:** http://localhost:8000/docs

### 2. Frontend Setup

```powershell
cd QueueHackathon\frontend

# Install dependencies
npm install

# Setup environment
Copy-Item .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000

# Run frontend
npm run dev
```

**Frontend:** http://localhost:5173

---

## Features

| Feature | Description |
|---------|-------------|
| ✅ **Multilingual UI** | Full English ↔ मराठी (Devanagari) toggle on every page via `react-i18next` |
| ✅ **WhatsApp Booking** | Conversational slot booking via Twilio + Gemini AI intent parsing |
| ✅ **Live Token Tracking** | Real-time "People Ahead" + ETA on a mobile-first PWA tracker |
| ✅ **AI Document Assistant** | Gemini-powered chat widget for govt document guidance |
| ✅ **ML Crowd Prediction** | Scikit-learn model predicts branch crowd levels + best visit times |
| ✅ **Staff Dashboard** | One-click Call → Start → Complete flow, undo window, desk management |
| ✅ **Admin Overdrive** | Rush Protocol, VIP Override, Emergency Reset, capacity control |
| ✅ **Smart Delay** | "Running Late" button that holds citizen's spot without cancellation |
| ✅ **Grace Re-entry** | Staff can re-admit no-show citizens with a 1-person penalty |
| ✅ **Branch Transfer** | Move tokens across branches with 1 click |
| ✅ **Web Booking Portal** | 4-step wizard with AI crowd insights and required docs display |
| ✅ **Feedback System** | 5-star rating after service completion |
| ✅ **Offline Support** | TanStack Query mutations cached locally during network drops |
| ✅ **Mobile Responsive** | All citizen-facing pages optimized for mobile viewports |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite, Material UI v6, TanStack Query, react-i18next |
| **Backend** | FastAPI (Python), Beanie ODM, Pydantic v2 |
| **Database** | MongoDB Atlas |
| **AI / NLP** | Google Gemini 2.5 Flash (WhatsApp intent + document chat) |
| **ML** | Scikit-learn (crowd prediction model) |
| **Messaging** | Twilio (WhatsApp Business API) |
| **Auth** | JWT (PyJWT) + bcrypt |
| **Deployment** | Google Cloud Run (Containerized Frontend + Backend) |

---

## Project Structure

```text
QueueHackathon/
├── backend/                    # FastAPI application
├── frontend/                   # React + Vite application
├── docs/                       # Comprehensive Documentation
│   ├── DEPLOYMENT.md           # Full deployment guide
│   ├── Diagrams.md             # Architecture & flow diagrams
│   ├── Project_Documentation.md # Product strategy & feature spec
│   ├── SRS.md                  # Software Requirements Specification
│   ├── TESTING.md              # Testing guide
│   └── WHATSAPP_TESTING_RUNBOOK.md
├── README.md                   # ← You are here
```

---

## API Documentation

Once backend is running:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check `FRONTEND_URL` in backend `.env`. See [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md#cors-configuration) |
| Backend won't start | Check Python 3.10+ and `pip install -r requirements.txt` |
| Frontend can't reach API | Verify `VITE_API_BASE_URL` in frontend `.env` |
| Empty dashboard | Hit seed endpoint or restart backend (auto-seeds on startup) |
| Marathi text not showing | Ensure `react-i18next` is imported in the component |

**[→ Full troubleshooting guide](./docs/DEPLOYMENT.md#troubleshooting)**

---

## License

ISC

---

**Ready to deploy? Start with the [Full Deployment Guide →](./docs/DEPLOYMENT.md)**
