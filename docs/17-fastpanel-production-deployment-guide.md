# 17. FASTPANEL PRODUCTION DEPLOYMENT GUIDE (`/rf` SUBDIRECTORY)

## 1. Architecture & Deployment Context

This guide outlines the production deployment of the **Research Factors** platform—both the **React (Vite) Frontend** and **Node.js (Express/Prisma) Backend**—inside the `/rf` subfolder of `demo.wizmonk.com` managed via **FASTPANEL** on a Linux server:

```
Server Path: /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf
Public URL:  https://demo.wizmonk.com/rf
```

---

## 2. Core Architectural Pillars

### A. Dual Routing & Prefix Agnosticism
In a subdirectory deployment (`/rf`), incoming HTTP requests may arrive at Express with or without the `/rf` path prefix depending on whether the web server (Apache/Nginx) rewrites or transparently proxies paths. 
To guarantee zero 404 errors, Express mounts all API modules, health checks, and static uploads under **dual prefixes**:
- `/api/v1/*` AND `/rf/api/v1/*`
- `/uploads/*` AND `/rf/uploads/*`
- `/health/*` AND `/rf/health/*`
- `/sitemap.xml` AND `/rf/sitemap.xml`

### B. Unified Monolith vs. Reverse Proxy Compatibility
The application is engineered to operate seamlessly under two deployment patterns:

| Feature | Pattern A: Unified Node Monolith (Recommended) | Pattern B: Web Server + Reverse Proxy |
| :--- | :--- | :--- |
| **Static Assets** | Served by Express via `app.use('/rf', express.static('dist'))` | Served directly by Apache/Nginx from `/rf` |
| **API Requests** | Handled directly by Express on `/rf/api/v1` | Apache `.htaccess` (`[P]`) or Nginx proxies `/rf/api/*` to Node port 5005 |
| **SPA Fallback** | Express catches non-API routes and sends `dist/index.html` | Apache `.htaccess` rewrites non-file routes to `/rf/index.html` |
| **Configuration**| Simplest: Single service managed in FASTPANEL Backend | Highly performant for static asset offloading |

---

## 3. Directory Layout on the Server

When deployed inside `/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf`:

```
/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/
├── dist/                          # Frontend production build (assets, images, index.html)
│   ├── assets/
│   ├── images/
│   ├── index.html
│   └── favicon...
├── src/                           # Backend Express source code
│   ├── app.js
│   ├── server.js
│   ├── config/
│   └── modules/
├── prisma/                        # Prisma schema & migrations
│   └── schema.prisma
├── uploads/                       # Local media storage directory
│   └── media/
├── scripts/                       # Database maintenance and normalization scripts
├── package.json                   # Backend package.json (with postinstall: prisma generate)
├── .env                           # Production environment variables (PRIVATE)
├── .htaccess                      # Security guards & Apache reverse proxy rules
└── README_DEPLOY.md               # Quick reference guide
```

---

## 4. Production Security Hardening (`.htaccess`)

Because backend source files reside inside a publicly addressable web folder, the production `.htaccess` strictly forbids direct web downloads of sensitive files:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /rf/

  # 1. SECURITY GUARDS: Forbid web access to sensitive backend files
  RewriteRule ^(\.env|\.git|package\.json|package-lock\.json|prisma|src|node_modules|backend) - [F,L]
  RewriteRule \.(log|sql|md|sh)$ - [F,L]

  # 2. SPA ROUTING: Route client navigation to /rf/index.html
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /rf/index.html [L]
</IfModule>

# Security Headers & Content Protection
<IfModule mod_headers.c>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

---

## 5. Step-by-Step Deployment Instructions

### Step 1: Generate the Production Package
On your local machine, run:
```bash
npm run package:rf
```
This builds the frontend with `base: '/rf/'` and packages all frontend and backend artifacts into `dist_production_rf/`.

### Step 2: Upload Files to the Server
Using FASTPANEL File Manager or SFTP (e.g. FileZilla), upload the entire contents of `dist_production_rf/` into:
```
/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/
```

### Step 3: Configure Environment Variables (`.env`)
Inside `/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/`:
1. Rename or copy `.env.production.example` to `.env`:
   ```bash
   cp .env.production.example .env
   ```
2. Configure the production values:
   ```env
   NODE_ENV=production
   PORT=5005
   APP_URL="https://demo.wizmonk.com/rf,https://demo.wizmonk.com"
   API_URL="https://demo.wizmonk.com/rf"
   SERVE_STATIC_CLIENT=true
   CLIENT_DIST_PATH="./dist"

   # Database Connection:
   DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"

   # Authentication:
   JWT_SECRET="secure-random-32-character-secret-key-here"
   JWT_EXPIRES_IN="7d"

   # Storage Provider:
   STORAGE_PROVIDER=local
   LOCAL_STORAGE_PATH="./uploads"
   LOCAL_STORAGE_PUBLIC_URL="https://demo.wizmonk.com/rf/uploads"
   ```

### Step 4: Install Dependencies & Push Database Schema
Connect via SSH to your server:
```bash
cd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf

# Ensure correct file permissions
chown -R demo_wizmonk_usr:demo_wizmonk_usr /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf

# Install production dependencies (runs prisma generate automatically)
npm install --omit=dev

# Push any pending schema updates to the production database
npx prisma db push
```

### Step 5: Start the Application Service

#### Method A: Using FASTPANEL Backend Settings (Recommended)
1. Open **FASTPANEL** -> Navigate to **Site settings** for `demo.wizmonk.com`.
2. Go to the **Backend** tab.
3. Select **NodeJS** (or **PM2**).
4. In **Working subdirectory**, enter: `rf`.
5. In **Launch command**, enter: `npm start` (or `node src/server.js`).
6. Click **Save** and restart the service from the dashboard.

#### Method B: Using PM2 via SSH
If managing via PM2 directly:
```bash
cd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf
pm2 start src/server.js --name rf-backend --cwd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf
pm2 save
pm2 startup
```

---

## 6. Verification Checklist

| Endpoint / Feature | Expected URL | Expected Result |
| :--- | :--- | :--- |
| **Public Homepage** | `https://demo.wizmonk.com/rf/` | 200 OK — Renders Research Factors digital magazine |
| **Liveness Check** | `https://demo.wizmonk.com/rf/health/live` | 200 OK — `{"status":"alive"}` |
| **Database Readiness**| `https://demo.wizmonk.com/rf/health/ready` | 200 OK — `{"status":"ready","database":"connected"}` |
| **API Base** | `https://demo.wizmonk.com/rf/api/v1` | 200 OK — `{"success":true,"message":"Research Factors API v1 is operational"}` |
| **Published Articles**| `https://demo.wizmonk.com/rf/api/v1/articles` | 200 OK — Returns paginated articles JSON |
| **Static Media** | `https://demo.wizmonk.com/rf/uploads/media/...` | 200 OK — Serves optimized WebP images with CORP headers |
| **Author Studio** | `https://demo.wizmonk.com/rf/admin/editor/...`| 200 OK — Loads workspace with dual editing modes |
| **Security Guard** | `https://demo.wizmonk.com/rf/.env` | **403 Forbidden** — Direct download blocked by `.htaccess` |
