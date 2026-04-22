# **QueueOS: God-Tier Engineering Prompt Library (DDD Architecture)**

*Instructions for Developer: Keep both AGENT.md and CONSTRAINTS.md open in your AI's context window. Feed it these prompts sequentially. DO NOT move to the next prompt until the current one executes flawlessly, complies with all constraints (including strict WCAG AA accessibility on all frontend code), and has zero console errors.*

## **Phase 1: Foundational Architecture & Database (DDD)**

**Prompt 1: Global Setup & Beanie Models**

"Read AGENT.md and CONSTRAINTS.md. Execute Phase 1\. Build the foundational FastAPI and MongoDB/Beanie architecture using the exact modular structure defined.

**CRITICAL CONSTRAINTS:** ZERO-LAZINESS rule applies. Output entire files with STRICT IMPORTS. No placeholders (TODO, pass).

1. **Common Layer (src/common/):**  
   * config/config.py: Use pydantic-settings (BaseSettings). Define MONGODB\_URI, GEMINI\_API\_KEY, TWILIO\_ACCOUNT\_SID, TWILIO\_AUTH\_TOKEN. No hardcoded secrets.  
   * database/connection.py: Write async init\_db() using motor.motor\_asyncio.AsyncIOMotorClient. Register the Beanie models here.  
   * exceptions/handlers.py: Create a custom QueueOSException with status\_code and detail. Write a global exception handler that returns STRICT JSend formatted JSON ({"status": "error", "message": "..."}). NO SILENT FAILURES.  
   * constants/enums.py: Define QueueStatus and UserRole str, Enum classes.  
2. **Models Layer (src/modules/):**  
   * Create src/modules/users/users.model.py: Implement the User Beanie document. Use Indexed(str, unique=True) for the phone number.  
   * Create src/modules/queue/queue.model.py: Implement Branch, Service, and Token Beanie documents. Use Link for relational references.  
3. **Main App (src/main.py):**  
   * Initialize FastAPI. Add CORSMiddleware (allow origins \["\*"\]).  
   * Add a lifespan context manager calling init\_db().  
   * Register the exception handlers.

**Output:** Print the exact file path before each code block. One file at a time."

## **Phase 2: Core Queue Orchestration Engine**

**Prompt 2: Services, Controllers & Routes (The Math Engine)**

"Read AGENT.md and CONSTRAINTS.md. Execute Phase 2\. Build the REST API for queue management in src/modules/queue/. STATELESS ROUTES only.

1. **queue.schema.py:** Create Pydantic models: TokenResponse, AdvanceTokenRequest. FULLSTACK CONSISTENCY: Ensure names map exactly to future frontend types.  
2. **queue.service.py:** Implement QueueService class.  
   * get\_active\_queue(branch\_id): Use Beanie's .find() with In(Token.status, \[...\]). Sort by expected\_service\_time. Await .to\_list().  
   * advance\_token(token\_id, new\_status, background\_tasks: BackgroundTasks):  
     * Fetch token. Raise QueueOSException(404) if not found.  
     * **Grace Re-entry Rule:** If updating from NO\_SHOW to WAITING, find the token currently IN\_PROGRESS or CALLED and set this token's expected\_service\_time to immediately after theirs.  
     * **15-Minute Cascade Rule:** If updating to COMPLETED and (actual\_end\_time \- actual\_start\_time) \> base\_duration\_minutes \+ 15, use FastAPI BackgroundTasks to trigger a function that loops through all subsequent WAITING tokens and adds 15 minutes (timedelta(minutes=15)) to their expected times.  
     * Update timestamps (actual\_start\_time, actual\_end\_time) based on status. Call await token.save().  
3. **queue.controller.py:** Create QueueController. Inject QueueService. Return JSend format for all success/fail states.  
4. **queue.routes.py:** Define APIRouter. Create GET /{branch\_id} and PATCH /advance/{token\_id}. Map directly to controller methods. Use FastAPI Depends(). Include BackgroundTasks in the PATCH route.  
5. Update src/main.py to app.include\_router().

**CRITICAL:** ALL imports must be explicit. No dead code. Write heavily commented, flawless asynchronous Python code."

## **Phase 3: AI & Communication Layer**

**Prompt 3: Gemini Vertex AI Structured Output & Twilio**

"Read AGENT.md and CONSTRAINTS.md. Execute Phase 3\. Create the webhook module at src/modules/whatsapp/.

1. **whatsapp.schema.py:** Create Pydantic models for incoming Twilio x-www-form-urlencoded data. Create a Pydantic model GeminiIntentSchema with fields service\_name (str) and is\_booking\_intent (bool).  
2. **whatsapp.service.py:**  
   * **Anti-Spam Check:** Query DB. If User has \>= 2 tokens with status BOOKED/WAITING, immediately return a Twilio reject message.  
   * **Gemini NLP:** Use google-genai SDK. Pass GeminiIntentSchema to response\_schema in the generate\_content config to FORCE Gemini to return strict JSON. Do NOT hallucinate APIs.  
   * Depending on JSON result, find matching Service in DB, create Token, and calculate expected\_service\_time based on current queue length.  
   * Return a formatted TwiML XML string containing the Token number and expected wait time.  
3. **whatsapp.controller.py:** Handle the request, catching Gemini SDK errors or Twilio validation errors. NO SILENT FAILURES. Log and return standard error structures.  
4. **whatsapp.routes.py:** Create POST /webhook. Use Request.form() to parse Twilio data.  
5. Update src/main.py to include the router.

**CRITICAL:** Handle API rate limits gracefully. Output complete files without TODO markers."

## **Phase 4: Frontend Infrastructure & PWA Data Layer**

**Prompt 4: React Query v5 Optimistic Updates**

"Read AGENT.md and CONSTRAINTS.md. Execute Phase 4\. Move to the React frontend.

**CRITICAL CONSTRAINTS:** TYPE SYNCHRONIZATION. Your TypeScript types MUST perfectly match the Python Pydantic models from Phase 2\. REAL LIBRARIES ONLY: Use exact TanStack Query v5 syntax.

1. src/common/config/axios.ts: Configure Axios instance.  
2. src/modules/queue/hooks/useQueue.ts:  
   * Write useLiveQueue(branchId): MUST use useQuery with refetchInterval: 3000\. This satisfies our Serverless constraint.  
   * Write useAdvanceToken(): MUST use useMutation.  
   * **Crucial Offline-First Logic (INDEXEDDB MUTATIONS):** Implement onMutate. You MUST snapshot the previous query state (queryClient.getQueryData), optimistically update the cache to the new status immediately, and return { previousQueue }.  
   * Implement onError to rollback the cache using previousQueue. (CONFLICT STRATEGY).  
   * Implement onSettled to trigger an invalidation to ensure sync with the server.

**Output:** Provide complete TypeScript files with explicit imports. No missing dependencies."

## **Phase 5: The Accessible Staff Dashboard**

**Prompt 5: GIGW / WCAG AA Compliant UI**

"Read AGENT.md and CONSTRAINTS.md. Execute Phase 5\. Create src/modules/queue/components/StaffDashboard.tsx.

**CRITICAL CONSTRAINTS:** ACCESSIBILITY REQUIRED. Must strictly meet WCAG 2.0 Level AA standards. LOADING STATES REQUIRED.

1. **UI Constraints:** Use Material UI (MUI). You MUST use semantic HTML \<main\>, \<section\>, and \<article\>. Ensure all text has sufficient contrast (4.5:1 ratio). Ensure 44x44px touch targets. Responsive First.  
2. **Accessibility:** Wrap the live queue list in \<div aria-live='polite' aria-atomic='true'\>. Every action button must have an aria-label describing the exact action. Visible focus states are mandatory.  
3. Consume useLiveQueue. Handle Loading, Error, and Empty states explicitly (use MUI Skeletons). Render a visually distinct list of tokens.  
4. **Dynamic Actions (TOKEN STATE MACHINE):**  
   * If WAITING: Show 'Call Next' (Primary Color).  
   * If CALLED: Show 'Start' (Success Color) and 'Mark No-Show' (Error Color).  
   * If NO\_SHOW: Show 'Mark Late Arrival' (Warning Color) to trigger Grace Re-entry.  
5. Add a global MUI Snackbar showing 'Status Updated' upon successful mutation, hooked into useAdvanceToken's onSuccess.

**Output:** Clean, production-ready React components. No duplicate local state for server data."

## **Phase 6: The Admin VIP Override & Blackout Protocol**

**Prompt 6: Hackathon 'Judge Defense' UI**

"Read AGENT.md and CONSTRAINTS.md. Execute Phase 6\. We are building the Admin Hackathon flex features. THINK BEFORE WRITING: Analyze which backend files need to be updated.

1. **Backend:** Add create\_vip\_token() to queue.service.py and queue.routes.py. It bypasses wait times, assigns Priority Level 1, and sets expected\_service\_time to datetime.utcnow(). Follow JSend rules.  
2. **Frontend:** Create src/modules/admin/components/AdminDashboard.tsx. **Must adhere to WCAG AA guidelines.**  
3. Add an overarching KPI metrics row: 'Active Desks', 'Current Wait', 'Tokens Served'.  
4. Add a high-visibility MUI Button: 'Trigger VIP Override Protocol'.  
5. Add a toggle switch: 'Simulate Total Blackout (Offline Mode)'.  
   * When toggled ON, visually shift the UI to a high-contrast dark mode.  
   * Display a persistent Alert: "Network Offline. Operating from Local Cache."  
   * Use a React useEffect to mock intercepting the useLiveQueue query and pausing the network requests, allowing the user to click buttons that cache via the onMutate logic.

**CRITICAL:** DONE MEANS DONE. The code must compile, imports must be valid, UI must function, and all new Admin UI elements MUST maintain strict WCAG AA accessibility standards. Output the complete, final files."