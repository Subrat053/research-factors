# 17. FASTPANEL PRODUCTION DEPLOYMENT GUIDE (`/rf` SUBDIRECTORY)

## 1. Deployment Target

Research Factors is deployed as a complete React + Node.js application inside the `/rf` subfolder of the shared `demo.wizmonk.com` domain:

```text
Server path: /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf
Public URL:  https://demo.wizmonk.com/rf
```

The parent domain also hosts other applications, so the FastPanel backend type must stay as **PHP**. Do not switch the whole domain to Reverse Proxy.

## 2. Production Architecture

The deployment uses Apache/PHP for public web requests and PM2 for the private Node.js backend.

```text
Browser
  -> https://demo.wizmonk.com/rf/
  -> Apache/PHP serves React build files

Browser
  -> https://demo.wizmonk.com/rf/api/v1/articles
  -> /rf/.htaccess
  -> /rf/rf-proxy.php
  -> http://127.0.0.1:5005/api/v1/articles
  -> Express/Prisma/PostgreSQL
```

This avoids Apache `[P]`, Nginx `location`, or FastPanel reverse proxy requirements.

| Public Path | Internal Target |
| :--- | :--- |
| `/rf/` | React SPA static files |
| `/rf/api/*` | `rf-proxy.php` -> `http://127.0.0.1:5005/api/*` |
| `/rf/health/*` | `rf-proxy.php` -> `http://127.0.0.1:5005/health/*` |
| `/rf/uploads/*` | Existing files served directly by Apache; missing files fall back to `rf-proxy.php` -> Node |

## 3. Package Layout

After `npm run package:rf`, upload the contents of `dist_production_rf/` into `/rf`:

```text
/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/
├── assets/
├── dist/
├── images/
├── prisma/
├── scripts/
├── src/
├── uploads/                       # Local media files; preserve on repeat deploys
├── .env
├── .env.production.example
├── .htaccess
├── index.html
├── package.json
├── package-lock.json
├── README_DEPLOY.md
└── rf-proxy.php
```

## 4. `.htaccess`

The production `.htaccess` protects backend files, sends API/media/health requests through PHP, and keeps React Router working under `/rf`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /rf/

  RewriteRule ^(\.env|\.git|package\.json|package-lock\.json|prisma|src|node_modules|backend) - [F,L]
  RewriteRule \.(log|sql|md|sh)$ - [F,L]

  RewriteRule ^api/?$ rf-proxy.php?__rf_path=/api [QSA,L]
  RewriteRule ^api/(.*)$ rf-proxy.php?__rf_path=/api/$1 [QSA,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^uploads/?$ rf-proxy.php?__rf_path=/uploads [QSA,L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^uploads/(.*)$ rf-proxy.php?__rf_path=/uploads/$1 [QSA,L]
  RewriteRule ^health/?$ rf-proxy.php?__rf_path=/health [QSA,L]
  RewriteRule ^health/(.*)$ rf-proxy.php?__rf_path=/health/$1 [QSA,L]

  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /rf/index.html [L]
</IfModule>
```

`rf-proxy.php` only allows `/api`, `/health`, and `/uploads` target paths, and forwards methods, query strings, headers, cookies, request bodies, JSON payloads, and multipart media uploads to Node.

## 5. Environment

Create `/rf/.env` from `.env.production.example`:

```env
NODE_ENV=production
PORT=5005

APP_URL="https://demo.wizmonk.com/rf,https://demo.wizmonk.com"
API_URL="https://demo.wizmonk.com/rf"

SERVE_STATIC_CLIENT=true
CLIENT_DIST_PATH="./dist"

DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"

JWT_SECRET="secure-random-32-character-secret-key-here"
JWT_EXPIRES_IN="7d"

STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH="./uploads"
LOCAL_STORAGE_PUBLIC_URL="https://demo.wizmonk.com/rf/uploads"

EMAIL_PROVIDER=json_log
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM_EMAIL="noreply@demo.wizmonk.com"
SMTP_FROM_NAME="Research Factors"
```

## 6. Deployment Steps

On your local machine:

```bash
npm run package:rf
```

Upload all files inside `dist_production_rf/` to:

```text
/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/
```

Important for local media: preserve the server's existing `/rf/uploads` directory during repeat deployments. The package includes local development media from `backend/uploads`, but production may have newer files uploaded by users. Do not delete production-only media unless it has been backed up or migrated to Cloudinary/R2.

On the server:

```bash
cd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf
cp .env.production.example .env
nano .env

npm ci --omit=dev
npx prisma migrate deploy

pm2 start src/server.js --name rf-backend --cwd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf --update-env
pm2 save
pm2 startup
```

If the PM2 process already exists:

```bash
pm2 restart rf-backend --update-env
```

## 7. FastPanel Settings

In **FastPanel -> demo.wizmonk.com -> Settings -> Backend**:

- Keep **Backend type** as `PHP`.
- Keep **Handler** as `Apache module` unless the rest of the site requires otherwise.
- Do not switch the site to Reverse Proxy.
- Ensure PHP cURL is enabled for the active PHP version.

PHP upload settings matter because media uploads pass through `rf-proxy.php`:

```ini
upload_max_filesize = 20M
post_max_size = 25M
max_execution_time = 60
```

Increase those values if media uploads are larger.

## 8. Verification

Run these checks in order:

```bash
curl -i http://127.0.0.1:5005/health/ready
curl -i https://demo.wizmonk.com/rf/health/ready
curl -i https://demo.wizmonk.com/rf/api/v1
curl -i https://demo.wizmonk.com/rf/api/v1/articles
npm run verify:production -- https://demo.wizmonk.com/rf
```

Expected results:

| URL | Expected |
| :--- | :--- |
| `http://127.0.0.1:5005/health/ready` | Node backend is alive and database is connected |
| `https://demo.wizmonk.com/rf/health/ready` | PHP gateway reaches Node |
| `https://demo.wizmonk.com/rf/api/v1` | API base JSON response |
| `https://demo.wizmonk.com/rf/` | React app loads |
| `https://demo.wizmonk.com/rf/.env` | 403 Forbidden |

The `verify:production` script checks the frontend shell, PHP gateway health, API base, articles API, one existing media file, and the protected `auth/me` behavior.

## 9. Functional Production Checklist

Before calling the deployment complete, verify these workflows:

- Public article listing loads without blank states or console API errors.
- Existing media URLs under `/rf/uploads/media/*.webp` return `200` and `image/*`.
- Login and `auth/me` return JSON responses, not HTML.
- Admin media upload succeeds with a new image and returns a public URL under `/rf/uploads/media/`.
- The new uploaded image can be opened directly in the browser.
- Article create/edit with cover image saves and reloads correctly.
- Public article detail page renders cover images and image blocks.
- `/rf/.env`, `/rf/src`, `/rf/prisma`, and `/rf/package.json` are blocked.

## 10. Troubleshooting

### Local Node Works, Public API Fails

If this works:

```bash
curl -i http://127.0.0.1:5005/health/ready
```

but this fails:

```bash
curl -i https://demo.wizmonk.com/rf/health/ready
```

then the issue is PHP gateway, PHP cURL, or `.htaccess`, not Express.

### PHP Gateway Error

Check PHP cURL:

```bash
php -m | grep curl
```

If it is missing, enable cURL in FastPanel for the site's PHP version.

### Public API Returns React HTML

Apache is not applying the generated `.htaccess`, or an old `.htaccess` is deployed. Re-upload `dist_production_rf/.htaccess`.

### Uploads Fail

Check:

- The requested file exists under `/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/uploads/media/`.
- The deployed `.htaccess` includes the upload `RewriteCond %{REQUEST_FILENAME} !-f` rules so Apache serves existing files directly.
- PHP upload limits are high enough for new uploads.
- `rf-proxy.php` exists in `/rf` for missing-file fallback and future upload API requests.
- PHP cURL is enabled.
- For multipart upload forwarding, `rf-proxy.php` must not forward the browser's original multipart `Content-Type` boundary. Use the generated proxy file from this package.

## 11. Production Readiness Notes

- The frontend stays same-origin and calls `https://demo.wizmonk.com/rf/api/v1`.
- Node remains private on `127.0.0.1:5005`.
- The shared domain remains PHP-backed, so other hosted folders are not affected.
- No TypeScript, Next.js, Laravel, or extra microservice architecture is introduced.
- `DATABASE_URL` remains the only database connection setting.
