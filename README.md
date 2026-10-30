# StockFlow – SaaS Inventory Management MVP

A production-minded, multi-tenant SaaS Inventory Management System designed for small sellers and growing businesses.

---

## 🚀 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons
- **Backend:** Node.js, Express.js, TypeScript (`tsx` runtime)
- **Database (Phase 2):** SQLite + Prisma ORM
- **Authentication (Phase 2):** JWT + bcrypt

---

## 📂 Project Structure

```
stockflow/
├── client/                     # Frontend Vite + React + TypeScript + Tailwind
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── api/                # API client layer
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── pages/              # Application views/routes
│   │   ├── App.tsx             # Root React component
│   │   ├── index.css           # Tailwind design tokens & styles
│   │   └── main.tsx            # React DOM mounting
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts          # Vite config with /api proxy to server:5001
├── server/                     # Backend Node.js + Express + TypeScript
│   ├── src/
│   │   └── index.ts            # Express server entry point & health endpoint
│   ├── .env.example            # Backend environment variables template
│   ├── package.json
│   └── tsconfig.json
├── .env.example                # Project-wide environment reference
├── .gitignore                  # Git ignore rules
├── package.json                # Root orchestration scripts (concurrently)
└── README.md                   # Documentation
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### 1. Installation
Install root, server, and client dependencies:
```bash
npm run install:all
```
*(Or install in each directory individually)*

### 2. Environment Configuration
Copy `.env.example` in `server`:
```bash
cp server/.env.example server/.env
```

### 3. Running Locally
Run both client and backend servers concurrently:
```bash
npm run dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:5001](http://localhost:5001)
- **API Health Check:** [http://localhost:5001/api/health](http://localhost:5001/api/health)

---

## 🛠 Available Root Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Runs both backend and frontend concurrently in watch mode |
| `npm run dev:server` | Runs the backend development server on port 5001 |
| `npm run dev:client` | Runs the Vite frontend development server on port 3000 |
| `npm run build` | Builds both backend (TypeScript compiler) and frontend (Vite) |
| `npm run install:all` | Installs dependencies for root, server, and client |

---

## 🗺 Implementation Phases

- [x] **Phase 1: Project Setup & Baseline Toolchain**
  - Git repository initialization
  - Express + TypeScript backend baseline
  - Vite + React + TypeScript + Tailwind CSS frontend baseline
  - Root scripts orchestrating concurrent development
- [ ] **Phase 2: Database Schema & Backend Core**
  - Prisma ORM + SQLite setup
  - Multi-tenant data model (Organization, User, Product)
  - Auth APIs (Signup, Login, JWT verification)
  - Product CRUD with tenant isolation & SKU uniqueness
  - Dashboard stats & Settings endpoints
- [ ] **Phase 3: Integration & Multi-Tenancy Isolation Testing**
  - Automated tenant boundary tests
- [ ] **Phase 4: Frontend Application**
  - Auth forms, protected routes, responsive sidebar layout
  - Dashboard metrics & low stock table
  - Product management table, search filters, Add/Edit/Delete modals
  - Organization settings view
- [ ] **Phase 5: End-to-End Validation & Final Polish**
