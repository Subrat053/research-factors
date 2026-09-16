# RESEARCH FACTORS — CODING AGENT RULES & OPERATIONAL DIRECTIVES

These directives are permanently active for all coding agents operating within this repository. Every agent must strictly uphold these rules without exception.

---

## 1. NON-NEGOTIABLE CORE CONSTRAINTS

1. **Language & Framework Enforcement**:
   - **Frontend**: React.js with pure **JavaScript (`.jsx`, `.js`)**. **STRICTLY NO TypeScript**.
   - **Styling**: Tailwind CSS with custom editorial design tokens. Use Vanilla CSS for custom keyframes and typography polish where required.
   - **Tooling**: Vite (build & dev server), React Router v6+, TanStack Query (server state), React Hook Form + Zod (forms & validation), Lucide React (icons), Tiptap (rich article block editor).
   - **STRICTLY FORBIDDEN**: Next.js, TypeScript, Laravel, PHP, Filament, and unnecessary microservice architectures.
   - **Backend**: Node.js with Express.js using pure **JavaScript (`.js`)**.
   - **Database & ORM**: PostgreSQL managed via **Prisma ORM**.

2. **Single Database Connection (`DATABASE_URL`)**:
   - The application MUST rely solely on `DATABASE_URL`.
   - The code must NEVER contain provider-specific connection switches (e.g., no `if (isNeon)` or `if (isLocal)`).
   - Works identically across Local PostgreSQL, Neon Serverless Postgres, and Managed Production PostgreSQL servers.

3. **Storage Provider Abstraction Layer**:
   - Zero coupling to Cloudinary, AWS S3, Cloudflare R2, or local disks in controllers, services, or UI components.
   - All media interactions must pass through `MediaService` and the `StorageFactory` returning a unified `StorageProvider` interface (`upload`, `delete`, `getUrl`, `getPublicUrl`, `exists`, `getMetadata`).
   - Provider switching is controlled exclusively via `STORAGE_PROVIDER=local|cloudinary|r2` in environment variables.

4. **Centralized RBAC & Resource Ownership**:
   - Centralized permissions (e.g. `article.publish`, `comment.moderate`, `category.delete`).
   - NEVER scatter hardcoded role checks like `if (user.role === 'admin')` across routes or controllers.
   - Strict resource ownership verification on every mutating endpoint: Authors cannot modify, delete, or submit another author's draft under any circumstances.

5. **Data Privacy & DTO Serialization**:
   - NEVER return raw Prisma database model objects in API responses.
   - Always run responses through explicit Data Transfer Object (DTO) serializers to strip `passwordHash`, private email addresses, internal system flags, or sensitive tokens.

6. **Content Sanitization & Safety**:
   - All rich text blocks and comment content must be strictly sanitized using server-side sanitization (e.g., `sanitize-html` with a strict allowlist of semantic tags).
   - Never store or execute arbitrary `<script>`, unapproved `<iframe>`, or inline event handlers.

---

## 2. ARCHITECTURAL PATTERNS

- **Modular Monolith**:
  - Code is grouped by domain modules (`auth`, `articles`, `comments`, `categories`, `media`, `users`, `notifications`, `search`, `admin`).
- **Strict Layer Separation**:
  - `Route` -> `Validation Middleware (Zod)` -> `Authentication & Authorization Middleware` -> `Controller` -> `Service` -> `Prisma`.
  - Controllers must remain razor-thin (parse request -> invoke service -> format DTO response).
  - Business rules, state transitions, and calculations live exclusively in the `Service` layer.
- **Transactions & Concurrency**:
  - Use Prisma interactive transactions (`prisma.$transaction`) for multi-entity writes (e.g., publishing an article + updating slug history + creating audit log + dispatching notifications).
  - Protect against race conditions using database unique constraints (slugs, bookmarks, comment likes).

---

## 3. DESIGN & USER EXPERIENCE PRINCIPLES

- **Editorial Elegance**:
  - The public site must look and feel like an elite digital magazine/newspaper (such as *The Atlantic*, *The New Yorker*, or *Wired*), featuring refined typography, generous line-height, balanced hierarchy, and comfortable reading widths (max ~68-72ch for article prose).
  - Modern, muted, high-contrast editorial color palette with dark/light mode elegance.
- **Resilience & Feedback**:
  - Every asynchronous view must feature dedicated Skeleton loading states, graceful Error states with retry triggers, and thoughtful Empty states.
  - Zero blank screens during data fetching.

---

## 4. DEFINITION OF DONE (DOD) FOR ALL COMMITS

Before considering any task or feature complete, verify:
1. Backend route, controller, service, and Zod validator are implemented.
2. Centralized RBAC permission check and resource ownership check are enforced.
3. Database migration is generated and verified without data loss.
4. Response is serialized through a safe DTO serializer.
5. Frontend UI includes Loading (Skeleton), Error, Empty, and Interactive states.
6. Mobile responsiveness and keyboard accessibility are verified.
7. Unit or integration test coverage covers the critical paths and edge cases.
8. No linting or runtime errors exist.
9. Always update the docs if you modify the existing feature or add new feature such that doc and actual implementation should always equal.
10. define roadmap if something left that you have not completed.