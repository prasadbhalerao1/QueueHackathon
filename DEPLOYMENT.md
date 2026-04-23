# QueueOS - Deployment & Setup Guide

Complete guide to set up, develop, and deploy QueueOS (Backend + Frontend) on Vercel.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Variables](#environment-variables)
3. [Backend Setup & Deployment](#backend-setup--deployment)
4. [Frontend Setup & Deployment](#frontend-setup--deployment)
5. [CORS Configuration](#cors-configuration)
6. [Deployment to Vercel](#deployment-to-vercel)
7. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- **Python 3.9+** (for backend)
- **Node.js 16+** (for frontend)
- **Git** (for version control)
- **MongoDB Atlas account** (cloud database)
- **Vercel account** (for deployment)

### Step 1: Clone the Project

```bash
git clone <repository-url>
cd Hackathon
```

### Step 2: Set Up Backend

#### 2a. Create Python Virtual Environment

```bash
# Windows (PowerShell)
python -m venv backend\.venv
& backend\.venv\Scripts\Activate.ps1

# macOS/Linux
python3 -m venv backend/.venv
source backend/.venv/bin/activate
```

#### 2b. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
```

#### 2c. Create `.env` File

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:

```env
# Required Secrets
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/queueos
GEMINI_API_KEY=your_google_gemini_api_key
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_WHATSAPP_NUMBER=+1234567890
SECRET_KEY=generate_strong_secret_key

# Optional (defaults shown)
GEMINI_MODEL=gemini-2.5-flash
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

**How to Generate a Strong Secret Key:**

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

#### 2d. Run Backend Locally

```bash
# From backend directory with venv activated
python -m uvicorn src.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

### Step 3: Set Up Frontend

#### 3a. Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 3b. Create `.env` File

```bash
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_BASE_URL=http://localhost:8000
```

#### 3c. Run Frontend Locally

```bash
npm run dev
```

Frontend will be available at: `http://localhost:5173`

---

## Environment Variables

### Backend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `MONGODB_URI` | ✅ | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/db` |
| `GEMINI_API_KEY` | ✅ | Google Gemini API key | `AIzaSy...` |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio account SID | `ACxxxxx` |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio auth token | `1234567890abcdef` |
| `TWILIO_WHATSAPP_NUMBER` | ✅ | Twilio WhatsApp number | `+14155238886` |
| `SECRET_KEY` | ✅ | JWT secret key (must be strong) | `09d25e094faa6ca2...` |
| `GEMINI_MODEL` | ❌ | Gemini model version | `gemini-2.5-flash` (default) |
| `FRONTEND_URL` | ❌ | Frontend URL for CORS | `http://localhost:5173` (dev) |
| `ENVIRONMENT` | ❌ | Environment mode | `development` or `production` |

### Frontend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL | `http://localhost:8000` |

### Getting API Keys

**MongoDB Atlas:**
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Copy connection string in the format: `mongodb+srv://username:password@cluster.mongodb.net/database`

**Google Gemini API:**
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Create a new API key
3. Enable Generative Language API

**Twilio:**
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get Account SID and Auth Token from console
3. Set up WhatsApp sender number (or use sandbox number: `+14155238886`)

---

## Backend Setup & Deployment

### Build Commands

```bash
# Local development
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000

# Production (on Vercel)
# No special build command needed - Vercel auto-detects
```

### Vercel Backend Configuration

**File: `backend/vercel.json`**

```json
{
  "version": 2,
  "env": {
    "ENVIRONMENT": "production"
  },
  "builds": [
    {
      "src": "src/main.py",
      "use": "@vercel/python"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/main.py"
    }
  ]
}
```

### Deploy Backend to Vercel

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. From backend directory, login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Add environment variables in Vercel dashboard:
# Project Settings → Environment Variables
# Add all required .env variables
```

---

## Frontend Setup & Deployment

### Build Commands

```bash
# Install dependencies
npm install

# Development
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Vercel Frontend Configuration

**File: `frontend/vercel.json`**

```json
{
  "version": 2,
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures client-side routing works correctly for React Router.

### Deploy Frontend to Vercel

```bash
# 1. From frontend directory
vercel

# 2. When prompted, confirm settings

# 3. Add environment variables in Vercel dashboard:
# Project Settings → Environment Variables
# Add: VITE_API_BASE_URL=https://your-backend-api.vercel.app
```

---

## CORS Configuration

### What is CORS?

CORS (Cross-Origin Resource Sharing) allows your frontend to make requests to your backend API.

### Current CORS Setup

The backend is configured to allow:

**Development Mode:**
- `http://localhost:3000`
- `http://localhost:5173`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:5173`
- Frontend URL from env
- Vercel preview deployments (`*.vercel.app`)

**Production Mode:**
- Only the specific `FRONTEND_URL` from environment variables

### CORS Configuration File

**File: `backend/src/common/config/config.py`**

```python
def get_allowed_origins():
    environment = os.getenv("ENVIRONMENT", "development")
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    if environment == "production":
        return [frontend_url.rstrip("/")]
    else:
        return [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://127.0.0.1:3000",
            "http://127.0.0.1:5173",
            frontend_url.rstrip("/"),
            "https://*.vercel.app",
        ]
```

### How to Update CORS Origins

To add a new allowed origin:

1. Update `backend/src/common/config/config.py`
2. Add new URL to `get_allowed_origins()`
3. Deploy backend again

---

## Deployment to Vercel

### Deployment Checklist

- [ ] Backend environment variables configured in Vercel
- [ ] Frontend environment variables configured in Vercel
- [ ] `FRONTEND_URL` in backend matches frontend URL
- [ ] `VITE_API_BASE_URL` in frontend matches backend URL
- [ ] `.env` files are NOT committed to git (check `.gitignore`)
- [ ] `.env.example` files exist with all required variables

### Step-by-Step Deployment

#### 1. Deploy Backend First

```bash
cd backend
vercel --name queueos-api
# Answer prompts:
# - Link to existing project? no (for first time)
# - What's your project's name? queueos-api
# - In which directory is your code? . (current)
# - Want to modify vercel.json? no
```

#### 2. Get Backend URL

After deployment, Vercel will show:
```
✓ Production: https://queueos-api.vercel.app
```

#### 3. Configure Backend Environment Variables

In Vercel Dashboard:
1. Go to your project: `queueos-api`
2. Settings → Environment Variables
3. Add all variables from your `.env` file
4. Redeploy after adding variables

#### 4. Deploy Frontend

```bash
cd frontend
vercel --name queueos-web
# Answer prompts similar to backend
```

#### 5. Configure Frontend Environment Variables

In Vercel Dashboard:
1. Go to your project: `queueos-web`
2. Settings → Environment Variables
3. Add:
   ```
   VITE_API_BASE_URL=https://queueos-api.vercel.app
   ```
4. Redeploy

#### 6. Verify Deployment

- Frontend: Open `https://queueos-web.vercel.app`
- Backend API: Open `https://queueos-api.vercel.app/docs`
- Check browser console for CORS errors

---

## Troubleshooting

### CORS Errors

**Error:** `Access to XMLHttpRequest... has been blocked by CORS policy`

**Solution:**
1. Check `ENVIRONMENT` variable is set in backend
2. Check `FRONTEND_URL` matches your deployed frontend URL
3. Verify frontend env var `VITE_API_BASE_URL` is correct
4. Redeploy backend after changing environment variables

### Backend Won't Start

**Error:** `ModuleNotFoundError: No module named 'src'`

**Solution:**
```bash
# Make sure you're in backend directory
cd backend
pip install -r requirements.txt
python -m uvicorn src.main:app --reload
```

### Missing Environment Variables

**Error:** `ValidationError: ... field required`

**Solution:**
1. Copy `.env.example` to `.env`
2. Fill in all required variables
3. For Vercel, add them in project Settings → Environment Variables

### Frontend Can't Connect to Backend

**Check:**
1. Backend is running: `https://your-backend-url/docs`
2. Frontend env var `VITE_API_BASE_URL` points to correct backend
3. Browser Network tab shows requests to correct URL
4. Backend CORS allows frontend domain

### Rebuild & Redeploy

```bash
# Frontend rebuild
npm run build

# Push changes to git
git add .
git commit -m "Update deployment"
git push

# Vercel auto-deploys on git push
# Or manually redeploy:
vercel --prod
```

---

## Project Structure

```
Hackathon/
├── backend/
│   ├── .env.example          # Template for environment variables
│   ├── vercel.json           # Vercel deployment config
│   ├── requirements.txt       # Python dependencies
│   └── src/
│       ├── main.py           # FastAPI app
│       ├── common/
│       │   ├── config/
│       │   │   └── config.py # Environment config
│       │   ├── security.py    # JWT & password utilities
│       │   └── database/      # MongoDB connection
│       └── modules/
│           ├── auth/          # Authentication
│           ├── queue/         # Queue management
│           ├── users/         # User management
│           └── whatsapp/      # WhatsApp integration
├── frontend/
│   ├── .env.example          # Template for environment variables
│   ├── vercel.json           # Vercel deployment config
│   ├── package.json          # Node dependencies
│   ├── vite.config.ts        # Vite build config
│   └── src/
│       ├── main.tsx          # React entry point
│       ├── common/
│       │   ├── api.ts        # Axios API client
│       │   └── components/   # Shared components
│       └── modules/
│           ├── auth/         # Authentication pages
│           ├── queue/        # Queue management UI
│           └── admin/        # Admin dashboard
└── README.md                 # Project overview
```

---

## Quick Reference Commands

### Local Development

```bash
# Backend
cd backend
source .venv/bin/activate  # or: .\.venv\Scripts\Activate.ps1 (Windows)
pip install -r requirements.txt
python -m uvicorn src.main:app --reload --port 8000

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Production Build

```bash
# Frontend
cd frontend
npm run build
vercel --prod

# Backend (auto-deploys via git)
git push
```

### Environment Setup

```bash
# Generate secret key
python -c "import secrets; print(secrets.token_hex(32))"

# Copy example env file
cp .env.example .env
```

---

## Support & Resources

- **FastAPI Docs:** https://fastapi.tiangolo.com/
- **MongoDB Atlas:** https://www.mongodb.com/cloud/atlas
- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev/
- **Google Gemini:** https://ai.google.dev/
- **Twilio WhatsApp:** https://www.twilio.com/whatsapp

---

**Last Updated:** April 2026
**Version:** 1.0.0
