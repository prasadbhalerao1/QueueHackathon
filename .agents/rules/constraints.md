---
trigger: always_on
---

# **QUEUEOS MASTER ENGINEERING CONSTRAINTS**

This document defines the absolute, non-negotiable engineering standards for the QueueOS project. The AI assistant MUST adhere to these rules before, during, and after generating any code.

## **1\. FULLSTACK CONSISTENCY RULE**

Frontend and backend must stay fully synchronized at all times. The app should behave like one system, not two separate projects pretending to connect.

* Any change in backend models, API contracts, validation, enums, auth flow, field names, or business logic MUST immediately reflect in the frontend.  
* Any frontend form, table, filter, state model, or UI expectation MUST match backend behavior exactly.

### **REQUIRED SYNC AREAS**

* **Data Models:** Database schema ↔ Backend schemas/Pydantic models ↔ Frontend TypeScript interfaces/types.  
* **Naming:** Keep the same field names everywhere. NO mixing camelCase, snake\_case, or PascalCase without an explicit transformer.  
* **Validation:** Required fields, min/max lengths, enum values, regex rules, and nullable fields must match on both sides.  
* **API Contracts:** Request body shape, query params, route params, response formats, error formats, and pagination structures must be perfectly aligned.  
* **Authentication:** Token flows, session logic, protected routes, and role permissions must mirror each other.  
* **Business Logic:** If the backend calculates status, totals, queue position, or priority, the frontend must display using the exact same logic and assumptions.

### **CHANGE MANAGEMENT (THE DOMINO EFFECT)**

Whenever modifying one layer, automatically inspect and update all impacted layers:

* **If backend changes:** update frontend types \-\> update forms \-\> update API calls \-\> update UI rendering \-\> update validation \-\> update tests.  
* **If frontend needs a new field:** update backend schema \-\> update DB \-\> update endpoint logic \-\> update response types.

### **🚫 NEVER ALLOW THESE:**

* Backend returns fields the frontend does not know.  
* Frontend expects fields the backend does not send.  
* Enum mismatches.  
* Date format or Number/String type mismatches.  
* Required field mismatches.  
* Silent fallback values hiding bugs.  
* Different permission logic between frontend and backend.

## **2\. STRICT API & ERROR DISCIPLINE**

* **Standard Response Format:** Use JSend style for ALL APIs (success, fail, error).  
* **Type Synchronization:** Python and React types must match exactly.  
* **NO SILENT FAILURES:** All errors must be logged and returned properly. No empty except: pass blocks are allowed under any circumstances.  
* **Real Libraries Only:** Use only real, documented APIs and packages. Never hallucinate functions or library names.

## **3\. BACKEND CONSTRAINTS (FASTAPI)**

* **Modular Architecture:** Use Domain-Driven Design (modules/ and common/ folders). Each module MUST contain model.py, schema.py, service.py, controller.py, and routes.py.  
* **Async Only:** Use async/await correctly. Absolutely NO blocking DB operations.  
* **Stateless Routes:** All API routes must remain stateless. The MongoDB database is the absolute source of truth.  
* **Database Safety:** Prefer additive migrations. Avoid destructive changes to collections.  
* **Indexing Rule:** Index common query fields (e.g., phone numbers, token statuses).  
* **Transaction Awareness:** Use transactions for multi-step critical operations (e.g., booking a token while updating a user record).  
* **Validation First:** Validate body, params, and query values *before* executing business logic.  
* **Security:** No hardcoded secrets. Rely strictly on environment (.env) config.

## **4\. FRONTEND CONSTRAINTS (REACT)**

* **Modular Architecture:** Use feature modules containing api, hooks, types, components, and pages.  
* **TanStack Query Only:** Use TanStack Query exclusively for server state. Avoid random fetch or axios calls directly inside UI components.  
* **Loading States Required:** Every async UI element MUST handle loading, success, empty, error, and retry states.  
* **Accessibility Required:** Must strictly meet WCAG AA standards (keyboard support, ARIA labels, focus states, 4.5:1 contrast, 44x44px touch targets).  
* **Responsive First:** Must function flawlessly on mobile, tablet, desktop, and low-width kiosks.  
* **No Duplicate State:** Avoid copying server state into local React state (useState) unnecessarily.  
* **Form Discipline:** Forms require frontend validation, disabled submit buttons while pending, and highly visible error states.

## **5\. OFFLINE-FIRST CONSTRAINTS**

* **Network Failure Resilience:** The offline shell must remain usable. Queue actions locally and auto-sync when online.  
* **IndexedDB Mutations:** Critical actions MUST queue offline: Call Next, Start, Complete, No Show, Transfer.  
* **Conflict Strategy:** If a stale update is detected when syncing, refetch the latest state and retry safely.

## **6\. QUEUEOS DOMAIN RULES**

* **Token State Machine:** Allow ONLY valid status transitions (e.g., WAITING \-\> CALLED) unless an admin override is explicitly triggered.  
* **Business Rules Must Be Enforced:** Implement actual logic for:  
  * Max 2 active bookings per phone.  
  * Grace re-entry (Late Arrivals).  
  * No-show flow.  
  * Delay cascade (+15 min shifts).  
  * Wrong branch transfers.  
  * Rush protocols & Desk pause reassignment.  
  * Undo last action window.

## **7\. CODE QUALITY RULES**

* **Clean Code:** No dead code. No unused imports. Use highly descriptive variable names.  
* **Small Functions:** Prefer focused, reusable functions over massive monoliths.  
* **DRY Principle:** Extract repeated logic immediately.  
* **Comments Rule:** Use comments *only* when the business logic or math is non-obvious.

## **8\. AI OUTPUT RULES (THE "DONE" DIRECTIVE)**

* **Think Before Writing:** You must analyze changed files, dependencies, schema impact, and UI impact *before* outputting code.  
* **Never Break Existing Features:** Preserve unrelated working logic. Make the minimal required changes to achieve the goal.  
* **If Unsure:** State your assumption clearly once, then proceed confidently.  
* **Done Means Done:** A task is only complete if the code compiles, imports are valid, types are aligned, the UI works, and all edge cases are explicitly handled.