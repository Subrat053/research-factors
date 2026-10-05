import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '../..');
const backendDir = path.resolve(rootDir, 'backend');
const frontendDistDir = path.resolve(rootDir, 'frontend/dist');
const outputDir = path.resolve(rootDir, 'dist_production_rf');

console.log('🚀 Preparing Production Package for FASTPANEL (/rf subfolder)...');

// 1. Ensure frontend/dist exists
if (!fs.existsSync(frontendDistDir)) {
  console.error('❌ Error: frontend/dist does not exist! Please run "npm run build" in frontend first.');
  process.exit(1);
}

// 2. Prepare clean output directory
if (fs.existsSync(outputDir)) {
  fs.rmSync(outputDir, { recursive: true, force: true });
}
fs.mkdirSync(outputDir, { recursive: true });

// Helper to copy directory recursively
function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// 3. Copy built frontend files into both dist/ AND root of outputDir for dual compatibility
console.log('📦 Copying frontend production assets...');
copyDir(frontendDistDir, path.join(outputDir, 'dist'));
copyDir(frontendDistDir, outputDir);

// 4. Copy backend source code & Prisma schema
console.log('📦 Copying backend source code, schema, and configuration...');
copyDir(path.join(backendDir, 'src'), path.join(outputDir, 'src'));
copyDir(path.join(backendDir, 'prisma'), path.join(outputDir, 'prisma'));
copyDir(path.join(backendDir, 'scripts'), path.join(outputDir, 'scripts'));
const backendUploadsDir = path.join(backendDir, 'uploads');
if (fs.existsSync(backendUploadsDir)) {
  copyDir(backendUploadsDir, path.join(outputDir, 'uploads'));
} else {
  fs.mkdirSync(path.join(outputDir, 'uploads/media'), { recursive: true });
}

// Copy backend package manifest and lockfile for deterministic production installs
fs.copyFileSync(path.join(backendDir, 'package.json'), path.join(outputDir, 'package.json'));
const packageLockPath = path.join(backendDir, 'package-lock.json');
if (fs.existsSync(packageLockPath)) {
  fs.copyFileSync(packageLockPath, path.join(outputDir, 'package-lock.json'));
}

// Copy .htaccess (protects backend files & handles SPA)
const htaccessPath = path.join(rootDir, 'frontend/public/.htaccess');
if (fs.existsSync(htaccessPath)) {
  fs.copyFileSync(htaccessPath, path.join(outputDir, '.htaccess'));
}

// 5. Generate tailored .env.production.example
const envProductionContent = `# ===================================================================
# RESEARCH FACTORS — PRODUCTION ENVIRONMENT (.env)
# Targeted for: https://demo.wizmonk.com/rf
# ===================================================================

NODE_ENV=production
# Internal Node port. Public /rf/api, /rf/health, and /rf/uploads
# are forwarded through rf-proxy.php because the domain backend type stays PHP.
PORT=5005

# Origins allowed to connect via CORS (supports comma-separated):
APP_URL="https://demo.wizmonk.com/rf,https://demo.wizmonk.com"

# API Base URL (used for media URL resolution and public callbacks):
API_URL="https://demo.wizmonk.com/rf"

# Unified Static Serving: Express serves the frontend SPA alongside the API
SERVE_STATIC_CLIENT=true
CLIENT_DIST_PATH="./dist"

# Universal PostgreSQL Connection (Neon Serverless or Local FastPanel Postgres):
# Replace with your actual database connection string:
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public&sslmode=require"

# Authentication Security (Minimum 32 random characters):
JWT_SECRET="generate-a-strong-random-secret-key-at-least-32-characters"
JWT_EXPIRES_IN="7d"

# Storage Provider: local | cloudinary | r2
STORAGE_PROVIDER=local
LOCAL_STORAGE_PATH="./uploads"
LOCAL_STORAGE_PUBLIC_URL="https://demo.wizmonk.com/rf/uploads"

# Optional Cloudinary (if STORAGE_PROVIDER=cloudinary)
# CLOUDINARY_CLOUD_NAME=""
# CLOUDINARY_API_KEY=""
# CLOUDINARY_API_SECRET=""

# Optional Cloudflare R2 (if STORAGE_PROVIDER=r2)
# R2_ACCOUNT_ID=""
# R2_ACCESS_KEY_ID=""
# R2_SECRET_ACCESS_KEY=""
# R2_BUCKET=""
# R2_PUBLIC_URL=""

# Email Notification Provider: json_log | smtp
EMAIL_PROVIDER=json_log
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM_EMAIL="noreply@demo.wizmonk.com"
SMTP_FROM_NAME="Research Factors"
`;

fs.writeFileSync(path.join(outputDir, '.env.production.example'), envProductionContent.trim());

// 6. Generate Quick Setup README
const readmeDeploy = `# Quick FastPanel Deployment Guide for demo.wizmonk.com/rf

This directory contains the production-ready build for Research Factors (Frontend + Backend).

Existing local media from \`backend/uploads\` is included under \`uploads/\`. On repeat deployments, do not delete production-only media from \`/rf/uploads\`.

### Steps to Deploy in FASTPANEL:

1. **Upload Files**:
   Upload the contents of this folder into:
   \`/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/\`
   Keep existing production \`uploads/\` files if the server has media that is not present in this package.

2. **Configure Environment**:
   Inside \`/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/\`:
   \`\`\`bash
   cp .env.production.example .env
   nano .env
   # Update DATABASE_URL and JWT_SECRET
   \`\`\`

3. **Install Dependencies & Apply Migrations**:
   \`\`\`bash
   cd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf
   npm ci --omit=dev
   npx prisma migrate deploy
   \`\`\`

4. **FASTPANEL Backend Setting & Running Node**:
   - In **FASTPANEL -> Site Settings -> Backend**: **Keep "Backend type: PHP"**!
     *(Do NOT change it to Reverse proxy on demo.wizmonk.com, as that would redirect your other sites like gharabadi and hotelior to a single port and break them).*
   - The \`.htaccess\` file inside \`/rf\` routes \`/rf/api/*\` and \`/rf/health/*\` to \`rf-proxy.php\`.
   - Existing \`/rf/uploads/*\` files are served directly by Apache. Missing upload files fall back to \`rf-proxy.php\` so Node returns the correct response.
   - \`rf-proxy.php\` forwards gateway requests to the Node backend on \`http://127.0.0.1:5005\`.
   - PHP cURL extension must be enabled on the site.
   - Start the backend via PM2 (SSH):
   \`\`\`bash
   cd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf
   pm2 start src/server.js --name rf-backend --cwd /var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf --update-env
   pm2 save
   pm2 startup
   \`\`\`

5. **Verify**:
   - Public Website: \`https://demo.wizmonk.com/rf/\`
   - Health Check: \`https://demo.wizmonk.com/rf/health/ready\`
   - API v1: \`https://demo.wizmonk.com/rf/api/v1\`
   - Local Node Check: \`curl -i http://127.0.0.1:5005/health/ready\`
   - PHP Gateway Check: \`curl -i https://demo.wizmonk.com/rf/health/ready\`
   - Full Smoke Test:
   \`\`\`bash
   npm run verify:production -- https://demo.wizmonk.com/rf
   \`\`\`

6. **Media & Upload Requirements**:
   - Existing media must exist under \`/var/www/demo_wizmonk_usr/data/www/demo.wizmonk.com/rf/uploads/media\`.
   - Keep production-only files in \`uploads/\` during repeat deployments.
   - PHP cURL must be enabled.
   - PHP upload limits must be large enough for media uploads:
     \`upload_max_filesize=20M\`, \`post_max_size=25M\`, \`max_execution_time=60\`.

7. **Normalize Legacy Localhost Media URLs**:
   Run once after setting production \`.env\`:
   \`\`\`bash
   npm run db:normalize-media
   pm2 restart rf-backend --update-env
   \`\`\`
   This rewrites old \`http://localhost:5005/uploads/...\` database values to \`https://demo.wizmonk.com/rf/uploads/...\`.
`;

fs.writeFileSync(path.join(outputDir, 'README_DEPLOY.md'), readmeDeploy.trim());

console.log('✅ Production package successfully created at:');
console.log(`   ${outputDir}`);
console.log('   All files are prepared for direct upload to FASTPANEL /rf folder.');
