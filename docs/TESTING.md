# QueueOS Testing Guide

Complete testing guide for all system flows. For WhatsApp-specific testing, see `WHATSAPP_TESTING_RUNBOOK.md`.

---

## 🔑 Demo Credentials (Password: `password`)

| Role               | Phone        | Access                                       |
| ------------------ | ------------ | -------------------------------------------- |
| **Super Admin**    | `9999999999` | Admin Overdrive panel, analytics, protocols  |
| **Staff Officer 1**| `8888888888` | Staff dashboard, call next, advance tokens   |
| **Staff Officer 2**| `8888888877` | Staff dashboard                              |
| **Staff Officer 3**| `8888888866` | Staff dashboard                              |
| **Test Citizen**   | `7777777777` | Citizen dashboard, bookings, tracker         |

---

## 1. Environment Setup

### Backend (.env)

```env
MONGODB_URI=mongodb+srv://...
GEMINI_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_WHATSAPP_NUMBER=+14155238886
SECRET_KEY=...
FRONTEND_URL=http://localhost:5173
ENVIRONMENT=development
```

### Start Services

```powershell
# Terminal 1 — Backend
Set-Location d:\Programming\QueueOS\QueueHackathon\backend
python -m uvicorn src.main:app --reload --port 8000

# Terminal 2 — Frontend
Set-Location d:\Programming\QueueOS\QueueHackathon\frontend
npm run dev
```

---

## 2. Seed Data Verification

The backend auto-seeds on startup. Verify by checking the console output:

```text
QUEUEOS PRODUCTION SEED COMPLETE
Citizens: 201  |  Staff: 4  |  Total Users: 205
Tokens:   120+ |  Branches: 3  |  Services: 8
```

Or manually trigger via API:

```powershell
Invoke-RestMethod -Uri http://localhost:8000/api/queue/admin/seed/demo
```

---

## 3. Web Flow Testing

### 3.1 Landing Page

- [ ] Navigate to `http://localhost:5173`
- [ ] Language Toggle visible in header — switch to मराठी
- [ ] All text switches to Devanagari (except "QueueOS" brand)
- [ ] Token search input works — enter any token number and click "Track Live"
- [ ] "Forgot Token?" dialog opens and accepts phone number lookup
- [ ] Portal cards link to correct routes (/portal, /login, /citizen/dashboard)
- [ ] Mobile viewport (390px): cards stack vertically, no horizontal overflow

### 3.2 Authentication

- [ ] Navigate to `/login`
- [ ] Language Toggle visible (top-right)
- [ ] Login with `9999999999` / `password` → redirects to `/admin`
- [ ] Logout → Login with `8888888888` / `password` → redirects to `/staff`
- [ ] Logout → Login with `7777777777` / `password` → redirects to `/citizen/dashboard`
- [ ] Navigate to `/register` — Language Toggle visible
- [ ] Register new citizen with unique phone → auto-redirects to dashboard

### 3.3 Citizen Dashboard

- [ ] Shows active bookings with token numbers
- [ ] "Live Track" button opens tracker page
- [ ] "New Booking" button navigates to portal
- [ ] Language Toggle in header — switch to मराठी
- [ ] Reschedule dialog opens with datetime picker
- [ ] Cancel booking shows confirmation and removes token

### 3.4 Booking Portal

- [ ] Navigate to `/portal`
- [ ] Language Toggle visible
- [ ] Step 1: Service cards render, click to select
- [ ] Step 2: Branch dropdown populates, crowd prediction loads
- [ ] Step 3: Name/phone/datetime inputs work
- [ ] Step 4: Confirmation summary displays correctly
- [ ] "Confirm Booking" creates token and redirects to tracker
- [ ] Stepper labels render correctly in Marathi mode

### 3.5 Live Tracker

- [ ] Navigate to `/track/<TOKEN_NUMBER>` (use any A-xxx token)
- [ ] Language Toggle in top bar
- [ ] Token number displays large
- [ ] Status chip shows current state
- [ ] Progress bar and queue stats update
- [ ] "Running Late" button opens delay dialog
- [ ] After COMPLETED: feedback rating appears
- [ ] CALLED state: green background, "IT'S YOUR TURN" animation

### 3.6 Staff Dashboard

- [ ] Login as Officer (8888888888)
- [ ] Language Toggle visible
- [ ] Branch and Desk selectors work
- [ ] "Call Next" advances first WAITING token to CALLED
- [ ] Serving card shows Start/Complete/No-Show buttons
- [ ] Walk-In dialog creates new token
- [ ] Undo toast appears after actions
- [ ] Transfer dialog moves token to different branch
- [ ] Availability toggle and Desk Pause work

### 3.7 Admin Dashboard

- [ ] Login as Admin (9999999999)
- [ ] Language Toggle visible in header controls
- [ ] KPI cards show tokens served, waiting, efficiency, no-show rate
- [ ] Branch selector changes all data
- [ ] Rush Protocol toggle works
- [ ] VIP Override creates priority token
- [ ] Emergency Reset clears active tokens (with confirmation)
- [ ] Modify Capacity dialog updates desk count
- [ ] Live Ops Preview shows embedded Staff Dashboard

---

## 4. Multilingual (i18n) Testing

- [ ] Every page has a Language Toggle component
- [ ] Switching to मराठी translates all static UI labels
- [ ] Dynamic data (names, phone numbers, timestamps) remains unchanged
- [ ] "QueueOS" brand name stays in English
- [ ] Devanagari text does not overflow containers
- [ ] Language preference persists across page navigation
- [ ] Stepper labels, dialog titles, button text all translate

---

## 5. AI Chat Widget Testing

- [ ] Chat icon (💬) appears on Citizen Dashboard, Portal, and Tracker
- [ ] Click to open floating chat panel
- [ ] Type "What documents do I need for Aadhaar?" → AI responds
- [ ] Type in Marathi: "आधार कार्ड साठी कोणती कागदपत्रे लागतात?" → AI responds
- [ ] Chat history persists during session
- [ ] Close and reopen preserves conversation

---

## 6. Edge Case Testing

| Edge Case            | How to Test                                                     | Expected Result                                          |
| -------------------- | --------------------------------------------------------------- | -------------------------------------------------------- |
| No-Show Grace Re-entry | Staff marks token as No-Show, then clicks "Mark Late Arrival" | Token returns to WAITING, placed after currently serving |
| Delay Cascade        | Check desk 5 token (IN_PROGRESS 40+ min) in seed               | Subsequent wait times should show increased estimates    |
| VIP Override         | Admin clicks "Issue VIP Token"                                  | VIP-001 appears at top of queue                          |
| RETURN_LATER         | Find R-xxx token in staff dashboard                             | Token shows "missing docs" note                          |
| Dual Active Tokens   | Search last citizen in DB                                       | Has 2 active WAITING tokens                              |
| Branch Transfer      | Staff clicks Transfer on any token                              | Token moves to target branch queue                       |
| 5-Min Undo           | Staff completes a token, then clicks Undo                       | Token reverts to previous state                          |

---

## 7. Mobile Responsiveness

Test these pages at 390px viewport width:

- [ ] Landing Page — hero stacks, cards column, track form stacks
- [ ] Login / Register — card fits, no overflow
- [ ] Citizen Dashboard — buttons stack, cards full-width
- [ ] Booking Portal — stepper labels readable, steps stack
- [ ] Tracker — token number scales, stats grid works
- [ ] All dialogs — full-width on mobile, no cutoff

---

## 8. API Quick Tests

```powershell
# Health check
Invoke-RestMethod http://localhost:8000/health

# List branches
Invoke-RestMethod http://localhost:8000/api/queue/branches

# Track a token
Invoke-RestMethod http://localhost:8000/api/queue/track/A-167

# ML crowd prediction
Invoke-RestMethod http://localhost:8000/api/ml/predict-crowd/<BRANCH_ID>
```

---

## 9. Common Issues

| Issue                          | Solution                                           |
| ------------------------------ | -------------------------------------------------- |
| Empty dashboard                | Restart backend — auto-seeds on startup            |
| "Unauthorized" on citizen pages| Login again — JWT may have expired                 |
| Marathi text not showing       | Check i18n.ts has the key, component uses `t()`    |
| AI Chat returns error          | Verify `GEMINI_API_KEY` in .env                    |
| Crowd prediction fails         | Ensure branch ID exists in database                |
