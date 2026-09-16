# 02. TECH STACK & CODEBASE CONVENTIONS

## 1. Approved Technology Stack (Strictly Latest LTS / Stable)

### Frontend Application
- **Runtime & Language**: React 18.3+ utilizing pure **JavaScript (`.jsx`, `.js`)**. TypeScript is explicitly disallowed per PRD specification.
- **Build Tooling**: Vite 5.2+ for lightning-fast HMR and optimized production bundling.
- **Client Routing**: React Router v6.23+ with nested layouts, loaders, and declarative route guards.
- **Styling**: Tailwind CSS 3.4+ configured with an editorial typography scale, custom serif/sans font pairings, and dark-mode CSS variables.
- **Server State & Caching**: TanStack Query v5.38+ (`@tanstack/react-query`) with automatic background refetching, query key factories, and optimistic updates.
- **Form Management**: React Hook Form 7.51+ combined with `@hookform/resolvers/zod` (Zod 3.23+) for zero-re-render form validation.
- **Rich Text / Block Editor**: Tiptap v2.4+ (`@tiptap/react`, `@tiptap/starter-kit`, `@tiptap/extension-table`, `@tiptap/extension-image` for modular block editing).
- **Icons**: Lucide React 0.380+ (`lucide-react`) for a clean, consistent modern UI.
- **HTTP Client**: Axios 1.7+ configured with standard base URL, credentials inclusion (`withCredentials: true`), and response/error interceptors.
- **SEO Head Management**: `react-helmet-async` 2.0+ for dynamic document metadata and canonical links.
- **AI Agent Visual Feedback**: `agentation` 3.0+ mounted conditionally in development (`import.meta.env.DEV`) for visual UI element inspection, annotations, and structured context for coding agents.

### Backend Application
- **Runtime & Language**: Node.js (v20.x LTS / v22.x LTS) utilizing pure **JavaScript (`.js`)** with ES Modules (`"type": "module"`).
- **Web Framework**: Express.js 4.19+ (or 5.x stable).
- **ORM & Data Modeling**: Prisma ORM 5.15+ with PostgreSQL client.
- **Database**: PostgreSQL 16+ (Universal connection via `DATABASE_URL` for local Docker, Neon, or Managed Cloud PostgreSQL).
- **Storage Abstraction**: Native factory supporting Local disk, Cloudinary (v2.2+), and Cloudflare R2 (via AWS S3 SDK v3 `@aws-sdk/client-s3` 3.590+).
- **Image Processing**: Sharp 0.33+ (`sharp`) for on-the-fly resizing, WebP conversion, dimension inspection, and thumbnail generation.
- **Validation**: Zod 3.23+ for compile-time/runtime request validation.
- **Security & Utilities**:
  - `argon2` 0.40+ / `bcryptjs` 2.4+ for high-security password hashing.
  - `jsonwebtoken` 9.0+ for stateless access tokens + HttpOnly session cookies.
  - `helmet` 7.1+ for HTTP security headers.
  - `cors` 2.8+ with strict origin whitelisting.
  - `express-rate-limit` 7.2+ for DDoS and brute-force mitigation.
  - `sanitize-html` 2.13+ for XSS defense against rich text blocks.
  - `winston` 3.13+ and `morgan` 1.10+ for JSON log streaming.
- **Job Queue (Optional / Graceful)**: BullMQ 5.8+ + Redis 7+ for asynchronous email dispatch and scheduled article publishing.

### Editorial Color Palette Specification
To maintain an authoritative, uncluttered publication appearance, styling adheres strictly to four color families:
1. **White**: `#FFFFFF` / Paper `#F8FAFC` / Soft Cream `#FAFAF9` (Main canvas, cards, typography in dark mode).
2. **Black**: `#09090B` / Slate `#0F172A` / Charcoal `#18181B` (Headings, body prose, dark mode surfaces, high contrast borders).
3. **Blue**: `#1E40AF` / `#1D4ED8` / Deep Academic Navy `#0F2B5C` (Brand primary, interactive buttons, links, active tabs, progress bars).
4. **Red (Minimal)**: `#DC2626` / `#B91C1C` / Crimson `#991B1B` (Alerts, rejection feedback, destructive actions; strictly <5% visual presence).

---

## 2. Directory & File Structure

The project is structured as a clear mono-repository or unified multi-tier project:

```
ResearchFactor/
├── .agents/                      # Workspace customization and agent rules
│   └── rules/
│       └── coding_standards.md
├── AGENTS.md                     # Root operational directives for coding agents
├── Requirements/
│   └── prd.md                    # Master PRD specification
├── docs/                         # Comprehensive engineering documentation
│   ├── README.md
│   ├── 01-architecture-and-system-design.md
│   ├── ...
├── backend/                      # Node.js + Express backend service
│   ├── prisma/
│   │   ├── schema.prisma         # Single source of truth for database schema
│   │   ├── migrations/           # Versioned migration history
│   │   └── seed.js               # Dev seed data (Admin, Editors, Articles)
│   ├── src/
│   │   ├── config/               # Centralized configuration (env validation)
│   │   │   ├── app.config.js
│   │   │   ├── db.config.js
│   │   │   ├── auth.config.js
│   │   │   ├── storage.config.js
│   │   │   └── email.config.js
│   │   ├── middleware/           # Cross-cutting middlewares
│   │   │   ├── authenticate.js
│   │   │   ├── authorize.js      # Centralized RBAC permission checks
│   │   │   ├── validate.js       # Zod validation middleware
│   │   │   ├── rateLimiter.js
│   │   │   ├── errorHandler.js
│   │   │   └── requestId.js
│   │   ├── modules/              # Domain-driven feature modules
│   │   │   ├── auth/
│   │   │   ├── users/
│   │   │   ├── authors/
│   │   │   ├── articles/
│   │   │   │   ├── article.controller.js
│   │   │   │   ├── article.service.js
│   │   │   │   ├── article.routes.js
│   │   │   │   ├── article.validator.js
│   │   │   │   └── article.dto.js
│   │   │   ├── comments/
│   │   │   ├── categories/
│   │   │   ├── tags/
│   │   │   ├── media/
│   │   │   ├── notifications/
│   │   │   ├── search/
│   │   │   └── admin/
│   │   ├── storage/              # Storage Provider Abstraction Layer
│   │   │   ├── StorageProvider.js  (Interface)
│   │   │   ├── StorageFactory.js
│   │   │   └── providers/
│   │   │       ├── LocalStorageProvider.js
│   │   │       ├── CloudinaryStorageProvider.js
│   │   │       └── R2StorageProvider.js
│   │   ├── email/                # Email service abstraction
│   │   │   ├── EmailService.js
│   │   │   └── templates/
│   │   ├── utils/                # Pure utility functions (slugify, pagination)
│   │   ├── app.js                # Express app configuration & middleware mount
│   │   └── server.js             # HTTP listener & graceful shutdown hooks
│   ├── .env.example
│   └── package.json
└── frontend/                     # Vite + React frontend application
    ├── public/                   # Static icons, favicon, robots.txt
    ├── src/
    │   ├── assets/               # Local fonts, brand vectors
    │   ├── components/
    │   │   ├── common/           # Atoms: Button, Input, Modal, Badge, Toast
    │   │   ├── layout/           # Header, Footer, Sidebar, Container, Section
    │   │   ├── article/          # ArticleCard, BlockRenderer, TableOfContents
    │   │   ├── editor/           # Tiptap modular editor & custom block tools
    │   │   ├── comments/         # CommentThread, CommentItem, ReplyBox
    │   │   └── feedback/         # SkeletonLoader, EmptyState, ErrorBanner
    │   ├── pages/
    │   │   ├── public/           # Home, ResearchListing, ArticleView, CategoryView
    │   │   ├── auth/             # Login, Register, ForgotPassword, ResetPassword
    │   │   ├── account/          # Profile, Bookmarks, NotificationCenter
    │   │   ├── author/           # AuthorDashboard, ArticleEditor, DraftPreview
    │   │   └── admin/            # AdminDashboard, UserList, ModerationQueue
    │   ├── hooks/                # Custom React hooks (useAuth, useDebounce)
    │   ├── services/             # API client services (articlesApi, authApi)
    │   │   ├── api.client.js     # Axios instance with interceptors
    │   │   └── ...
    │   ├── context/              # UI context (ThemeContext, ToastContext)
    │   ├── routes/               # AppRoutes with ProtectedRoute wrapper
    │   ├── utils/                # Formatting, reading time, sanitization
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css             # Tailwind base and custom editorial styles
    ├── .env.example
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

---

## 3. Naming Conventions & Code Style

- **Files and Directories**:
  - React components: `PascalCase.jsx` (e.g. `ArticleCard.jsx`, `TableBlock.jsx`).
  - Hooks: `camelCase.js` prefixed with `use` (e.g. `useArticleQuery.js`).
  - Backend modules: `domain.entity.type.js` (e.g. `article.service.js`, `article.validator.js`).
  - Directories: `kebab-case` or lowercase (e.g. `article-editor/`, `modules/`).
- **Database Names**:
  - Prisma models: `PascalCase` singular (`Article`, `ArticleBlock`, `User`).
  - Database tables (mapped via `@@map`): `snake_case` plural (`articles`, `article_blocks`, `users`).
  - Columns: `camelCase` in Prisma schema, mapped to `snake_case` in SQL (`createdAt` -> `created_at`).
- **Variables & Functions**:
  - Variables and functions: `camelCase` (e.g. `calculateReadingTime`).
  - Constants & Enums: `UPPER_SNAKE_CASE` (e.g. `ARTICLE_STATUS.PENDING_REVIEW`).

---

## 4. State Management Guidelines

To prevent state bloat and synchronization bugs, state is partitioned cleanly:
1. **Server State (TanStack Query)**:
   - All external data (articles, categories, user profiles, comments, notifications) is fetched and cached via `useQuery` and mutated via `useMutation`.
   - Never mirror query results into local `useState`.
2. **Form State (React Hook Form)**:
   - All input fields, validation states, and submission tracking are managed by React Hook Form.
3. **Transient UI State (Local React `useState`)**:
   - Modals open/closed, dropdown toggles, active tabs, and temporary filters.
4. **Global UI Context (React Context API)**:
   - Authenticated user session state (`AuthContext`).
   - Active toast alerts (`ToastContext`).
   - Theme preference (`ThemeContext`).
