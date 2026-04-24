# QueueOS: Project Documentation & MVP Blueprint

## 1. Product Strategy & Overview

### Brief About the Solution

QueueOS is a digital-first, multilingual queue management system designed for Indian public sector offices (CFCs, Aadhaar Centers, Municipal Wards). It replaces traditional physical lines and ticket printers with a WhatsApp-integrated PWA, allowing citizens to book slots remotely and track their "Place in Line" via a live mobile dashboard — in English or मराठी (Devanagari).

### Opportunities

* **Government Digitization**: Massive push for "Digital India" creates a high-demand market for low-friction public tools.
* **Monetization**: SaaS model for private entities (Clinics, Banks) and Annual Maintenance Contracts (AMC) for government bodies.
* **Data Insights**: Aggregated data on service efficiency can be sold as "Public Service Performance Reports" to urban planners.

### How it Solves the Problem

1. **Remote Entry**: Citizen sends "Hi" on WhatsApp, or books via the web portal.
2. **Intent Engine**: Gemini AI classifies the service (e.g., Aadhaar, Tax, Birth Certificate).
3. **Virtual Ticket**: System issues a token and a tracking link.
4. **AI Crowd Prediction**: ML model predicts crowd levels and suggests best visit time.
5. **Live Tracker**: Citizen waits at home, only arriving when the app says "5 mins remaining."
6. **Staff Dashboard**: Officers call tokens with one click, reducing counter-side chaos.
7. **Document Assistance**: AI Chat Widget guides citizens on required documents in their language.

### Differentiation

Unlike legacy systems (Q-Matic), QueueOS requires **zero physical hardware** (no kiosks, no printers). It works on the devices citizens already own (WhatsApp) and uses affordable AI (Gemini 2.5 Flash) for natural language handling. Full Devanagari localization makes it accessible to the ~100M Marathi-speaking population.

### USP

*"Zero-Hardware, AI-Driven, Multilingual Public Service Accessibility."*

---

## 2. Product Features

### Citizen Features

* **WhatsApp Booking**: Conversational slot booking in English/Hindi/Marathi via Gemini AI.
* **Web Booking Portal**: 4-step wizard with service selection, branch insights, and scheduling.
* **Live PWA Tracker**: Real-time "People Ahead" and "ETA" display, mobile-first design.
* **Smart Delay**: "Running Late" button that safely pushes the token back without cancellation.
* **AI Document Chat**: Gemini-powered widget to ask about required documents in any language.
* **Multilingual UI**: Full English ↔ मराठी (Devanagari) toggle on every page.
* **Feedback System**: 5-star rating after service completion.
* **Citizen Dashboard**: View active bookings, history, reschedule, or cancel appointments.

### Staff Features

* **One-Click Call**: Move queue from Waiting → Called → In Progress → Complete.
* **Desk Management**: Selectable desk numbers to guide citizens to the right counter.
* **5-Minute Undo Window**: Safety net to reverse accidental status changes.
* **Branch Transfer**: Move a citizen to a different branch if they arrived at the wrong office.
* **Walk-in Registration**: Instantly add tech-illiterate citizens to the digital queue.
* **Grace Re-entry**: Re-admit no-show citizens with a 1-person penalty.
* **Availability Toggle**: Staff can mark themselves available/unavailable.
* **Desk Pause**: Return all desk tokens to the pool when taking a break.

### Admin Features

* **Rush Protocol**: Emergency lock on new walk-ins with automated WhatsApp broadcasts.
* **Capacity Control**: Real-time adjustment of active service desks per branch.
* **VIP Override**: Immediate injection of high-priority tokens for elderly/emergency cases.
* **Emergency Reset**: Nuclear option — clear all active tokens instantly.
* **Live Analytics**: Dashboard showing tokens served, avg wait time, no-show rates.
* **Live Operations Preview**: Embedded staff dashboard view for monitoring.
* **Multilingual Admin**: Full Devanagari support for admin controls.

---

## 3. Technical Stack

| Layer                | Technology                      | Justification                                                         |
| :------------------- | :------------------------------ | :-------------------------------------------------------------------- |
| **Frontend**         | React 19 + MUI v6 + TypeScript | Component-based architecture with WCAG-accessible components.         |
| **Localization**     | react-i18next                   | Industry-standard i18n with instant language switching.                |
| **State Management** | TanStack Query                  | Server state management with 3s polling for real-time updates.         |
| **Backend**          | FastAPI (Python 3.10+)          | High-performance async capabilities for real-time queue transitions.   |
| **Database**         | MongoDB Atlas (Beanie ODM)      | Flexible schema for varying citizen data and high-speed writes.        |
| **AI / NLP**         | Gemini 2.5 Flash                | Cost-effective intent extraction, document chat, and OCR hints.        |
| **ML**               | Scikit-learn                    | Crowd prediction model for branch load estimation.                     |
| **Messaging**        | Twilio WhatsApp API             | Programmatic WhatsApp messages for booking confirmations and alerts.    |
| **Auth**             | JWT (PyJWT) + bcrypt            | Stateless, secure authentication for staff and citizens.               |
| **Deployment**       | Vercel                          | Zero-config serverless hosting for both frontend and backend.          |

---

## 4. Comprehensive API Endpoints

| Method  | Endpoint                                 | Purpose                                      |
| :------ | :--------------------------------------- | :------------------------------------------- |
| `POST`  | `/api/auth/login`                        | Staff/Citizen Login (phone + password)        |
| `POST`  | `/api/auth/register`                     | Citizen Registration                          |
| `GET`   | `/api/queue/branches`                    | List all branch locations                     |
| `GET`   | `/api/queue/services`                    | List all available services                   |
| `GET`   | `/api/queue/{branch_id}`                 | Live queue data for a branch                  |
| `GET`   | `/api/queue/track/{token}`               | Public token status lookup                    |
| `GET`   | `/api/queue/my-tokens`                   | Citizen's own tokens (JWT auth)               |
| `PATCH` | `/api/queue/advance/{id}`                | Status transition (Call/Start/Complete/No-Show)|
| `POST`  | `/api/queue/walk-in`                     | Manual walk-in registration                   |
| `POST`  | `/api/queue/web-booking`                 | Web portal booking                            |
| `PATCH` | `/api/queue/reschedule/{id}`             | Reschedule an appointment                     |
| `PATCH` | `/api/queue/cancel/{id}`                 | Cancel an appointment                         |
| `POST`  | `/api/queue/feedback/{id}`               | Submit star rating                            |
| `POST`  | `/api/queue/delay/{id}`                  | Report delay (hold spot)                      |
| `POST`  | `/api/queue/transfer/{id}`               | Transfer token to another branch              |
| `POST`  | `/api/queue/rush/{id}`                   | Toggle Rush Protocol                          |
| `POST`  | `/api/queue/undo/{id}`                   | Revert last status change                     |
| `PATCH` | `/api/queue/admin/branch/{id}/capacity`  | Set branch capacity                           |
| `GET`   | `/api/queue/analytics/{branch_id}`       | Branch analytics                              |
| `POST`  | `/api/queue/admin/vip/{branch_id}`       | Issue VIP token                               |
| `POST`  | `/api/queue/admin/reset/{branch_id}`     | Emergency reset                               |
| `POST`  | `/api/queue/admin/seed/demo`             | Seed demo data (200 citizens)                 |
| `POST`  | `/api/chat/ask`                          | AI document assistant chat                    |
| `GET`   | `/api/ml/predict-crowd/{branch_id}`      | ML crowd prediction                           |
| `POST`  | `/api/whatsapp/webhook`                  | Twilio WhatsApp webhook                       |

---

## 5. Estimated Implementation & Cost Analysis

### Development Cost (Offshore/Nearshore)

| Phase                        | Hours   | Estimated Cost ($50/hr) |
| :--------------------------- | :------ | :---------------------- |
| UI/UX Design + i18n          | 50      | $2,500                  |
| Frontend Development         | 140     | $7,000                  |
| Backend & AI/ML Integration  | 180     | $9,000                  |
| QA & UAT                     | 50      | $2,500                  |
| **Total**                    | **420** | **$21,000**             |

### Deployment Cost (Initial)

* **Domain & SSL**: $150 / year.
* **Cloud Infrastructure Setup**: $500 (one-time provisioning).
* **WhatsApp Business API (Twilio)**: $0 (Initial credit) + per-message cost.

### Scaling Cost Breakdown (Monthly)

| Service                      | Year 1 (1,000 DAU) | Year 2 (50,000 DAU) |
| :--------------------------- | :------------------ | :------------------- |
| **Compute (EC2/EKS)**        | $120                | $850                 |
| **Database (MongoDB Atlas)** | $60                 | $450                 |
| **Caching (Redis)**          | $30                 | $150                 |
| **AI (Gemini Flash)**        | $50                 | $500                 |
| **WhatsApp Messages**        | $200                | $2,500               |
| **Bandwidth & CDN**          | $20                 | $350                 |
| **Total / Month**            | **~$480**           | **~$4,800**          |
