# 12. SETUP, TESTING & DEPLOYMENT GUIDE

## 1. Local Developer Environment Setup

Follow these steps to run the complete Research Factors platform locally.

### Prerequisites
- Node.js (v20.x or higher LTS)
- npm or pnpm
- Docker & Docker Compose (or native PostgreSQL 15+)

---

### Step 1: Clone & Configure Environment

```bash
cd d:/Wizmonk/ResearchFactor

# Configure Backend Environment
cp backend/.env.example backend/.env

# Configure Frontend Environment
cp frontend/.env.example frontend/.env
```

#### Minimal Backend `.env`:
```env
PORT=5000
NODE_ENV=development
APP_URL=http://localhost:5173
API_URL=http://localhost:5000

# Universal Database Connection (Local Docker or Neon)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/research_factors?schema=public"

# Auth Secrets
JWT_SECRET="super-secret-development-jwt-key-minimum-32-characters"
JWT_EXPIRES_IN="7d"

# Storage Abstraction (Defaulting to local disk)
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH="./uploads"
LOCAL_STORAGE_PUBLIC_URL="http://localhost:5000/uploads"

# Optional: Email & Redis
EMAIL_PROVIDER=smtp
SMTP_HOST=localhost
SMTP_PORT=1025
REDIS_URL="redis://localhost:6379"
```

---

### Step 2: Start Local Infrastructure (Docker Compose)

Create a `docker-compose.yml` for PostgreSQL and Redis:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: rf_postgres
    restart: always
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: research_factors
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    container_name: rf_redis
    restart: always
    ports:
      - '6379:6379'

volumes:
  postgres_data:
```

Start containers:
```bash
docker compose up -d
```

---

### Step 3: Database Migrations & Seeding

```bash
cd backend

# Install backend dependencies
npm install

# Run Prisma migrations
npx prisma migrate dev --name init

# Seed development users, roles, categories, and sample articles
npm run prisma:seed
```

Default seeded credentials (Development only):
- **Super Admin**: `admin@researchfactors.com` / `Password123!`
- **Editor**: `editor@researchfactors.com` / `Password123!`
- **Author**: `author@researchfactors.com` / `Password123!`
- **Reader**: `reader@researchfactors.com` / `Password123!`

---

### Step 4: Start Development Servers

In terminal 1 (Backend):
```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
```

In terminal 2 (Frontend):
```bash
cd frontend
npm install
npm run dev
# Vite dev server live at http://localhost:5173
```

---

## 2. Automated Testing Strategy

```
           ▲
          / \     E2E Tests (Playwright)
         /   \    - Full author-to-reader publishing lifecycle
        /-----\
       /       \   Integration / API Tests (Supertest)
      /         \  - Endpoint validation, RBAC matrices, Prisma operations
     /-----------\
    /             \ Unit & Contract Tests (Vitest)
   /               \- Pure utils, slug generation, storage adapter contract
  ───────────────────
```

### 1. Storage Provider Contract Tests
The exact same test suite runs against `LocalStorageProvider`, `CloudinaryStorageProvider`, and `R2StorageProvider` to guarantee complete drop-in substitutability:
- `upload()` writes bytes and returns reachable URL.
- `exists()` returns `true` for uploaded asset, `false` for nonexistent key.
- `delete()` removes file cleanly.

### 2. Running Test Suites
```bash
cd backend
npm run test:unit        # Unit tests
npm run test:integration # API & RBAC tests
npm run test:storage     # Storage provider contract suite

cd frontend
npm run test             # Component tests
```

---

## 3. Continuous Integration & Deployment (CI/CD)

### GitHub Actions Pipeline (`.github/workflows/ci.yml`)
1. **Lint & Static Analysis**: ESLint and formatting checks on JavaScript code.
2. **Database Migration Check**: Runs `prisma migrate diff` to prevent uncommitted schema drifts.
3. **Automated Test Run**: Executes unit and integration test suites against ephemeral PostgreSQL service container.
4. **Vite Build**: Tests frontend bundle compilation and verifies asset tree.
5. **Deployment**: Deploys frontend to CDN (e.g. Cloudflare Pages) and backend container to managed hosting (e.g. AWS ECS / Render / Railway).
