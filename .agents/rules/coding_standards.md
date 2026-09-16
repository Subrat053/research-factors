---
title: Coding Standards & Agent Constraints
description: Mandatory development principles, architecture guidelines, color system, and forbidden technologies for Research Factors.
---

# CODING STANDARDS & AGENT CONSTRAINTS

When generating or editing code for **Research Factors**, the agent MUST comply with the following principles:

## 1. Explicit Prohibitions
- **DO NOT** use TypeScript. The codebase is purely JavaScript (`.jsx` for React, `.js` for Node/Express).
- **DO NOT** use Next.js. The frontend is a single-page React app built with Vite.
- **DO NOT** use PHP, Laravel, or Filament.
- **DO NOT** use ad-hoc inline SQL queries or unescaped string interpolations.
- **DO NOT** hardcode database configurations (port, host, ssl) or check for Neon vs Local inside logic. Rely solely on `DATABASE_URL`.
- **DO NOT** scatter `user.role === 'admin'` checks across routes. Use central RBAC middleware `requirePermission('permission.name')`.
- **DO NOT** return raw Prisma records in public API endpoints. Always use DTO serializers.

## 2. Mandatory Tech Stack Patterns (Latest Stable / LTS Only)
- **Frontend**:
  - React 18.3+ (JavaScript / JSX)
  - Vite 5.2+ (Fast HMR build tool)
  - React Router v6.23+ (Client routing & data loaders)
  - Tailwind CSS 3.4+ + Vanilla CSS custom utilities
  - TanStack Query v5.38+ (Server state caching & invalidation)
  - React Hook Form 7.51+ + Zod 3.23+ (Zero-overhead form validation)
  - Tiptap v2.4+ (`@tiptap/react`, `@tiptap/starter-kit` for modular block editing)
  - Lucide React 0.380+ (Modern iconography)
  - Axios 1.7+ (Centralized API client with interceptors)
  - React Helmet Async 2.0+ (Dynamic SEO head metadata)

- **Backend**:
  - Node.js v20+ LTS / v22+ LTS + Express.js 4.19+ (Modular Monolith)
  - Prisma ORM 5.15+ + PostgreSQL
  - StorageProvider abstraction (`LocalStorageProvider`, `CloudinaryStorageProvider`, `R2StorageProvider`)
  - Sharp 0.33+ for server-side image optimization & WebP transformation
  - Zod 3.23+ for request schema validation (Body, Query, Params)
  - Winston 3.13+ / Morgan 1.10+ for structured JSON logging with Correlation IDs (`X-Request-Id`)
  - Helmet 7.1+, CORS 2.8+, and Express-Rate-Limit 7.2+ for security and DDoS mitigation
  - Argon2 0.40+ / bcryptjs 2.4+ for secure password hashing
  - jsonwebtoken 9.0+ with HttpOnly cookies

## 3. Mandatory Color System & UI Aesthetics
The visual identity must embody an authoritative editorial publication using a disciplined color palette:
- **White (`#FFFFFF` / Warm Paper `#F8FAFC` / `#FAFAF9`)**: Clean, spacious editorial background, pristine readability, card surfaces.
- **Black (`#09090B` / Deep Ink `#0F172A` / `#18181B`)**: Crisp typography, high-contrast headings, borders, dark mode backgrounds.
- **Blue (`#1E40AF` / `#1D4ED8` / Deep Academic Blue `#0F2B5C`)**: Primary accent, links, active tabs, primary buttons, category badges, reading progress bar.
- **Red (`#DC2626` / `#B91C1C` / Crimson `#991B1B` - USED SPARINGLY)**: Subtle alert badges, rejection notices, delete/destructive actions, breaking news indicators. Never dominate the page.

## 4. Storage Abstraction Contract
Never call vendor SDKs (e.g. Cloudinary, AWS S3, Google Cloud) directly from controllers or business services.
Always invoke `MediaService`, which resolves the configured provider through `StorageFactory`:
```javascript
// Correct pattern:
const storage = StorageFactory.getProvider();
const result = await storage.upload(buffer, metadata);
```

## 5. Definition of Done (DoD)
1. Backend route, controller, service, and Zod validator are implemented.
2. Centralized RBAC permission check and resource ownership check are enforced.
3. Database migration is generated and verified without data loss.
4. Response is serialized through a safe DTO serializer.
5. Frontend UI includes Loading (Skeleton), Error, Empty, and Interactive states.
6. Mobile responsiveness and keyboard accessibility are verified.
7. Unit or integration test coverage covers the critical paths and edge cases.
8. No linting or runtime errors exist.
9. Always update the docs if you modify an existing feature or add a new feature such that doc and actual implementation are always equal.
10. Define roadmap if something left that has not been completed.
