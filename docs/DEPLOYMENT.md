# QueueOS - Deployment & Setup Guide

Complete guide to set up, develop, and deploy QueueOS (Backend + Frontend) on Google Cloud Run.

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Variables](#environment-variables)
3. [Deployment to Google Cloud Run](#deployment-to-google-cloud-run)
4. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

- **Python 3.10+** (for backend)
- **Node.js 18+** (for frontend)
- **Git** (for version control)
- **MongoDB Atlas account** (cloud database)
- **Google Cloud account** (for deployment)

### Step 1: Clone the Project

```bash
git clone <repository-url>
cd QueueHackathon
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

Copy `.env.example` to `.env` and fill in your credentials. See [Environment Variables](#environment-variables).

#### 2d. Run Backend Locally

```bash
python -m uvicorn src.main:app --reload --port 8000
```

Backend will be available at: `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`

### Step 3: Set Up Frontend

#### 3a. Install Frontend Dependencies

```bash
cd frontend
npm install
```

#### 3b. Create `.env` File

Copy `.env.example` to `.env`. Set `VITE_API_BASE_URL=http://localhost:8000`.

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
| `FRONTEND_URL` | ❌ | Frontend URL for CORS | `http://localhost:5173` |

### Frontend Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_BASE_URL` | ✅ | Backend API URL | `http://localhost:8000` |

---

## Deployment to Google Cloud Run

We use Docker to deploy both the frontend and backend to Google Cloud Run for scalable, serverless execution.

### Prerequisites for Deployment
1. Install [Google Cloud CLI](https://cloud.google.com/sdk/docs/install).
2. Authenticate: `gcloud auth login`
3. Set your project: `gcloud config set project queueos-494407`

### 1. Deploy the Backend
Ensure your `backend/.gcloudignore` and `backend/Dockerfile` are present.

```powershell
cd backend
gcloud run deploy queueos-backend `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated `
  --set-env-vars "MONGODB_URI=your_mongo_uri,GEMINI_API_KEY=your_gemini_key,TWILIO_ACCOUNT_SID=your_sid,TWILIO_AUTH_TOKEN=your_token,TWILIO_WHATSAPP_NUMBER=your_number,SECRET_KEY=your_secret,ENVIRONMENT=production"
```
*Note down the backend URL output by this command.*

### 2. Update Frontend Environment
Edit `frontend/.env` and update `VITE_API_BASE_URL` to point to the new Cloud Run Backend URL you just received.

### 3. Deploy the Frontend
Ensure your `frontend/.gcloudignore`, `frontend/.dockerignore`, `frontend/nginx.conf`, and `frontend/Dockerfile` are present.

```powershell
cd ../frontend
gcloud run deploy queueos-frontend `
  --source . `
  --platform managed `
  --region us-central1 `
  --allow-unauthenticated
```

### 4. Update Backend CORS
After the frontend deploys, update the backend's environment variables to accept traffic from the new frontend URL.

```powershell
gcloud run services update queueos-backend `
  --region us-central1 `
  --update-env-vars "FRONTEND_URL=https://queueos-frontend-url.run.app"
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| CORS errors | Check `FRONTEND_URL` environment variable on the Cloud Run backend matches your frontend URL exactly. |
| IAM Permissions Error during deploy | Ensure your Cloud Build service account has `roles/artifactregistry.writer` and `roles/storage.objectViewer` permissions in GCP IAM. |
| Empty Dashboard | Call the `POST /api/queue/admin/seed/demo` endpoint with the Super Admin account token to seed the database. |

**Last Updated:** April 2026
**Version:** 1.0.0
