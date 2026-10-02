<div align="center">

<img src="./public/logo.png" alt="BiteFlow Logo" width="130" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(232, 66, 14, 0.35);" />

# BiteFlow — Modern Hyperlocal Food Delivery Platform
### Enterprise Multi-Role Food Delivery Ecosystem with Live Socket.IO Tracking, Smart Surplus Rescue, and SQLite WAL

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](#)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](#)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?style=for-the-badge&logo=sqlite&logoColor=white)](#)
[![License](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](#)

<p align="center">
  A production-grade hyperlocal food delivery platform inspired by <b>Swiggy</b> and <b>Zomato</b>, featuring <b>4 strictly enforced RBAC roles</b>, real-time bidirectional order dispatching, live GPS waypoint delivery tracking, Indian UPI payment stack, and <b>groundbreaking green innovations</b> for surplus food rescue and group delivery.
</p>

[System Flowcharts](#-system-architecture--flowcharts) • [Implemented Innovations](#-implemented-innovations) • [Tech Stack](#-technology-stack) • [Quick Start](#-quick-start)

---

</div>

## 📊 System Architecture & Flowcharts

### 1. High-Level Ecosystem Architecture
```mermaid
graph TD
    subgraph Clients["🌐 Multi-Role Frontend (React 19 + TypeScript + Vite)"]
        Customer["👤 Customer App<br/>(Browse, Order, Track)"]
        Owner["🍽️ Restaurant Portal<br/>(Menu, Kitchen Queue)"]
        Courier["🛵 Delivery Fleet App<br/>(Waypoints, Wallet)"]
        Admin["🛡️ Super Admin Hub<br/>(Catalog, Approvals, KPIs)"]
    end

    subgraph Server["⚡ Node.js & Express Hyperlocal Backend"]
        AuthMiddleware["🔐 JWT & RBAC Middleware"]
        REST["📡 REST API Controllers"]
        SocketServer["🔄 Socket.IO Live Dispatcher<br/>(order_, user_, role_ rooms)"]
        RescueEngine["♻️ Smart Surplus Engine<br/>(Demand Prediction & Expiry)"]
        GroupRouter["🚚 Group Delivery Engine<br/>(Batching & Privacy Anonymization)"]
    end

    subgraph Data["💾 High-Performance Storage (SQLite WAL Mode)"]
        DB[(database.db<br/>Normalized Relational Schema)]
    end

    Customer -->|HTTP / JSON| AuthMiddleware
    Owner -->|HTTP / JSON| AuthMiddleware
    Courier -->|HTTP / JSON| AuthMiddleware
    Admin -->|HTTP / JSON| AuthMiddleware

    AuthMiddleware --> REST
    REST --> RescueEngine
    REST --> GroupRouter
    REST --> DB

    Customer <-->|WebSocket Events| SocketServer
    Owner <-->|WebSocket Events| SocketServer
    Courier <-->|WebSocket Events| SocketServer
    Admin <-->|WebSocket Events| SocketServer
    SocketServer <--> DB
```

---

### 2. Complete Order Lifecycle & Real-Time State Machine
```mermaid
sequenceDiagram
    autonumber
    actor C as 👤 Customer
    actor R as 🍽️ Restaurant Owner
    actor D as 🛵 Delivery Partner
    participant S as ⚡ BiteFlow Server
    participant W as 🔄 Socket.IO Dispatcher

    C->>S: Places Order (UPI / Card / COD)
    S-->>W: Broadcasts 'order_status_update' (PLACED)
    W-->>R: Sound & Visual Alert in Kitchen Queue
    
    alt Order Accepted
        R->>S: Accept Order
        S-->>W: Broadcasts 'CONFIRMED'
        W-->>C: Customer Tracker: Kitchen Confirmed Order
        
        R->>S: Start Preparing
        S-->>W: Broadcasts 'PREPARING'
        
        R->>S: Mark Ready for Pickup
        S-->>W: Broadcasts 'READY_FOR_PICKUP'
        W-->>D: Pops in Delivery Partner Available Pool
        
        D->>S: Accept Delivery
        S-->>W: Broadcasts 'DELIVERY_ASSIGNED'
        
        D->>S: Heading to Restaurant
        S-->>W: Status -> 'GOING_TO_RESTAURANT'
        
        D->>S: Arrived at Restaurant
        S-->>W: Status -> 'ARRIVED_AT_RESTAURANT'
        
        D->>S: Picked Up Package
        S-->>W: Status -> 'FOOD_PICKED_UP'
        
        D->>S: Out for Delivery (GPS Route Live)
        S-->>W: Status -> 'OUT_FOR_DELIVERY'
        
        D->>S: Arrived at Customer Doorstep
        S-->>W: Status -> 'ARRIVED_AT_CUSTOMER'
        
        D->>S: Mark Delivered
        S-->>W: Status -> 'DELIVERED'
        S->>D: Credits Rider Wallet (+₹45)
        S->>C: Unlocks Rating & 5-Star Review Form
    else Order Rejected
        R->>S: Reject Order (with reason)
        S-->>W: Broadcasts 'CANCELLED_BY_RESTAURANT'
        W-->>C: Instant notification & refund trigger
    end
```

---

### 3. Smart Surplus Rescue Architecture
```mermaid
flowchart LR
    A[Kitchen Shift Preparation] --> B[Transparent Surplus Prediction Model]
    B --> C{Anticipated Surplus Meals?}
    C -- Yes --> D[Auto-Generate Rescue Listing<br/>40% - 55% Off]
    C -- No --> E[Standard Menu Display]
    D --> F[Published to Rescue Hub<br/>with Active Countdown]
    F --> G[Customer Claims Rescue Meal]
    G --> H[Meal Diverted from Waste 🌱]
    H --> I[Eco Impact Metrics Updated]
```

---

### 4. Neighbourhood Group Delivery & Privacy Route Batching
```mermaid
flowchart TD
    A[Customer Initiates Checkout] --> B{Nearby Active Group Order Available?}
    B -- Yes --> C[Join Delivery Group<br/>₹0 Delivery Fee Guaranteed]
    B -- No --> D[Create New 30-min Window Group]
    C --> E[Sequential Multi-Stop Routing]
    D --> E
    E --> F[Privacy Protection Shield]
    F --> G[Neighbour names & full addresses masked<br/>'Nearby Neighbour · Stop 1']
    G --> H[Single Courier Collects All Orders]
    H --> I[Combined Trip Minimizes City CO2 Emissions 🛵]
```

---

### 5. Multi-Restaurant Food Assignment Flow (Max 10 Restaurants)
```mermaid
flowchart TD
    A[Super Admin Dashboard] --> B[Food Catalog Management]
    B --> C[Create or Assign Dish]
    C --> D[Select Target Restaurants from Grid]
    D --> E{Selection Count <= 10?}
    E -- More than 10 --> F[Blocked: Hard Limit of Max 10 Enforced]
    E -- 1 to 10 --> G[Server slices array to max 10]
    G --> H[Dish distributed across up to 10 partner kitchens]
    H --> I[Verified in Catalog with Solid Black Font Indicator]
```

---

## 💡 Implemented Innovations

- ♻️ **Smart Surplus Rescue**: Dynamic discounted meals (**up to 50% off**) from restaurants approaching shift close to prevent kitchen food waste.
- 🚚 **Neighbourhood Group Delivery**: Batches nearby neighbour orders in 30-minute windows for **₹0 delivery fee** with sequential delivery stops and strict customer privacy anonymization.
- 🌱 **Your Delivery Impact**: Live environmental dashboard calculating rescued meals, combined courier trips, and diverted food waste metrics.
- ⚙️ **Restaurant Surplus & Operations Hub**: Kitchen staff demand forecast table, 1-click rescue listing creator, and group route dispatching controls.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, TypeScript, Vite 8, Swiggy/Zomato-inspired Vanilla CSS Design System
- **Backend**: Node.js, Express.js, Socket.IO v4 (Live Order Dispatching & Room Events)
- **Database**: SQLite 3 with WAL Mode (Sub-millisecond queries, Normalized Relational Schema)
- **Security**: JWT Authentication, Role-Based Access Control (RBAC), and Restaurant Ownership Barriers

---

## 💻 Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/SanthoshkumarS2407/BiteFlow-Food-Delivery.git
cd BiteFlow-Food-Delivery

# Install dependencies
npm install
```

### 2. Run Application
```bash
# Run Full Stack (Express API on :5000 + Vite Frontend on :3000)
npm run dev
```

### 3. Open in Browser
- **Frontend App**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5000](http://localhost:5000)

---

## 📂 Project Directory Structure

```
BiteFlow-Food-Delivery/
├── .env                       # Local environment variables
├── .env.example               # Template environment configuration
├── .gitignore                 # Excluded directories, temporary files & SQLite journals
├── database.db                # SQLite database with 15+ restaurants, 300+ dishes, and demo groups
├── index.html                 # Main entry point with title: 'BiteFlow — Food Delivery'
├── package.json               # Project manifest, dependencies, and NPM scripts
├── package-lock.json          # Dependency lockfile
├── seed_indian_data.js        # Comprehensive multi-restaurant and menu seeder
├── server.js                  # Express backend with Socket.IO, RBAC, and SQLite WAL engine
├── server_features.js         # Surplus rescue engine, group route batching, and analytics
├── test_e2e_lifecycle.js      # E2E lifecycle and role security test suite
├── tsconfig.json              # TypeScript root configuration
├── tsconfig.node.json         # Node-specific TypeScript config
├── vite.config.ts             # Vite bundler configuration with backend proxy
├── public/                    # Static public assets (logo, favicon)
└── src/                       # Frontend source application
    ├── App.tsx                # Page router and modal coordinator
    ├── index.css              # Design system tokens, utilities, and components
    ├── main.tsx               # React 19 entry point
    ├── types.ts               # TypeScript interfaces and type contracts
    ├── components/            # Reusable UI components (Navbar, Modals, Cards, Tabs)
    ├── contexts/              # Global state management (AppContext, ToastContext)
    ├── data/                  # Static fallback catalog data
    └── pages/                 # Full-screen page views (Home, Admin, RescueHub, etc.)
```

---

## 📄 License
This project is open-source under the **MIT License**.

© 2026 **BiteFlow Technologies**. All rights reserved.
