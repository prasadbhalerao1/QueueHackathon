# QueueOS: Project Documentation & MVP Blueprint

## 1. Product Strategy & Overview

### Brief About the Solution
QueueOS is a digital-first queue management system designed for public sector offices (CFCs, Aadhaar Centers, Municipal Offices). It replaces traditional physical lines and ticket printers with a WhatsApp-integrated PWA, allowing citizens to book slots remotely and track their "Place in Line" via a live mobile dashboard.

### Opportunities
*   **Government Digitization**: Massive push for "Digital India" and similar global initiatives creates a high-demand market for low-friction public tools.
*   **Monetization**: SaaS model for private entities (Clinics, Banks) and Annual Maintenance Contracts (AMC) for government bodies.
*   **Data Insights**: Aggregated data on service efficiency can be sold as "Public Service Performance Reports" to urban planners.

### How it Solves the Problem
1.  **Remote Entry**: Citizen sends a "Hi" to a WhatsApp number.
2.  **Intent Engine**: AI classifies the service (e.g., Aadhaar, Tax).
3.  **Virtual Ticket**: System issues a token and a tracking link.
4.  **Live Tracker**: Citizen waits at a cafe/home, only arriving when the app says "5 mins remaining."
5.  **Staff Dashboard**: Officers call tokens with one click, reducing counter-side chaos.

### Differentiation
Unlike legacy systems (Q-Matic), QueueOS requires **zero physical hardware** (no kiosks, no printers). It works on the devices citizens already own (WhatsApp) and uses affordable AI (Gemini) for natural language handling.

### USP
**"Zero-Hardware, AI-Driven Public Service Accessibility."**

---

## 2. Product Features

### Citizen Features
*   **WhatsApp Booking**: Conversational slot booking in English/Hindi/Marathi.
*   **Live PWA Tracker**: Real-time "People Ahead" and "ETA" display.
*   **Smart Delay**: "Running Late" button that safely pushes the token back without cancellation.
*   **Multilingual Support**: Auto-detection of citizen language for all alerts.

### Staff Features
*   **One-Click Call**: Move queue from Waiting -> Called -> In Progress.
*   **Desk Management**: Selectable desk numbers to guide citizens to the right counter.
*   **Undo Window**: 5-minute safety net to reverse accidental status changes.
*   **Branch Transfer**: Move a citizen to a different branch if they arrived at the wrong office.

### Admin Features
*   **Rush Protocol**: Emergency lock on new walk-ins with automated WhatsApp broadcasts.
*   **Capacity Control**: Real-time adjustment of active service desks.
*   **VIP Override**: Immediate injection of high-priority tokens for elderly/emergency cases.
*   **Live Analytics**: Dashboard showing avg wait times and no-show rates.

---

## 3. Technical Stack

| Layer | Technology | Justification |
| :--- | :--- | :--- |
| **Frontend** | React 18 + MUI | Component-based architecture for high-fidelity dashboards and WCAG accessibility. |
| **Backend** | FastAPI (Python) | High-performance async capabilities essential for real-time queue state transitions. |
| **Database** | MongoDB (Beanie) | Flexible schema for varying citizen data and high-speed write operations. |
| **AI / NLP** | Gemini 2.5 Flash | Cost-effective, high-speed intent extraction for WhatsApp messages. |
| **Cloud** | AWS (EKS/RDS) | Industry standard for security and government-grade data residency compliance. |
| **Auth** | JWT (PyJWT) | Stateless, secure authentication for staff and citizens. |

---

## 4. Comprehensive API Endpoints (MVP)

| Method | Endpoint | Purpose | Payload (JSON) |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Staff Login | `{"phone": "...", "password": "..."}` |
| `POST` | `/api/auth/citizen-login` | Citizen Phone Login | `{"phone": "..."}` |
| `GET` | `/api/queue/branches` | List all locations | - |
| `GET` | `/api/queue/{branch_id}` | Live queue data | - |
| `GET` | `/api/queue/track/{token}`| Public status lookup | - |
| `PATCH` | `/api/queue/advance/{id}` | Status transition | `{"new_status": "...", "desk_number": 1}` |
| `POST` | `/api/queue/walk-in` | Manual registration | `{"name": "...", "phone": "...", "service_id": "..."}` |
| `POST` | `/api/queue/rush/{id}` | Toggle Rush Mode | - |
| `PATCH` | `/api/queue/admin/branch/{id}/capacity` | Set capacity | `query: capacity=5` |
| `POST` | `/api/queue/undo/{id}` | Revert status | - |

---

## 5. Estimated Implementation & Cost Analysis

### Development Cost (Offshore/Nearshore)
| Phase | Hours | Estimated Cost ($50/hr) |
| :--- | :--- | :--- |
| UI/UX Design | 40 | $2,000 |
| Frontend Development | 120 | $6,000 |
| Backend & AI Integration | 160 | $8,000 |
| QA & UAT | 40 | $2,000 |
| **Total** | **360** | **$18,000** |

### Deployment Cost (Initial)
*   **Domain & SSL**: $150 / year.
*   **AWS Infrastructure Setup**: $500 (one-time provisioning).
*   **WhatsApp Business API (Twilio)**: $0 (Initial credit) + per-message cost.

### Scaling Cost Breakdown (Monthly)

| Service | Year 1 (1,000 DAU) | Year 2 (50,000 DAU) |
| :--- | :--- | :--- |
| **Compute (EC2/EKS)** | $120 (2x t3.medium) | $850 (Load balanced clusters) |
| **Database (MongoDB Atlas)**| $60 (M10 Cluster) | $450 (M30 Cluster + Sharding) |
| **Caching (Redis)** | $30 | $150 |
| **AI (Gemini Flash)** | $50 (Free tier + low usage) | $500 (Paid Tier / High Throughput) |
| **WhatsApp Messages** | $200 (Conversational cost) | $2,500 (Bulk conversational cost) |
| **Bandwidth & CDN** | $20 | $350 |
| **Total / Month** | **~$480** | **~$4,800** |
