# **QueueOS: Master Technical Implementation Plan**

This document defines the exact technical implementation, logic flows, dependencies, and architectural patterns required to build QueueOS in a 24-48 hour hackathon. It strictly adheres to the Domain-Driven Design (DDD) constraints and serverless limitations defined in the master blueprint.

## **1\. Complete Dependency Matrix**

### **1.1 Backend Dependencies (Python 3.10+)**

* **Core Framework:** fastapi (Routing), uvicorn\[standard\] (ASGI Server).  
* **Database:** motor (Async MongoDB Driver), beanie (Async ODM \+ Pydantic validation).  
* **Environment & Config:** pydantic-settings, python-dotenv.  
* **AI & Messaging:** google-genai (Vertex AI / Gemini 1.5 Flash), twilio (WhatsApp Sandbox).  
* **Utilities:** pytz (Timezone handling), httpx (Async HTTP requests for external APIs like Google Maps).

### **1.2 Frontend Dependencies (React 18 \+ Vite \+ TS)**

* **Core Framework:** react, react-dom, react-router-dom.  
* **State & Data Fetching:** @tanstack/react-query (v5), axios.  
* **UI & Accessibility (WCAG AA):** @mui/material, @emotion/react, @emotion/styled, @mui/icons-material.  
* **Offline-First & PWA:** workbox-window (Service Worker registration), idb-keyval (Lightweight IndexedDB wrapper for offline mutation caching).  
* **Data Visualization (Admin):** echarts-for-react, echarts.

## **2\. Directory Structure (Domain-Driven Design)**

queueos-monorepo/  
├── backend/  
│   ├── src/  
│   │   ├── common/  
│   │   │   ├── config.py         \# Pydantic BaseSettings (Env vars)  
│   │   │   ├── database.py       \# AsyncIOMotorClient & Beanie init  
│   │   │   ├── exceptions.py     \# Global Exception Handler (JSend format)  
│   │   │   ├── enums.py          \# QueueStatus, UserRole  
│   │   │   └── utils.py          \# Timezone helpers, JSend formatters  
│   │   ├── modules/  
│   │   │   ├── queue/  
│   │   │   │   ├── queue.model.py      \# Token, Branch, Service schemas  
│   │   │   │   ├── queue.schema.py     \# Pydantic request/response models  
│   │   │   │   ├── queue.service.py    \# Math engine, Cascade rules  
│   │   │   │   ├── queue.controller.py \# HTTP response packaging  
│   │   │   │   └── queue.routes.py     \# APIRouter definitions  
│   │   │   ├── whatsapp/  
│   │   │   │   ├── whatsapp.schema.py  \# Twilio form data & Gemini JSON schema  
│   │   │   │   ├── whatsapp.service.py \# OCR parsing, NLP logic  
│   │   │   │   └── whatsapp.routes.py  \# Webhook POST route  
│   │   │   └── admin/  
│   │   │       └── admin.routes.py     \# KPI Aggregation pipelines  
│   │   └── main.py               \# FastAPI init, CORS, lifespan, router inclusion  
│   ├── requirements.txt  
│   └── vercel.json               \# Vercel Serverless config  
├── frontend/  
│   ├── src/  
│   │   ├── common/  
│   │   │   ├── api.ts            \# Axios instance with baseURL  
│   │   │   ├── theme.ts          \# MUI High-Contrast Theme (WCAG AA)  
│   │   │   └── utils/  
│   │   │       └── offlineSync.ts\# idb-keyval logic for caching mutations  
│   │   ├── modules/  
│   │   │   ├── queue/  
│   │   │   │   ├── hooks/  
│   │   │   │   │   └── useQueue.ts     \# TanStack Polling & Optimistic Updates  
│   │   │   │   ├── components/  
│   │   │   │   │   ├── StaffDashboard.tsx  
│   │   │   │   │   └── TokenCard.tsx  
│   │   │   │   └── types.ts            \# Strict TS interfaces mirroring Pydantic  
│   │   │   └── admin/  
│   │   │       ├── components/  
│   │   │       └── hooks/  
│   │   ├── App.tsx  
│   │   └── main.tsx  
│   ├── public/  
│   │   └── sw.js                 \# Service Worker for PWA shell caching  
│   ├── vite.config.ts  
│   └── package.json

## **3\. Backend Logic Flows (Controllers & Services)**

### **3.1 The Math Engine: queue.service.py**

This is the core rule engine.

**Function: advance\_token(token\_id, new\_status, background\_tasks)**

* **Step 1:** Fetch Token by ID. If None, raise 404 Exception.  
* **Step 2 (State Machine Check):** Validate if the transition is allowed (e.g., cannot go from COMPLETED back to WAITING).  
* **Step 3 (Grace Re-entry Logic):**  
  * *If* current status \== NO\_SHOW *and* new\_status \== WAITING:  
  * Query DB for the token in IN\_PROGRESS or CALLED at the same branch.  
  * If found, set this token's expected\_service\_time \= found\_token.expected\_service\_time \+ timedelta(minutes=1).  
  * This forces the token to the front of the line (1-person penalty) without skipping the active user.  
* **Step 4 (15-Minute Cascade Logic):**  
  * *If* new\_status \== COMPLETED:  
  * Set actual\_end\_time \= datetime.utcnow().  
  * Calculate duration \= actual\_end\_time \- actual\_start\_time.  
  * *If* duration.total\_seconds() / 60 \> (token.service.base\_duration\_minutes \+ 15):  
    * Trigger FastAPI BackgroundTasks.  
    * **Background Task:** Run Token.find({branch: token.branch, status: "WAITING"}).update({"$inc": {"expected\_service\_time": 15 \* 60 \* 1000}}). *(Shift all waiting times up by 15 mins)*.  
    * Iterate through affected users and trigger async Twilio messages.  
* **Step 5:** Call await token.save() and return JSend success format.

### **3.2 The AI Layer: whatsapp.service.py**

**Function: process\_incoming\_whatsapp(sender\_phone, message\_body)**

* **Step 1 (Anti-Spam):** Run User.find({"phone": sender\_phone}).count(). If User has \>= 2 tokens with status In(BOOKED, ARRIVED, WAITING), immediately return TwiML \<Response\>\<Message\>Rate limit exceeded.\</Message\>\</Response\>.  
* **Step 2 (Gemini NLP):**  
  * Initialize google-genai client.  
  * Pass the incoming text to Gemini 1.5 Flash.  
  * **CRITICAL:** Pass a Pydantic response\_schema to the generate\_content config:  
    class GeminiResponse(BaseModel):  
        intent: str \# 'BOOKING', 'STATUS', 'HELP'  
        service\_name: Optional\[str\]  
        language: str \# 'en', 'hi', 'mr'

  * This forces Gemini to return strict, parsable JSON. No regex needed.  
* **Step 3 (Wait Time Calculation):**  
  * If intent \== 'BOOKING', query the last WAITING token for the requested Service/Branch.  
  * Set expected\_service\_time \= last\_token.expected\_service\_time \+ timedelta(minutes=service.base\_duration\_minutes).  
* **Step 4 (Wallet Generation):** Call Google Wallet API to generate a Generic Pass JWT link.  
* **Step 5 (Response):** Create Token in DB. Return formatted TwiML containing the token number, wait time, and Wallet link.

### **3.3 The Admin Aggregation: admin.routes.py**

* Use MongoDB Aggregation Pipelines (via Motor native access since Beanie aggregation is limited) to calculate:  
  * Average Wait Time: $avg difference between actual\_start\_time and created\_at.  
  * No-Show Rate: Count of NO\_SHOW divided by Total Tokens.

## **4\. Frontend Logic Flows (React & TanStack)**

### **4.1 Serverless Real-time (TanStack Polling)**

* **File: useQueue.ts**  
* **Implementation:**  
  export const useLiveQueue \= (branchId: string) \=\> {  
    return useQuery({  
      queryKey: \['queue', branchId\],  
      queryFn: () \=\> api.get(\`/api/queue/${branchId}\`).then(res \=\> res.data.data),  
      refetchInterval: 3000, // The Serverless WebSocket Alternative  
      staleTime: 2000,  
    });  
  };

### **4.2 Offline-First Optimistic Updates & IndexedDB**

* **Scenario:** Staff clicks "Call Next", but Wi-Fi drops.  
* **Implementation (useAdvanceToken hook):**  
  1. onMutate: Fires immediately when button is clicked.  
  2. Check navigator.onLine. If offline, save the mutation payload (tokenId, newStatus) to IndexedDB using idb-keyval.  
  3. Cancel outgoing refetches: queryClient.cancelQueries({ queryKey: \['queue'\] }).  
  4. Snapshot previous state: queryClient.getQueryData(\['queue'\]).  
  5. Optimistically update the cache: Find the token in the array and forcefully change its status to CALLED. Return { previousQueue }.  
  6. onError: If the API fails when online, rollback to previousQueue.  
  7. onSettled: Always trigger an invalidation to sync with the server once settled.

### **4.3 Background Sync (Service Worker)**

* When the browser detects window.addEventListener('online'), a utility function loops through the IndexedDB mutationQueue.  
* It sequentially fires axios.patch for each cached token status change.  
* Upon success, it clears the IndexedDB queue and triggers a TanStack invalidation.

### **4.4 WCAG AA Implementation Specs**

* **Color Contrast:** MUI Theme configured with primary: \#1976d2 and background: \#ffffff (4.5:1 ratio verified).  
* **Semantic Alerts:**  
  \<section aria-live="polite" aria-atomic="true"\>  
     {/\* React maps over the queue here. When a token changes, screen readers announce it instantly. \*/}  
  \</section\>

* **Touch Targets:** All MUI \<Button\> components override sx={{ minHeight: '44px', minWidth: '44px' }}.

## **5\. Deployment Specs (Vercel)**

### **5.1 Backend vercel.json**

{  
  "version": 2,  
  "builds": \[  
    {  
      "src": "src/main.py",  
      "use": "@vercel/python"  
    }  
  \],  
  "routes": \[  
    {  
      "src": "/api/(.\*)",  
      "dest": "src/main.py"  
    }  
  \]  
}

### **5.2 Environment Variables (Vercel Dashboard)**

**Backend:**

* MONGODB\_URI  
* GEMINI\_API\_KEY  
* TWILIO\_ACCOUNT\_SID  
* TWILIO\_AUTH\_TOKEN

**Frontend:**

* VITE\_API\_BASE\_URL (Points to the deployed Vercel backend URL, e.g., https://queueos-api.vercel.app)

## **6\. Execution Priority for the Hackathon**

1. **Hours 1-4:** Stand up the FastAPI shell, wire Beanie to MongoDB, verify CRUD on the Token schema.  
2. **Hours 4-8:** Write the queue.service.py math engine (Grace Re-entry & Delay Cascade). Test extensively using Postman.  
3. **Hours 8-12:** Build the whatsapp.service.py webhook. Test Gemini JSON parsing with actual Twilio WhatsApp messages.  
4. **Hours 12-18:** Stand up the React Vite app. Implement the TanStack Query polling list and the optimistic UI buttons.  
5. **Hours 18-22:** Implement IndexedDB offline caching and WCAG accessibility tags.  
6. **Hours 22-24:** Deploy to Vercel, test end-to-end, and prepare the demo pitch.