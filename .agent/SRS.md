# **Software Requirements Specification (SRS) & Product Architecture**

## **QueueOS: Smart Queue Infrastructure for Public Services**

## **1\. Executive Summary**

### **1.1 Problem Statement**

Indian public offices (Citizen Facilitation Centers, RTOs, Municipal Wards) suffer from severe overcrowding, opaque wait times, and inefficient physical token systems. This leads to massive productivity loss for citizens, high stress for government staff, and an environment ripe for petty corruption.

### **1.2 Product Vision**

QueueOS is an offline-first, rule-based queue orchestration platform that reduces physical waiting times by 40%. It bridges the gap between digital portals and physical office visits by utilizing WhatsApp (via Gemini AI) for citizen booking, a Progressive Web App (PWA) for staff management, and an Adaptive Real-Time Queue Engine. **We sell outcomes (Queue Time Reduction), not theoretical AI tech stacks.**

## **2\. Target Market & Go-To-Market (GTM)**

* **The Niche:** Citizen Facilitation Centers (CFCs), municipal document offices, college admission desks, and hospital OPD counters.  
* **The "Trojan Horse" Strategy:**  
  * **Phase 1:** Sell to semi-public trusts and private hospitals (efficiency-driven buyers).  
  * **Phase 2:** Leverage Phase 1 KPIs to execute ₹49,000 micro-pilots with municipal ward officers via the Indian GeM Startup Runway program.  
  * **Phase 3:** Scale to district-wide B2G contracts.

## **3\. System Architecture & Tech Stack**

Optimized for zero-cost cloud hosting, rapid iteration, and serverless environments.

* **Frontend:** React 18, Vite, TypeScript, Material UI (MUI).  
* **State Management & Data Sync:** TanStack Query v5 (Smart Polling at 3000ms intervals to bypass Serverless WebSocket limitations).  
* **Backend:** Python FastAPI (Asynchronous REST API).  
* **Database:** MongoDB Atlas M0 (Free Tier).  
* **ODM:** Beanie (Motor) for Pydantic validation.  
* **AI Engine:** Google Cloud Vertex AI (Gemini 1.5 Flash) via google-genai SDK (Strict JSON structured outputs for NLP and OCR).  
* **Messaging Layer:** Twilio Sandbox for WhatsApp.  
* **External APIs:** Google Maps Distance Matrix API (Smart Routing), Google Wallet Generic Pass API (Digital Tokens).  
* **Deployment:** Vercel (Frontend & Serverless Python Backend).

## **4\. User Roles & Personas**

1. **Citizen (The End User):** Wants to get work done with zero confusion and minimal waiting. Interfaces via WhatsApp, mobile web, or physical QR codes.  
2. **Staff/Operator (The Bottleneck Manager):** Wants to process citizens quickly without being yelled at. Interfaces via an offline-capable, highly accessible React dashboard.  
3. **Admin/Manager (The Decision Maker):** Wants branch efficiency metrics, SLA tracking, and the ability to control crowd chaos dynamically. Interfaces via a KPI dashboard.

## **5\. Detailed Functional Requirements (FRs)**

### **5.1 Role 1: Citizen Features**

| ID | Feature | Detailed Description |
| :---- | :---- | :---- |
| **C1** | **WhatsApp NLP Booking** | Citizen sends "Hi" to Twilio number. Gemini parses intent, detects language (Hindi/Marathi/Eng), and guides user to select Service \-\> Branch \-\> Slot. |
| **C2** | **Document Pre-Validation** | Gemini AI prompts user to upload necessary documents (e.g., Aadhaar) via WhatsApp. Basic OCR checks if the document matches the required type before confirming the token. |
| **C3** | **Smart Alternative Suggestions** | If the selected branch has a \>60 min wait, the system queries Google Maps API to suggest a nearby branch with a shorter combined travel+wait time. |
| **C4** | **Google Wallet Integration** | Upon booking, user receives a link to generate a digital Queue Pass saved directly to Android Google Wallet. |
| **C5** | **Live Queue Tracking** | A stateless, mobile-friendly PWA link showing real-time token progress ("Currently Serving: A-12, You are A-24, Est. Wait: 18 mins"). |
| **C6** | **Self-Reported Delays** | User can click "Running late by 10 mins" on the tracker. Triggers the Grace Re-entry engine (see Business Rules). |
| **C7** | **QR Code Check-in** | Citizen scans a physical QR code at the branch to automatically shift token status from BOOKED to ARRIVED. |

### **5.2 Role 2: Staff / Operator Features**

| ID | Feature | Detailed Description |
| :---- | :---- | :---- |
| **S1** | **Accessible Dashboard** | WCAG 2.0 AA compliant UI. High contrast, 44x44px touch targets, aria-live regions for screen readers. |
| **S2** | **Walk-in Registration Kiosk** | Staff can manually enter a phone number/name to instantly generate a token for citizens without smartphones. |
| **S3** | **Token State Machine UI** | Distinct, color-coded buttons to progress a token: Call Next (Primary) \-\> Start Service (Success) \-\> Complete (Secondary). |
| **S4** | **No-Show Marking** | 1-click button to mark a citizen as NO\_SHOW if they do not appear when called. |
| **S5** | **Return Later / Hold** | If a citizen lacks documents at the desk, staff marks RETURN\_LATER. Keeps token active for the day without blocking the queue. |
| **S6** | **Late Arrival Recovery** | Staff can search a NO\_SHOW token and click "Mark Late Arrival" to trigger Grace Re-entry. |
| **S7** | **Action Undo Window** | 5-minute undo window via MUI Snackbar to revert accidental status changes (e.g., accidentally clicking "Complete"). |

### **5.3 Role 3: Admin / Manager Features**

| ID | Feature | Detailed Description |
| :---- | :---- | :---- |
| **A1** | **Live KPI Dashboard** | Real-time charts showing Active Desks, Current Average Wait Time, Tokens Served, and No-Show percentages. |
| **A2** | **Service & Capacity Config** | Set base duration times for services (e.g., Affidavits \= 10 mins), active desk counts, and priority levels. |
| **A3** | **VIP Override Protocol** | Admin generates a Priority Level 1 token that bypasses the math engine, immediately injecting a VIP to the front of the queue. |
| **A4** | **Rush Protocol Broadcast** | 1-click trigger that disables walk-ins and sends a mass WhatsApp alert to all BOOKED citizens warning of severe branch delays. |
| **A5** | **Total Blackout Mode** | Simulates complete network failure. Shifts UI to high-contrast dark mode with an active IndexedDB cache alert. |

## **6\. Non-Functional Requirements (NFRs)**

| ID | Requirement | Specification |
| :---- | :---- | :---- |
| **NFR1** | **Offline-First Resilience** | The Staff PWA uses a Service Worker. If internet drops, mutations (Call Next, Complete) are saved to IndexedDB. Background sync pushes updates to MongoDB when online. |
| **NFR2** | **Serverless Compatibility** | The backend must remain 100% stateless. No WebSockets. Real-time feel is achieved via TanStack Query refetchInterval: 3000 (polling). |
| **NFR3** | **Accessibility (GIGW 3.0)** | Must meet WCAG 2.0 Level AA. Visible focus states for all interactive elements. Minimum 4.5:1 text contrast ratio. |
| **NFR4** | **Response Time** | API endpoints must return within 200ms (excluding external API calls to Gemini/Twilio). |
| **NFR5** | **Error Handling** | Strict JSend format (status: error, message: string). No silent backend failures. All UI interactions must use loading Skeletons and error boundaries. |

## **7\. Adaptive Real-Time Queue Engine (Core Business Rules)**

These deterministic rules replace complex ML forecasting to guarantee system reliability.

* **Rule 1: The 10-Minute Auto-Skip**  
  If a token sits in CALLED status for \>10 minutes, the staff UI prompts a NO\_SHOW flag. The system auto-calls the next token.  
* **Rule 2: The Grace Re-Entry (Late Arrivals)**  
  If a NO\_SHOW citizen arrives later, they are NOT sent to the back of the queue. They receive a 1-person penalty. The system updates their status to WAITING and sets their expected\_service\_time to exactly 1 minute *after* the token currently in IN\_PROGRESS.  
* **Rule 3: The 15-Minute Delay Cascade**  
  If an officer is stuck on a complex case and a token is IN\_PROGRESS for \>15 minutes past its configured base\_duration, a FastAPI BackgroundTask fires. It adds timedelta(minutes=15) to all subsequent WAITING tokens and triggers Gemini to send a WhatsApp delay alert to affected users.  
* **Rule 4: Anti-Spam Rate Limiting**  
  A single phone number can hold a maximum of 2 active (BOOKED, ARRIVED, WAITING) tokens across the entire database to prevent WhatsApp bot spam.  
* **Rule 5: Cross-Branch Transfer (Wrong Location)**  
  If a citizen scans the QR code at Branch B but booked at Branch A, the system intercepts the error and allows the staff to execute a 1-click transfer\_branch mutation.

## **8\. Hackathon "Judge Defense" Matrix**

If the judges attempt to poke holes in the architecture, use these built-in defenses:

| Judge's Question / Attack | QueueOS Engineered Defense |
| :---- | :---- |
| *"What if someone spams the WhatsApp bot to hold all the spots?"* | **Rule 4: Anti-Spam Rate Limit.** Hard database cap of 2 active tokens per phone number. |
| *"What if citizens show up at the wrong branch?"* | **Rule 5: Cross-Branch Transfer.** The QR scanner flags the wrong location and offers a 1-click transfer to the bottom of the current branch's queue. |
| *"If a citizen is late, sending them to the back of a 3-hour line will cause a riot."* | **Rule 2: Grace Re-Entry.** The citizen takes a 1-person penalty and is slotted directly behind the currently served person. |
| *"What if a complex application takes 45 minutes instead of 10?"* | **Rule 3: 15-Minute Delay Cascade.** The backend shifts all waiting tokens back by 15 mins and sends WhatsApp apologies automatically. |
| *"What if an MLA or Mayor visits suddenly? Your system will break."* | **Feature A3: VIP Override.** Admin issues a Priority 1 token that injects them instantly to the front, bypassing the math engine entirely. |
| *"Rural offices lose Wi-Fi constantly. Your web app is useless there."* | **Feature A5 & NFR1: Total Blackout Protocol.** The PWA Service Worker caches the UI. Staff keeps clicking buttons, data queues in IndexedDB, and auto-syncs to MongoDB when internet returns. |
| *"Why use AI? Just use a form."* | **App Fatigue.** Indian citizens do not want to download another 50MB government app. Gemini allows them to book complex multi-step appointments using messy Hinglish/Marathi via an app they already have (WhatsApp). |

