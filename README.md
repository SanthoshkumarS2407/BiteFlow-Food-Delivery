<div align="center">

<img src="./public/logo.png" alt="BiteFlow Logo" width="130" style="border-radius: 24px; box-shadow: 0 8px 32px rgba(232, 66, 14, 0.35);" />

# BiteFlow — Real-World Multi-Role Food Delivery Platform
### Enterprise Hyperlocal Platform with Role-Based Access Control (RBAC), Live Socket.IO Tracking & High-Performance SQLite WAL

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=nodedotjs&logoColor=white)](#)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](#)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)](#)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-v4-010101?logo=socketdotio&logoColor=white)](#)
[![SQLite WAL](https://img.shields.io/badge/SQLite-WAL%20Mode-003B57?logo=sqlite&logoColor=white)](#)
[![Security](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-green)](#)

<p align="center">
  A complete, production-grade Indian food delivery ecosystem engineered to mirror industry leaders <b>Swiggy</b> and <b>Zomato</b> with four strictly enforced user roles, end-to-end order dispatching, live GPS route tracking, Indian UPI payment stack, and restaurant ownership validation.
</p>

[Quick Start](#-quick-start) • [The 4 User Roles](#-the-4-user-roles) • [Demo Credentials](#-demo-accounts--one-click-logins) • [Order Lifecycle Flow](#-complete-order-lifecycle) • [Security & Authorization](#-security--role-based-authorization) • [API Reference](#-api-endpoints)

---

</div>

## 🌟 Architecture & Core Capabilities

BiteFlow is built as a real-world multi-role food delivery platform with zero AI placeholders or non-functional screens:

```text
                                     ┌───────────────┐
                                     │   CUSTOMER    │
                                     │  (Browse/Pay) │
                                     └───────┬───────┘
                                             │ Places Order
                                             ▼
┌──────────────┐    Approves         ┌───────────────┐   Prepares Food   ┌────────────────────┐
│    ADMIN     │ ──────────────────> │  RESTAURANT   │ ────────────────> │  DELIVERY PARTNER  │
│ (Supervises) │     Restaurant      │  (Accept/Cook)│    Ready Pickup   │ (Pickup & Deliver) │
└──────────────┘                     └───────────────┘                   └─────────┬──────────┘
       ▲                                                                           │
       │                                                                           ▼
       └──────────────────────── Order Completed & Reviewed ◄──────────────────────┘
```

1. **4 Distinct User Roles**:
   - `CUSTOMER`: Browse restaurants, search dishes, smart combos, health-aware filters, place orders, track live on map, reorder, rate & review.
   - `RESTAURANT_OWNER`: Dedicated owner portal (`/owner-dashboard`), restaurant onboarding (`PENDING_APPROVAL`), categories manager, full nutritional menu editor, kitchen open/close toggle, and live incoming order queue (Accept / Reject with reason / Prepare / Mark Ready).
   - `DELIVERY_PARTNER`: Dedicated courier portal (`/delivery-dashboard`), Online/Offline toggle, available orders queue, trip route map, step-by-step waypoint progression, wallet earnings (₹45/trip), and delivery history.
   - `ADMIN`: Platform operations hub (`/admin`), real-time KPI metrics, 1-click restaurant approvals, user account suspension controls, global catalog supervision.

2. **Real-Time Live Event Dispatcher**:
   - Built on **Socket.IO** rooms (`order_{id}`, `user_{id}`, `restaurant_{id}`, `role_{ROLE}`) with automatic 3-second polling fallback.
   - Instant bi-directional state synchronization when an owner accepts/prepares or a rider progresses along route waypoints.

3. **High-Performance SQLite WAL**:
   - Tuned with `PRAGMA journal_mode = WAL`, `PRAGMA synchronous = NORMAL`, and `PRAGMA cache_size = -64000` (64MB RAM cache) for sub-millisecond query responses.
   - Complete normalized relational schema with foreign key constraints, indexes, and full audit trail history.

---

## 🔐 Demo Accounts & One-Click Logins

The application is pre-seeded with verified test accounts across all 4 roles. You can sign in using credentials or click the **1-Click Demo Buttons** on the Sign In page:

| Role | Email | Password | Primary Dashboard | Key Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **🛡️ Super Admin** | `admin@biteflow.com` | `admin123` | `/admin` | Platform KPIs, restaurant approvals, user suspension, global catalog |
| **🍽️ Restaurant Owner** | `owner@biteflow.com` | `owner123` | `/owner-dashboard` | Own restaurant menu, categories, nutrition facts, order acceptance & prep |
| **🛵 Delivery Partner** | `delivery@biteflow.com` | `delivery123` | `/delivery-dashboard` | Accept deliveries, route waypoints, live tracking, wallet earnings |
| **👤 Customer** | `user@biteflow.com` | `user123` | `/` | Food ordering, address book, UPI/Card/COD payments, live order tracking |
| **🛡️ Admin (Backup)** | `admin@savorit.com` | `admin123` | `/admin` | Secondary super administrator account |

---

## 🔄 Complete Order Lifecycle

Every stage is validated, recorded in `orders` and `order_status_history`, and broadcasted in real time:

```text
[CUSTOMER]
   │  1. Add to Cart / Order Now
   │  2. Select Delivery Address (Home / Work / Other)
   │  3. Pay via UPI (GPay/PhonePe/Paytm), Card, or COD
   ▼
[STATUS: PLACED]
   │
   ▼
[RESTAURANT OWNER]
   │  Receives sound & visual alert in Owner Dashboard
   ├── [Reject Order with reason] ──> [STATUS: CANCELLED_BY_RESTAURANT]
   └── [Accept Order]
        │
        ▼
   [STATUS: CONFIRMED]
        │  Owner clicks "Start Preparing"
        ▼
   [STATUS: PREPARING]
        │  Kitchen prepares food, owner packs and clicks "Mark Ready for Pickup"
        ▼
   [STATUS: READY_FOR_PICKUP]
        │
        ▼
[DELIVERY PARTNER]
   │  Order appears in "Available Deliveries" tab
   │  Partner clicks "Accept Delivery"
   ▼
[STATUS: DELIVERY_ASSIGNED]
   │  Trip waypoint progression:
   ├── "Heading to Restaurant" ─────────> [STATUS: GOING_TO_RESTAURANT]
   ├── "Arrived at Restaurant" ─────────> [STATUS: ARRIVED_AT_RESTAURANT]
   ├── "Picked Up Package" ────────────> [STATUS: FOOD_PICKED_UP]
   ├── "Out for Delivery" ─────────────> [STATUS: OUT_FOR_DELIVERY]
   ├── "Arrived at Customer" ──────────> [STATUS: ARRIVED_AT_CUSTOMER]
   └── "Mark Delivered" ───────────────> [STATUS: DELIVERED]
                                                │
                                                ├── Rider Wallet credited +₹45
                                                └── Customer unlocks Rating & Review
```

---

## 🛡️ Security & Role-Based Authorization

Security is enforced at the database and HTTP controller level — **never relying only on frontend UI hiding**:

1. **JWT Authentication**: All protected routes require a valid `Bearer <token>` verified via `authenticateToken` middleware.
2. **Role Authorization (`requireRole`)**:
   - `/api/owner/*` requires role `RESTAURANT_OWNER` or `ADMIN`.
   - `/api/delivery/*` requires role `DELIVERY_PARTNER` or `ADMIN`.
   - `/api/admin/*` strictly requires role `ADMIN`. Unauthorized attempts receive `403 Forbidden`.
3. **Restaurant Ownership Validation (`verifyRestaurantOwnership`)**:
   - A restaurant owner can **only** view, edit, or delete restaurants, categories, and foods they own.
   - If Owner A attempts `PUT /api/owner/restaurant/25` for a restaurant owned by Owner B, the backend rejects with `403 Forbidden: You do not own this restaurant`.
4. **Input Sanitization & Validation**:
   - Password hashing with `bcryptjs` (salt rounds: 10).
   - Passwords are never sent over API responses or visible in admin tables.
   - Demo payment mode (`PAYMENT_MODE=demo`) generates secure mock transaction IDs (`TXN_BF_...`) without collecting sensitive CVV/card numbers.

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)

### 1. Installation
```bash
# Clone or navigate to the repository
cd FUTURE_FS_03-main

# Install dependencies (Express, React 19, Socket.IO, SQLite3, Vite)
npm install
```

### 2. Start Application
```bash
# Option A: Run Full Stack Concurrently (Server on :5000 + Vite on :3000)
npm run dev

# Option B: Run Server & Client separately
npm run dev:server   # Express API + Socket.IO on http://localhost:5000
npm run dev:client   # Vite Frontend Dev Server on http://localhost:3000
```

### 3. Open in Browser
- **Frontend App:** [http://localhost:3000](http://localhost:3000)
- **Backend API Server:** [http://localhost:5000](http://localhost:5000)

### 4. Automated Verification Suite
Run the included end-to-end verification script to validate all 4 roles and security barriers:
```bash
node test_e2e_lifecycle.js
```

---

## ⚙️ Environment Configuration (`.env`)

```env
# Server
PORT=5000
NODE_ENV=development

# Database (High-Performance SQLite with WAL Mode)
DATABASE_PATH=./database.db

# JWT Authentication
JWT_SECRET=biteflow_super_secret_key_change_this_2026
JWT_EXPIRES_IN=7d

# Frontend & CORS
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,http://localhost:5000

# Payment Gateway Configuration ('demo')
PAYMENT_MODE=demo
UPI_ENABLED=true
GPAY_ENABLED=true
PHONEPE_ENABLED=true
PAYTM_ENABLED=true

# Delivery Fee & Thresholds (in ₹ INR)
DEFAULT_DELIVERY_FEE=30
FREE_DELIVERY_MINIMUM=499
PLATFORM_FEE=5

# Order Boundaries
MINIMUM_ORDER_AMOUNT=100
MAXIMUM_ORDER_AMOUNT=10000
```

---

## 📡 API Reference

### 1. Authentication
- `POST /api/auth/register` — Register new user with role (`CUSTOMER`, `RESTAURANT_OWNER`, `DELIVERY_PARTNER`).
- `POST /api/auth/login` — Sign in with email and password, receives JWT.
- `GET /api/auth/me` — Retrieve authenticated user profile and normalized role.
- `PUT /api/auth/profile` — Update account profile details.

### 2. Customer
- `GET /api/restaurants` — Filter and search approved restaurants.
- `GET /api/restaurants/:id` — Restaurant profile, verified menu categories, and reviews.
- `POST /api/orders` — Place order with items, address, and demo payment.
- `GET /api/orders` — List user's past and active orders.
- `GET /api/orders/:id` — Real-time tracking data with driver details and status history.
- `POST /api/orders/:id/reorder` — Re-adds previous order items directly to cart.
- `POST /api/reviews` — Submit 5-star ratings and text review for completed order.
- `GET /api/addresses` & `POST /api/addresses` — Manage saved addresses (Home, Work, Other).

### 3. Restaurant Owner (`requireOwner`)
- `GET /api/owner/restaurant` — Retrieve owned restaurant details.
- `POST /api/owner/restaurant` — Register new restaurant (creates in `PENDING_APPROVAL` status).
- `PUT /api/owner/restaurant/:id` — Update restaurant details (ownership verified).
- `PUT /api/owner/restaurant/:id/toggle-open` — Toggle kitchen Open / Closed.
- `GET /api/owner/categories/:restaurantId` — Fetch food categories.
- `POST /api/owner/categories` & `DELETE /api/owner/categories/:id` — Manage categories.
- `GET /api/owner/foods/:restaurantId` — Fetch all menu items for owned restaurant.
- `POST /api/owner/foods` — Create food item with nutrition facts (Calories, Protein, Carbs, Fat, Fiber, Sugar, Sodium, Spicy level).
- `PUT /api/owner/foods/:id` & `DELETE /api/owner/foods/:id` — Update/delete dish.
- `PUT /api/owner/foods/:id/toggle` — Enable / disable dish availability.
- `GET /api/owner/orders/:restaurantId` — Live incoming orders queue.
- `PUT /api/owner/orders/:id/accept` — Accept order (`PLACED -> CONFIRMED`).
- `PUT /api/owner/orders/:id/reject` — Reject order with reason (`PLACED -> CANCELLED_BY_RESTAURANT`).
- `PUT /api/owner/orders/:id/prepare` — Mark preparing (`CONFIRMED -> PREPARING`).
- `PUT /api/owner/orders/:id/ready` — Mark ready for pickup (`PREPARING -> READY_FOR_PICKUP`).

### 4. Delivery Partner (`requireDelivery`)
- `GET /api/delivery/profile` — Driver details, vehicle, rating, today's earnings, total deliveries.
- `PUT /api/delivery/availability` — Toggle Online / Offline status.
- `GET /api/delivery/available-orders` — Orders ready for pickup awaiting assignment.
- `POST /api/delivery/accept/:orderId` — Assign order to current partner (`DELIVERY_ASSIGNED`).
- `GET /api/delivery/active-order` — Current active delivery trip with pickup/drop locations.
- `PUT /api/delivery/orders/:orderId/status` — Step along route (`GOING_TO_RESTAURANT`, `ARRIVED_AT_RESTAURANT`, `FOOD_PICKED_UP`, `OUT_FOR_DELIVERY`, `ARRIVED_AT_CUSTOMER`, `DELIVERED`).
- `GET /api/delivery/completed-orders` — History of completed delivery trips.

### 5. Super Admin (`requireAdmin`)
- `GET /api/admin/stats` — Real-time platform KPI metrics (users by role, orders, revenue, fleet).
- `GET /api/admin/restaurants` — Full list of all restaurants with owner info.
- `PUT /api/admin/restaurants/:id/status` — Approve, Reject, or Suspend restaurant.
- `DELETE /api/admin/restaurants/:id` — Remove restaurant from platform.
- `GET /api/admin/users?role=X` — View users filtered by role.
- `PUT /api/admin/users/:id/status` — Activate or Suspend user account.
- `GET /api/admin/delivery-partners` — View all delivery partner fleet records.
- `PUT /api/admin/delivery-partners/:id/status` — Approve or deactivate partner.

---

## 📂 Project Structure

```
FUTURE_FS_03-main/
├── .env                       # Backend and frontend environment variables
├── .env.example               # Template environment configuration
├── server.js                  # Main Express backend with Socket.IO, SQLite WAL & RBAC
├── server_features.js         # Surplus prediction model & Group delivery routing
├── test_e2e_lifecycle.js      # Automated multi-role end-to-end verification script
├── database.db                # SQLite database (15 restaurants, 280+ dishes, 4 roles)
├── package.json               # Node.js dependencies and run scripts
├── index.html                 # Single page application entry with BiteFlow branding
├── public/
│   ├── logo.png               # High-definition BiteFlow brand logo
│   └── favicon.png            # BiteFlow browser icon
└── src/
    ├── App.tsx                # Client router & modal providers
    ├── main.tsx               # React 19 bootstrap
    ├── index.css              # Swiggy/Zomato style design system & tokens
    ├── types.ts               # Complete TypeScript multi-role interface definitions
    ├── components/
    │   ├── Navbar.tsx         # Role badge, Deliver To, Search, Hub shortcuts, Cart
    │   ├── MobileBottomNav.tsx# Role-tailored mobile bottom navigation tabs
    │   ├── RestaurantCard.tsx # Swiggy-style cards with discount ribbons & rating pills
    │   ├── FoodCard.tsx       # Food cards with dual action (Add + instant Order Now)
    │   ├── LocationModal.tsx  # GPS & address selection modal
    │   └── ...
    └── pages/
        ├── Auth.tsx           # Multi-role register & 1-Click demo logins for all 4 roles
        ├── Home.tsx           # "What's on your mind?", Quick filters, and Restaurant list
        ├── RestaurantDetail.tsx # Menu categories, nutrition breakdown, and floating cart
        ├── RestaurantOwnerDashboard.tsx # Complete Owner Portal (Onboarding, Menu, Orders)
        ├── DeliveryPartnerDashboard.tsx # Courier Portal (Online toggle, Active trip, Wallet)
        ├── Admin.tsx          # Super Admin Operations Hub (KPIs, Approvals, Users)
        ├── OrderTracking.tsx  # Live 6-stage tracker with Socket.IO, map & review modal
        ├── CartPage.tsx       # Cart with Free Delivery progress bar & bill breakdown
        ├── Checkout.tsx       # Indian UPI (GPay/PhonePe/Paytm), Card, and COD gateway
        ├── SmartCombos.tsx    # Interactive Smart Combo Builder
        ├── HealthFood.tsx     # Nutrition & health-filtered catalog
        └── RescueHub.tsx      # Smart Surplus Food Rescue Hub
```

---

## 📄 License
This project is open-source and intended for educational and enterprise portfolio demonstrations.

© 2026 **BiteFlow Technologies**. All rights reserved.
