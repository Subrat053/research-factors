# RESEARCH FACTORS — PLATFORM ARCHITECTURE & DOCUMENTATION SUITE

Welcome to the definitive engineering and product documentation for **Research Factors**, a production-grade research publishing and community digital magazine platform.

---

## Documentation Navigation Matrix

| Document | Topic & Scope | Target Audience |
| :--- | :--- | :--- |
| [01. Architecture & System Design](./01-architecture-and-system-design.md) | Modular monolith architecture, multi-tier layering, request lifecycles, and transaction integrity. | System Architects, Backend Engineers |
| [02. Tech Stack & Conventions](./02-tech-stack-and-conventions.md) | React (JS), Express (JS), Tailwind, Vite, Prisma, and codebase organization standards. | Full-Stack Engineers |
| [03. Database Schema & ERD](./03-database-schema-and-erd.md) | PostgreSQL schema, Prisma models, foreign keys, composite indexes, and data integrity. | Backend & Database Engineers |
| [04. Roles, Permissions & RBAC](./04-roles-permissions-and-rbac.md) | Granular permission catalog, role definitions, ownership verification, and security middleware. | Security & Backend Engineers |
| [05. Article & Block Editor Engine](./05-article-and-block-engine.md) | Tiptap integration, JSON block structures, autosave debouncing, and editorial state transitions. | Frontend & Content Engineers |
| [06. Media & Storage Abstraction](./06-media-storage-abstraction.md) | Zero-coupling `StorageFactory`, Local/Cloudinary/R2 adapters, Sharp processing, and security. | Infrastructure & Backend Engineers |
| [07. Community & Moderation](./07-community-and-moderation.md) | Nested comments (depth-limited), voting, reporting, moderation queues, and notification dispatch. | Full-Stack Engineers |
| [08. SEO, Performance & Editorial UI](./08-seo-performance-and-public-ui.md) | Magazine-grade typography, SEO prerendering, Open Graph, dynamic sitemaps, and slug redirection. | Frontend & Growth Engineers |
| [09. API Specifications & Contracts](./09-api-specifications-and-contracts.md) | REST API routes (`/api/v1/*`), uniform response envelopes, DTOs, and error catalogs. | API Developers & Integrators |
| [10. Security, Anti-Spam & Compliance](./10-security-anti-spam-and-compliance.md) | OWASP hardening, content sanitization, rate limiting, secure cookies, and privacy controls. | Security Engineers & DevOps |
| [11. Edge Cases & Resilience Playbook](./11-edge-cases-and-resilience-playbook.md) | 20+ year veteran analysis of concurrency, race conditions, failovers, and failure recovery. | Lead Engineers & SREs |
| [12. Setup, Testing & Deployment](./12-setup-testing-and-deployment-guide.md) | Local environment bootstrap, Docker Compose, unit/integration/contract test suites, and CI/CD. | All Engineers & DevOps |
| [13. PRD Compliance & Gap Analysis](./13-prd-checklist-and-gap-analysis.md) | Audit of all 147 PRD requirements: Applied vs Left to Implement, Phase map, and edge cases. | Product Owners & Lead Architects |
| [14. Offline Fallback Data Registry](./14-offline-fallback-data-registry.md) | Zero-blank-screen offline dataset registry, even-count rules, component mapping, and decoupling guide. | Frontend & Full-Stack Engineers |
| [15. Frontend Design & Typography System](./15-frontend-design-and-typography-system.md) | Pure native system UI typography, root-first type scale, heading/body hierarchy, and legacy cleanup. | Frontend & UI/UX Engineers |
| [16. Recommendation Engine & Personalization](./16-recommendation-engine-and-personalization.md) | 10-dimension normalized scoring, candidate pooling, Like/Dislike feedback, format affinity, and journeys. | Machine Learning & Recommendation Engineers |

---

## Core Product Vision & Value Proposition

Research Factors bridges the gap between deep analytical research and accessible digital journalism. It is designed to look, feel, and read like premier editorial publications (e.g. *The Atlantic*, *The New Yorker*, *Nature*, *Wired*), while offering rich, extensible content blocks (comparison tables, callouts, data charts, galleries) and a respectful, moderated reader community.

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│   RESEARCHER    │ ────> │    EDITORIAL    │ ────> │  PUBLIC READER  │
│  Drafts blocks  │       │ Reviews/Publishes│      │ Reads & Shares  │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │    COMMUNITY    │
                                                    │Comments & Debates│
                                                    └─────────────────┘
                                                             │
                                                             ▼
                                                    ┌─────────────────┐
                                                    │   MODERATION    │
                                                    │Audits & Shields │
                                                    └─────────────────┘
```

---

## Quick Reference: Operational Directives

1. **JavaScript Exclusivity**: The frontend is built strictly in **React.js (JavaScript, JSX)** with Vite and Tailwind CSS. The backend is built strictly in **Node.js/Express.js (JavaScript)**. No TypeScript.
2. **PostgreSQL Universal Portability**: Zero hardcoded DB configurations. A single `DATABASE_URL` environment variable works seamlessly across local Docker, Neon serverless, and cloud Postgres.
3. **Storage Provider Independence**: Swapping storage between `local`, `cloudinary`, and `r2` requires zero code modifications—only environment variable updates.
4. **Centralized RBAC**: Permissions are assigned to roles and checked via declarative middleware (`requirePermission('article.publish')`).
