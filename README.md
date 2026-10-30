# StockFlow – SaaS Inventory Management MVP

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.21-lightgrey.svg)](https://expressjs.com/)
[![Prisma](https://img.shields.io/badge/Prisma-6.4-2d3748.svg)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon%20Serverless-336791.svg)](https://neon.tech/)

A production-minded, multi-tenant SaaS Inventory Management System tailored for growing retailers, independent sellers, and e-commerce merchants.

---

## 🌟 Evaluator Demo Access & Credentials

StockFlow includes a pre-configured, isolated demo organization pre-loaded with a realistic inventory catalog, varying stock levels, and alert thresholds:

- **Demo Organization:** `StockFlow Demo Retail`
- **Demo Email:** `demo@stockflow.com`
- **Demo Password:** `DemoUser123!`
- **One-Click Instant Access:** Evaluators can click the compact **"Explore Demo"** button on the Login page to authenticate immediately without manual credential entry (zero sensitive credentials exposed in frontend code).
- **Tenant Isolation Guarantee:** Newly registered organizations always start with a clean, empty catalog (0 products). Sample demo products are strictly isolated to the demo organization and never bleed into new tenant accounts.
- **Currency:** All financial figures, cost prices, and selling prices are formatted in Indian Rupee (**INR ₹**).

---

## 🌟 Live Demo & Repository

- **Live Deployed Application:** [https://stockflow-app-cp8b.onrender.com](https://stockflow-app-cp8b.onrender.com)
- **Render Web Service:** `stockflow-app` (Free Web Service + Neon Serverless PostgreSQL)
- **Public GitHub Repository:** [https://github.com/shivaram-std/stockflow](https://github.com/shivaram-std/stockflow)
- **Local Dev Server:** Frontend: `http://localhost:3000` | Backend API: `http://localhost:5001`
- **Unified Production Server:** `http://localhost:5001` (Serves React SPA + Express API on a single production process)

---

## 🏗 Architecture & Design

StockFlow uses a decoupled client-server architecture with strict organization-level data isolation enforced at the database query boundary.

```
+-------------------------------------------------------------------------+
|                              Frontend Client                            |
|             React 18 + TypeScript + Vite + Tailwind CSS + Lucide        |
|      (AuthContext, ToastContext, Reusable Modals, Skeletons, Badges)    |
+-----------------------------------+-------------------------------------+
                                    |
                          HTTP / REST API (JSON)
                    Authorization: Bearer <JWT Token>
                                    |
                                    v
+-------------------------------------------------------------------------+
|                               Express API                               |
|          Node.js + Express + TypeScript + Helmet + CORS + Zod           |
+-----------------------------------+-------------------------------------+
                                    |
                        JWT Verification Middleware
               Injects req.user = { userId, organizationId }
                                    |
                                    v
+-------------------------------------------------------------------------+
|                         Data Layer (Prisma ORM)                         |
|           All queries explicitly filtered by req.user.organizationId    |
|                Tenant-scoped SKU uniqueness: @@unique([orgId, sku])     |
+-----------------------------------+-------------------------------------+
                                    |
                                    v
+-------------------------------------------------------------------------+
|                    Cloud PostgreSQL Storage Engine                      |
|          (Neon Serverless PostgreSQL with pooled & direct URLs)         |
+-------------------------------------------------------------------------+
```

---

## 🔑 Core Features

### 1. Multi-Tenant Authentication & Identity
- **Self-Serve Signup**: Simultaneously provisions an Organization and the Owner account.
- **Secure Password Hashing**: Passwords salted and hashed with `bcryptjs` (salt rounds: 10).
- **JWT Authentication**: Cryptographically signed tokens encoding user and tenant claims with 7-day expiration.
- **Zero-Trust Tenant Authorization**: Client-provided `organizationId` is never trusted; every query is scoped exclusively to the verified token claims.
- **Leakage Prevention**: Password hashes are stripped at the ORM/controller level and never exposed in any API response.

### 2. Product & Inventory Management
- **Complete CRUD**: Create, read, update, delete products with instant feedback.
- **Tenant-Scoped SKU Uniqueness**: Enforces `(organizationId, sku)` uniqueness constraint in PostgreSQL via Prisma, preventing collisions within an organization while permitting identical SKUs across different organizations.
- **Inventory Metrics**: Tracks Quantity on Hand, Cost Price, Selling Price, and custom thresholds.
- **Quick Stock Adjustment**: Instant `+/-` adjustments with notes, preview of resulting quantities, and real-time validation against negative stock levels.
- **Live Search & Filter**: Real-time filtering by SKU, product name, and low-stock status.

### 3. Real-Time Dashboard & Low-Stock Alerts
- **Metrics Summary**: Real-time counters for Total Products, Total Inventory Units, and Low-Stock Alerts calculated from real database records.
- **Dynamic Thresholding**: Computes `quantityOnHand <= (product.lowStockThreshold ?? org.defaultLowStockThreshold)`.
- **Low-Stock Item Roster**: Dedicated table highlighting products requiring replenishment with current quantities and effective thresholds.
- **Empty States**: Clear, contextual empty states for brand new organizations with zero products vs. healthy catalogs.

### 4. Organization Settings
- **Default Low-Stock Threshold**: Configurable fallback threshold applying automatically to products without custom thresholds.
- **Dynamic Recalculation**: Updating the organization default immediately reflects across the catalog and dashboard without manual edits.

### 5. Currency Consistency & Localization
- **Standard INR Formatting**: All cost prices, selling prices, and dashboard values are consistently formatted in Indian Rupee (**INR ₹**) with 2 decimal places.

### 6. Demo Experience & Multi-Tenant Isolation
- **Preloaded Demo Tenant**: Evaluators can explore with sample inventory via the **"Explore Demo"** button or demo credentials (`demo@stockflow.com` / `DemoUser123!`).
- **Clean New Signups**: Newly registered organizations start with zero products, strictly isolated from demo data.

---

## 🛠 Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, React Router DOM, Tailwind CSS, Lucide Icons |
| **Backend** | Node.js, Express.js, TypeScript, tsx, Zod, Helmet, CORS |
| **Authentication** | JWT (`jsonwebtoken`), `bcryptjs` |
| **Database & ORM** | PostgreSQL (Neon Serverless), Prisma ORM 6.4 (with migrations & pooled runtime) |
| **Hosting & Deployment** | Render Web Service (`stockflow-app`), Render Blueprint (`render.yaml`), Docker |

---

## 📂 Project Structure

```
stockflow/
├── Dockerfile                      # Multi-stage production container with persistent /data volume
├── render.yaml                     # Render Blueprint definition with persistent SSD disk
├── package.json                    # Root orchestration scripts
├── README.md                       # Complete documentation
├── client/                         # Frontend Application (React + Vite + Tailwind)
│   ├── src/
│   │   ├── api/client.ts           # Centralized typed API client & 401 interceptor
│   │   ├── components/             # Reusable UI components (Modal, Button, Badge, Skeleton)
│   │   ├── context/                # AuthContext & ToastContext providers
│   │   ├── pages/                  # Views (Login, Signup, Dashboard, Products, Settings)
│   │   ├── types/index.ts          # TypeScript domain interfaces
│   │   ├── App.tsx                 # Route configuration & navigation guards
│   │   ├── index.css               # Tailwind design tokens & animations
│   │   └── main.tsx                # Client mounting
│   ├── index.html
│   └── vite.config.ts              # Vite proxy configuration
└── server/                         # Backend API (Node.js + Express + Prisma)
    ├── prisma/
    │   ├── schema.prisma           # Organization, User, Product schema
    │   └── migrations/             # Applied database migrations
    ├── src/
    │   ├── controllers/            # Auth, Product, Dashboard, Settings handlers
    │   ├── middleware/             # requireAuth, validateBody, errorHandler
    │   ├── routes/                 # Express route definitions
    │   ├── schemas/                # Zod request validation schemas
    │   ├── tests/                  # Integration, security, and E2E test suites
    │   ├── utils/                  # Prisma singleton, JWT & bcrypt helpers
    │   └── index.ts                # Express server with Helmet & SPA static serving
    └── package.json
```

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 1. Installation
Install all dependencies across root, backend, and frontend:
```bash
npm run install:all
```

### 2. Environment Configuration
Create the server `.env` file:
```bash
cp server/.env.example server/.env
```
Default development environment variables (without real secrets):
```env
PORT=5001
JWT_SECRET=stockflow-dev-secret-key-12345
DATABASE_URL="postgresql://user:password@ep-xyz-pooler.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require"
NODE_ENV=development
```

### 3. Initialize Database
Generate Prisma client and apply database migrations:
```bash
npm --prefix server run prisma:generate
npm --prefix server run prisma:deploy
```

### 4. Run Development Servers
Launch both backend and frontend concurrently:
```bash
npm run dev
```
- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5001](http://localhost:5001)

---

## 🧪 Testing

StockFlow includes a comprehensive automated test suite testing real database records, tenant isolation, security boundaries, and user journeys:

```bash
# Run all tests (Security + Integration + 13-Step E2E Journey + Persistence)
npm run test:all

# Run individual test suites
npm run test:integration    # 64 security, multi-tenancy, demo isolation, and CRUD tests
npm run test:journey        # Complete 13-step end-to-end user workflow
npm run test:persistence    # Database restart resilience & data survival test
```

---

## 📡 API Endpoint Reference

| Method | Endpoint | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Public | Register new user and create organization |
| `POST` | `/api/auth/login` | Public | Authenticate user and issue JWT token |
| `POST` | `/api/auth/demo` | Public | One-click evaluator login to isolated demo tenant |
| `GET` | `/api/auth/me` | Protected | Return authenticated user and organization metadata |
| `GET` | `/api/products` | Protected | List products scoped to organization (supports `?search=`) |
| `POST` | `/api/products` | Protected | Create new product (enforces unique SKU per organization) |
| `GET` | `/api/products/:id` | Protected | Retrieve single product (returns 404 if not owned) |
| `PUT` | `/api/products/:id` | Protected | Update product fields and pricing |
| `DELETE` | `/api/products/:id` | Protected | Delete product |
| `PATCH` | `/api/products/:id/stock` | Protected | Quick stock adjustment (`+/- units` with note) |
| `GET` | `/api/dashboard/stats` | Protected | Aggregated product counts, inventory sum, low-stock list |
| `GET` | `/api/settings` | Protected | Get organization's default low stock threshold |
| `PUT` | `/api/settings` | Protected | Update organization's default low stock threshold |
| `GET` | `/api/health` | Public | API health check and server status |

---

## 📦 Production Deployment

### Option A: Render Cloud Deployment (Live)
StockFlow is configured for automated continuous deployment on Render using the declarative `render.yaml` specification:

- **Live URL:** [https://stockflow-app-cp8b.onrender.com](https://stockflow-app-cp8b.onrender.com)
- **Service Name:** `stockflow-app`
- **Build Command:** `npm run install:all && npm --prefix server run prisma:generate && npm run build`
- **Start Command:** `npm --prefix server run prisma:deploy && npm start`
- **Health Check Path:** `/api/health`
- **Database:** Neon Serverless PostgreSQL (`DATABASE_URL` with connection pooler and `DIRECT_URL` for migrations)

To deploy with Render Blueprint:
1. Push your repository to GitHub.
2. In the Render Dashboard, click **New > Blueprint**.
3. Select your `stockflow` repository.
4. Set `DATABASE_URL` and `DIRECT_URL` in environment variables and click **Apply**.

### Option B: Docker Container Deployment
Build and run the multi-stage Docker container locally or on any cloud server:
```bash
# Build the production image
docker build -t stockflow:latest .

# Run container connected to PostgreSQL
docker run -d \
  -p 5001:5001 \
  -e DATABASE_URL="postgresql://user:password@ep-xyz-pooler.aws.neon.tech/neondb?sslmode=require" \
  -e DIRECT_URL="postgresql://user:password@ep-xyz.aws.neon.tech/neondb?sslmode=require" \
  -e JWT_SECRET="your-production-secret" \
  --name stockflow-app \
  stockflow:latest
```

### Option C: Single-Instance Node.js
```bash
npm run build
npm run start
```
The server serves both the production React application and API on port 5001 with HTTP security headers (`Helmet`, `HSTS`, `X-Content-Type-Options`).

---

## 📄 License
MIT
