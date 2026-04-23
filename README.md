# QueueOS - Smart Queue Infrastructure for Public Services

A full-stack application for managing queues in public service centers with WhatsApp integration, AI-powered assistance, and real-time tracking.

**[📖 Full Deployment Guide →](./DEPLOYMENT.md)**

---

## Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB Atlas account
- Twilio account (for WhatsApp)
- Google Gemini API key

### 1. Clone & Setup Backend

```bash
git clone <repo-url>
cd Hackathon/backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .\.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your credentials (see DEPLOYMENT.md)

# Run backend
python -m uvicorn src.main:app --reload --port 8000
```

**Backend runs at:** http://localhost:8000

### 2. Setup Frontend

```bash
cd Hackathon/frontend

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Set VITE_API_BASE_URL=http://localhost:8000

# Run frontend
npm run dev
```

**Frontend runs at:** http://localhost:5173

---

## Build & Deployment Commands

### Frontend
```bash
# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

### Backend
```bash
# Development (with auto-reload)
python -m uvicorn src.main:app --reload --port 8000

# Production
python -m uvicorn src.main:app --port 8000
```

### Deploy to Vercel

**Backend:**
```bash
cd backend
vercel --name queueos-api
# Add environment variables in Vercel dashboard
```

**Frontend:**
```bash
cd frontend
vercel --name queueos-web
# Add VITE_API_BASE_URL in Vercel dashboard
```

---

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/db
GEMINI_API_KEY=your_api_key
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_WHATSAPP_NUMBER=+1234567890
SECRET_KEY=your_secret_key
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8000
```

**[→ Full environment guide](./DEPLOYMENT.md#environment-variables)**

---

## CORS Configuration

**No CORS Errors!** ✅

The backend is pre-configured to:
- Allow localhost for development
- Allow your Vercel frontend in production
- Support Vercel preview deployments
- Auto-configure based on ENVIRONMENT variable

[Learn more about CORS setup →](./DEPLOYMENT.md#cors-configuration)

---

## Project Structure

```
Hackathon/
├── backend/              # FastAPI application
│   ├── src/
│   │   ├── main.py      # FastAPI app with CORS
│   │   └── modules/
│   │       ├── auth/    # Authentication
│   │       ├── queue/   # Queue management
│   │       ├── users/   # User management
│   │       └── whatsapp/# WhatsApp integration
│   ├── requirements.txt
│   ├── .env.example
│   └── vercel.json
├── frontend/            # React + Vite application
│   ├── src/
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   ├── queue/
│   │   │   └── admin/
│   │   └── common/
│   ├── package.json
│   ├── .env.example
│   ├── vite.config.ts
│   └── vercel.json
└── DEPLOYMENT.md        # Complete deployment guide
```

---

## API Documentation

Once backend is running:

- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc
- **API Root:** http://localhost:8000

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | See [CORS troubleshooting](./DEPLOYMENT.md#cors-errors) |
| Missing env vars | Copy `.env.example` to `.env` and fill in values |
| Backend won't start | Check Python version (3.9+) and requirements installed |
| Frontend can't reach API | Verify `VITE_API_BASE_URL` in `.env` |

**[→ Full troubleshooting guide](./DEPLOYMENT.md#troubleshooting)**

---

## Features

- ✅ **Queue Management** - Real-time queue tracking and management
- ✅ **WhatsApp Integration** - Send updates via WhatsApp
- ✅ **AI Assistance** - Google Gemini-powered help system
- ✅ **User Authentication** - JWT-based secure authentication
- ✅ **Multi-role Support** - Citizens, Staff, Admins
- ✅ **Offline Support** - Progressive Web App features
- ✅ **CORS Ready** - Pre-configured for Vercel deployment

---

## Technology Stack

**Backend:**
- FastAPI (Python web framework)
- MongoDB (NoSQL database)
- Beanie (MongoDB ORM)
- Twilio (WhatsApp API)
- Google Gemini (AI/LLM)

**Frontend:**
- React 19 (UI library)
- TypeScript (type safety)
- Vite (build tool)
- React Router (navigation)
- Material-UI (components)
- Axios (HTTP client)

---

## Getting Help

1. **Local Issues?** → Check [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)
2. **API Questions?** → Visit http://localhost:8000/docs
3. **Deployment Help?** → See [Deployment Guide](./DEPLOYMENT.md)
4. **Documentation** → Check individual README files in `backend/` and `frontend/`

---

## License

ISC

---

**Ready to deploy? Start with the [Full Deployment Guide →](./DEPLOYMENT.md)**
