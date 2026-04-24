# Software Requirements Specification (SRS) - QueueOS

## 1. Introduction

### 1.1 Purpose
The purpose of this document is to provide a detailed description of the software requirements for QueueOS. QueueOS is a smart queue management infrastructure designed for Indian public sector offices (Citizen Facilitation Centers, RTOs, etc.) to reduce physical waiting times and improve operational efficiency.

### 1.2 Product Scope
QueueOS eliminates physical lines by providing a digital-first, multilingual platform. It integrates WhatsApp for booking, a mobile-first PWA for citizen tracking, and a comprehensive dashboard for staff and administrators.

---

## 2. Overall Description

### 2.1 Product Perspective
QueueOS is a standalone SaaS platform designed for a micro-pilot under the Indian GeM Startup Runway program. It replaces legacy physical ticket dispensers with a cloud-based, zero-hardware solution.

### 2.2 User Classes and Characteristics
*   **Citizen**: End users seeking government services. Expect low friction, native language support, and real-time updates.
*   **Staff/Operator**: Government employees managing the counters. Require efficient, one-click controls and clear queue visibility.
*   **Admin/Manager**: Decision-makers overseeing branch performance and handling emergencies.

---

## 3. Functional Requirements

### 3.1 Citizen Module
*   **Conversational Booking**: Message "Hi" on WhatsApp to book slots via Gemini AI intent parsing.
*   **Web Portal Booking**: 4-step wizard for service selection and appointment scheduling.
*   **Live Tracking**: PWA dashboard showing "People Ahead" and estimated wait time (ETA).
*   **Smart Delay**: "Running Late" feature to hold a spot without losing the token.
*   **AI Document Assistant**: Gemini-powered chat widget to provide document requirements in English and Marathi.
*   **Multilingual Support**: Instant toggle between English and Marathi (Devanagari) globally.

### 3.2 Staff/Officer Module
*   **Queue Orchestration**: Control flow from `Waiting` -> `Called` -> `In Progress` -> `Completed`.
*   **Walk-in Registration**: Manual entry for citizens without smartphones/WhatsApp.
*   **Grace Re-entry**: Capability to re-admit no-show citizens with a configurable penalty (e.g., 1-person delay).
*   **Branch Transfer**: One-click transfer of tokens between branches.
*   **Undo Mechanism**: 5-minute window to revert accidental status changes.
*   **Offline Resilience**: Ability to perform actions during internet drops, syncing to the server once restored.

### 3.3 Admin Module
*   **Real-time Analytics**: Dashboard for branch load, efficiency, and no-show rates.
*   **Rush Protocol**: Emergency mode to disable new walk-ins and alert existing bookings.
*   **Capacity Management**: Dynamic adjustment of active desks.
*   **VIP Override**: Priority injection of tokens for emergency cases.
*   **Emergency Reset**: Global clearing of active tokens for branch-wide resets.

---

## 4. System Logic & Business Rules

### 4.1 Queue Logic
*   **Anti-Spam**: Maximum 2 active/pending tokens per phone number.
*   **10-Minute Auto-Skip**: If a `CALLED` token is not started within 10 minutes, it is marked as `NO_SHOW`.
*   **15-Minute Delay Cascade**: If a service exceeds its base duration by 15 minutes, subsequent ETAs are automatically adjusted, and WhatsApp alerts are triggered.

### 4.2 Database Schema (Core Models)
*   **User**: Phone (Unique), Name, Language Pref, Role.
*   **Branch**: Name, Location (Lat/Lng), Active Desks, Total Desks, Rush Mode Status.
*   **Service**: Name, Base Duration, Priority, Required Documents List.
*   **Token**: Token Number, User/Branch/Service Links, Status, Expected/Actual Time, Notes.

---

## 5. Non-Functional Requirements

### 5.1 Performance
*   Real-time status updates via 3-second short polling.
*   FastAPI backend for high-concurrency async request handling.

### 5.2 Accessibility
*   **WCAG 2.0 AA Standards**: Minimum 4.5:1 contrast ratio, large touch targets (44x44px), and semantic HTML.
*   **GIGW 3.0 Compliance**: Designed for Indian government digital standards.

### 5.3 Reliability
*   Serverless architecture on Vercel for high availability.
*   MongoDB Atlas for persistent, globally distributed data.

### 5.4 Localization
*   Full support for Devanagari script (Marathi) as a primary language option.

---

## 6. Technical Stack
*   **Frontend**: React 19, Vite, TypeScript, Material UI v6.
*   **Backend**: Python 3.10+, FastAPI.
*   **Database**: MongoDB Atlas (Beanie ODM).
*   **AI/ML**: Google Gemini 2.5 Flash, Scikit-learn.
*   **Infrastructure**: Vercel (Serverless), Twilio WhatsApp API.
