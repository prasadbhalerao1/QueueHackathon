# QueueOS: System Architecture & Visual Design

This document contains the visual and structural blueprints for the QueueOS platform, utilizing Mermaid.js for flowcharts and Markdown-based wireframe specifications.

---

## 1. Detailed Flow Architecture Diagram
```mermaid
graph TD
    subgraph "Client Layer"
        Citizen["Citizen WhatsApp"]
        PWA["React PWA / Tracker"]
        Staff["Staff/Admin Dashboard"]
    end

    subgraph "API & Logic Layer (FastAPI)"
        Gateway["FastAPI Gateway"]
        Auth["JWT Auth Service"]
        QueueSvc["Queue Management Logic"]
        WhatsAppSvc["WhatsApp Intent Engine"]
    end

    subgraph "External Services"
        Gemini["Google Gemini 2.5 Flash - NLP"]
        Twilio["WhatsApp Business API"]
    end

    subgraph "Data Layer"
        DB[("MongoDB - Beanie ODM")]
    end

    %% Interactions
    Citizen <-->|Webhooks| Twilio
    Twilio <-->|Requests/Events| WhatsAppSvc
    WhatsAppSvc <-->|Classification| Gemini
    WhatsAppSvc --> QueueSvc
    
    PWA <-->|REST API| Gateway
    Staff <-->|REST API| Gateway
    
    Gateway --> Auth
    Gateway --> QueueSvc
    QueueSvc <--> DB
    Auth <--> DB
```

---

## 2. Process Flow Diagram: Citizen Journey
```mermaid
sequenceDiagram
    participant C as Citizen
    participant W as WhatsApp Bot
    participant B as Backend
    participant T as React Tracker
    participant S as Staff

    C->>W: Send "Hi"
    W->>B: Identify User
    B->>W: Request Intent
    C->>W: "Book Aadhaar Update"
    W->>B: Create Token (Safe Numbering)
    B-->>W: Return Token Number & Link
    W-->>C: Confirmation + Tracking URL
    
    Note over C, T: Citizen arrives at office
    S->>B: Mark Arrived
    B-->>T: UI Update: "You are here!"
    S->>B: Call Token
    S->>B: Start / Complete Service
    B-->>W: Feedback Request Prompt
```

---

## 3. Use-Case Diagram
```mermaid
graph TD
    Citizen((Citizen))
    Staff((Staff))
    Admin((Admin))
    
    subgraph "QueueOS System"
        UC1(WhatsApp Booking)
        UC2(Real-time Tracking)
        UC10(Mark Arrived)
        UC3(Cancel Token)
        UC4(Call Next Citizen)
        UC5(Walk-in Registration)
        UC6(Undo Action)
        UC7(Toggle Rush Protocol)
        UC8(Modify Capacity)
        UC9(VIP Override)
    end

    Citizen --- UC1
    Citizen --- UC2
    Citizen --- UC3
    
    Staff --- UC4
    Staff --- UC10
    Staff --- UC5
    Staff --- UC6
    
    Admin --- UC7
    Admin --- UC8
    Admin --- UC9
```

---

## 4. Architecture Diagram (Cloud Infrastructure)
```mermaid
graph LR
    subgraph "AWS Cloud / GCP"
        LB["Load Balancer - Nginx"]
        
        subgraph "Auto-Scaling Group"
            App1["FastAPI Instance 1"]
            App2["FastAPI Instance 2"]
        end
        
        Cache[("Redis - Cache/Session")]
        
        subgraph "Managed Data Store"
            Mongo[("MongoDB Atlas Cluster")]
        end
        
        S3["S3 - Static Frontend Hosting"]
        CDN["CloudFront CDN"]
    end

    LB --> App1
    LB --> App2
    App1 & App2 --> Cache
    App1 & App2 --> Mongo
    CDN --> S3
```

---

## 5. Wireframes / Mock Diagrams

### Screen 1: Citizen Tracker (PWA)
| Component | Type | Functionality |
| :--- | :--- | :--- |
| **Top Bar** | Header | Displays Branch Name and "Live Status" badge. |
| **Token Number** | Large Text | Huge display of `A-105` for physical counter matching. |
| **Status Chip** | Badge | Dynamic colors: Blue (Waiting), Green (Called), Orange (Late). |
| **Progress Bar** | Visual | Shows % of queue cleared before this token. |
| **ETA Display** | Metric | "Estimated Wait: 15 Minutes" |
| **Hold Spot** | Button | Triggers "Delay/Running Late" logic (+15 mins). |
| **Feedback** | Rating | 5-star rating (Visible only after Completion). |

### Screen 2: Staff Operational Command
```text
+-------------------------------------------------------------+
| [ Branch: Mumbai Central ] [ Desk: 04 ]      [ LOGOUT ]     |
+-------------------------------------------------------------+
|  [ SEARCH TOKEN... ]          [ WALK-IN + ]   [ CALL NEXT ] |
+-------------------------------------------------------------+
|  CURRENTLY SERVING            |  WAITING QUEUE (12)         |
|  +-------------------------+  |  +-----------------------+  |
|  | Token: A-101            |  |  | Token: A-102          |  |
|  | User: John Doe          |  |  | [ CALL ] [ TRANSFER ] |  |
|  | [ START ] [ COMPLETE ]  |  |  +-----------------------+  |
|  | [ NO-SHOW ]             |  |  | Token: A-103          |  |
|  +-------------------------+  |  | [ CALL ] [ TRANSFER ] |  |
+-------------------------------------------------------------+
|  [ UNDO LAST ACTION (4:20s left) ]                          |
+-------------------------------------------------------------+
```

### Screen 3: Admin Overdrive Panel
| Section | Component | Purpose |
| :--- | :--- | :--- |
| **KPI Strip** | 4 Cards | Tokens Today, Avg. Wait, No-Show %, Active Desks. |
| **Rush Mode** | Toggle Switch | Triggers block on walk-ins and broadcasts warnings. |
| **Capacity** | Input/Slider | Sets `active_desks` (1-10) for the branch. |
| **VIP Override**| Action Button | Injects a Priority-1 token immediately. |
| **Reset Queue** | Danger Button | Emergency clear of all active branch data. |
| **Analytics** | Line Graph | Hourly traffic vs. Service time efficiency. |
