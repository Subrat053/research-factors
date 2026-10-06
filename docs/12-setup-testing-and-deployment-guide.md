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

---

## 4. Frontend Production Deployment & Optimization Architecture

The frontend is built with high-performance production optimizations:

### 1. Route-Level Code Splitting & Vendor Chunking
- **Entry Chunk**: Minified to **~73 kB (gzip: ~26 kB)** using route-level lazy loading (`React.lazy()` + `<Suspense>`).
- **Heavy Engines Isolated**: The Tiptap rich-text article editor (`@tiptap/*`, ~332 kB) is bundled into a separate `vendor-tiptap` chunk and downloaded **only** when navigating to `/admin/editor`. Public readers on `/` or `/research/:slug` never download editor dependencies.
- **Vendor Splitting**:
  - `vendor-react`: Core runtime (`react`, `react-dom`, `react-router-dom`, `react-helmet-async`)
  - `vendor-tanstack`: Data caching layer (`@tanstack/react-query`)
  - `vendor-tiptap`: Block editor engine (`@tiptap/react`, `@tiptap/starter-kit`, extensions)
  - `vendor-icons`: Icon assets (`lucide-react`)
  - `vendor-forms`: Validation & schemas (`react-hook-form`, `zod`)

### 2. Fault-Tolerant Error Boundaries
- Uncaught runtime rendering errors are trapped by [`frontend/src/components/common/ErrorBoundary.jsx`](file:///d:/Wizmonk/ResearchFactor/frontend/src/components/common/ErrorBoundary.jsx), rendering an editorial-styled recovery screen with reload and home recovery navigation rather than a blank white screen.

### 3. SPA Routing & Server Redirects
Because client-side routing is handled by React Router, web servers must rewrite deep URLs to `/index.html`:
- **Cloudflare Pages / Netlify**: Configured via [`frontend/public/_redirects`](file:///d:/Wizmonk/ResearchFactor/frontend/public/_redirects) (`/* /index.html 200`).
- **Nginx / Docker**: Configured via [`frontend/nginx.conf`](file:///d:/Wizmonk/ResearchFactor/frontend/nginx.conf) (`try_files $uri $uri/ /index.html;`).

### 4. Search Engine Crawling & Discovery
- [`frontend/public/robots.txt`](file:///d:/Wizmonk/ResearchFactor/frontend/public/robots.txt) grants full access to public editorial routes while shielding `/admin/`, `/editor/`, and auth endpoints.
- [`frontend/public/sitemap.xml`](file:///d:/Wizmonk/ResearchFactor/frontend/public/sitemap.xml) pre-declares canonical publication URLs with change frequencies.

### 5. Dynamic Base URL & Portability (`/rf/` Subpath vs Domain Root `/`)
The frontend is architected for zero-code migration between subfolder hosting (e.g. `https://demo.wizmonk.com/rf/`) and domain root hosting (`https://demo.wizmonk.com/`):

1. **Environment Configuration (`VITE_BASE_PATH`)**:
   - For subfolder hosting: `VITE_BASE_PATH=/rf/` in `.env` / `.env.production`.
   - For root domain hosting: `VITE_BASE_PATH=/` in `.env` / `.env.production`.
   - Vite dynamically loads `VITE_BASE_PATH` via `loadEnv` in `vite.config.js`, properly normalizing leading and trailing slashes.

2. **React Router Basename**:
   - The root router automatically inherits Vite's base: `<BrowserRouter basename={import.meta.env.BASE_URL}>`.
   - All internal navigation (`<Link>`, `<Navigate>`, `useNavigate`) operates seamlessly relative to the configured base path.

3. **Dynamic URL & Path Helper (`frontend/src/utils/url.js`)**:
   - `getAppPath(path)`: Dynamically prefixes internal paths with the active base path (e.g. `/rf/research/preview/:id` or `/research/preview/:id`).
   - `getAppUrl(path)`: Dynamically resolves fully-qualified URLs including origin (e.g. `https://demo.wizmonk.com/rf/research/preview/:id` or `https://demo.wizmonk.com/research/preview/:id`).
   - Use `getAppUrl` for all external `window.open` actions (such as the Manuscript Studio Live Preview button), canonical URLs, and `<a target="_blank">` context links. Never hardcode `/rf` or root paths in `window.open` or `<a href>`.

4. **Directory-Agnostic Apache (.htaccess)**:
   - [`frontend/public/.htaccess`](file:///d:/Wizmonk/ResearchFactor/frontend/public/.htaccess) uses directory-relative rewrite rules:
     ```apache
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . index.html [L]
     ```
   - Omits hardcoded `RewriteBase`, allowing the same `.htaccess` file to serve single-page routing whether placed inside a subfolder (`/rf/`) or at the domain root (`/`).

5. **Transitioning from `/rf/` to Root `/` Checklist**:
   - In `frontend/.env.production`, change:
     - `VITE_BASE_PATH=/`
     - `VITE_API_URL=/api/v1`
     - `VITE_STORAGE_URL=/uploads`
   - In backend production `.env`, adjust:
     - `APP_URL="https://demo.wizmonk.com"`
     - `API_URL="https://demo.wizmonk.com"`
     - `LOCAL_STORAGE_PUBLIC_URL="https://demo.wizmonk.com/uploads"`
   - Rebuild the frontend (`npm run build`). No source code modifications are required!

