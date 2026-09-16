# 01. ARCHITECTURE & SYSTEM DESIGN

## 1. Executive Summary & Architectural Philosophy

Research Factors is engineered as a **Modular Monolith** in pure JavaScript. This architectural choice maximizes initial developer velocity, eliminates the network overhead and serialization latency of premature microservices, and guarantees strict ACID transaction boundaries across core entities.

Every subsystem (Articles, Comments, Moderation, Media, Auth) is cleanly isolated into cohesive modules with explicit interfaces. This guarantees that if a specific domain (e.g. Media processing or Search) requires horizontal scaling or service extraction in the future, it can be decoupled cleanly without refactoring the entire codebase.

---

## 2. High-Level System Architecture

```
                                  [ CLOUDFLARE ]
                           CDN / WAF / Edge SSL / DNS
                                        │
                    ┌───────────────────┴───────────────────┐
                    │ HTTP/HTTPS                            │ Static Assets / Media
                    ▼                                       ▼
        ┌─────────────────────────┐               ┌───────────────────┐
        │  CLIENT (Vite + React)  │               │   STORAGE CDN     │
        │  - React Router v6      │               │   (Cloudinary /   │
        │  - TanStack Query v5    │               │    R2 / Local)    │
        │  - Tailwind CSS         │               └───────────────────┘
        │  - Tiptap Block Editor  │                         ▲
        └─────────────────────────┘                         │
                    │ REST API Calls                        │
                    ▼                                       │
        ┌─────────────────────────────────────────────────────────────┐
        │                 EXPRESS.JS API (NODE.JS)                    │
        │                                                             │
        │  [Global Middlewares]                                       │
        │   Helmet • CORS • Request-ID • Morgan/Winston • Rate Limiter│
        │                                                             │
        │  [Route Layer] ──> [Zod Validation] ──> [Auth & RBAC]      │
        │                                                             │
        │  [Controllers] (Thin: request parsing & response packaging) │
        │                                                             │
        │  [Service Layer] (Pure business logic & transactions)       │
        │   • AuthService        • ArticleService                     │
        │   • CommentService     • ModerationService                  │
        │   • MediaService (StorageFactory)                           │
        │   • EmailService       • NotificationService                │
        │                                                             │
        │  [Data Layer]                                               │
        │   • Prisma Client (Connection Pooling & Type Mapping)       │
        └─────────────────────────────────────────────────────────────┘
                    │                                 │
                    ▼                                 ▼
        ┌───────────────────────┐         ┌───────────────────────────┐
        │ POSTGRESQL DATABASE   │         │    REDIS / BULLMQ         │
        │ - Relational tables   │         │ (Optional / Graceful)     │
        │ - JSONB ArticleBlocks │         │ - Rate-limit store        │
        │ - Full-Text Search TS │         │ - Scheduled article pub   │
        │ - Composite indexes   │         │ - Email queue             │
        └───────────────────────┘         └───────────────────────────┘
```

---

## 3. Layered Separation of Concerns

To maintain long-term maintainability, the application follows a strict unidirectional data flow. Code never bypasses intermediate layers:

```
Request (HTTP)
   │
   ▼
1. Router (/api/v1/articles)
   │
   ▼
2. Validation Middleware (validateRequest(createArticleSchema))
   │ (Rejects malformed input before any compute is wasted)
   ▼
3. Authentication & RBAC (authenticate, requirePermission('article.create'))
   │ (Resolves session token, loads user permissions, verifies resource access)
   ▼
4. Controller (ArticleController.create)
   │ (Extracts body, params, and user context. Calls service. Packages DTO)
   ▼
5. Service Layer (ArticleService.createArticle)
   │ (Coordinates business rules, slug generation, block validation, transactions)
   ▼
6. Data Access / ORM (prisma.article.create, prisma.articleBlock.createMany)
   │ (Executes parameterized SQL via Prisma within an interactive transaction)
   ▼
7. Response Serializer (ArticleDTO.toPublic)
   │ (Strips all private, sensitive, or internal metadata)
   ▼
Response (JSON { success: true, data: { ... } })
```

### Layer Responsibilities

1. **Route Layer**: Declares URL paths, maps HTTP verbs, and attaches middleware pipelines. Never contains inline handlers or queries.
2. **Validation Middleware**: Uses **Zod** to validate `req.body`, `req.query`, and `req.params`. Automatically transforms and strips unexpected fields.
3. **Authorization & Policies**: Verifies both global permissions (e.g. `article.edit_any`) and entity-level ownership (e.g. `article.authorId === user.id`).
4. **Controllers**: Pure orchestrators. Must be under ~25-40 lines per action. They parse incoming data, invoke a service method, pass the result to a DTO serializer, and return standard JSON.
5. **Services**: The heart of the platform. All business logic, workflow state transitions, slug collision resolution, and audit log generation reside here.
6. **Data Access (Prisma)**: Manages database interactions, foreign keys, and atomic `$transaction` blocks.

---

## 4. Multi-Tier Error Handling & Request Tracing

### Request ID Tracking
Every incoming request is assigned an `X-Request-Id` UUID via middleware (`crypto.randomUUID()`). If the client passes an `X-Request-Id` header, it is validated and propagated. This ID is:
- Attached to `req.id`.
- Included in every structured log line via Winston.
- Returned in the HTTP response headers.
- Returned inside the error envelope when an unhandled exception occurs for seamless troubleshooting.

### Standardized Error Envelope
Errors are captured by a centralized error-handling middleware (`errorHandler.js`). Stack traces are stripped in production environments.

```json
{
  "success": false,
  "error": {
    "code": "SLUG_ALREADY_EXISTS",
    "message": "The specified article slug is already in use.",
    "requestId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "details": [
      {
        "field": "slug",
        "issue": "Must be globally unique"
      }
    ]
  }
}
```

---

## 5. Transaction Boundaries & Concurrency Control

Complex business events require multiple database writes that must succeed or fail atomically. We utilize Prisma interactive transactions:

```javascript
// Example: Publishing an article
await prisma.$transaction(async (tx) => {
  // 1. Update article status
  const updatedArticle = await tx.article.update({
    where: { id: articleId },
    data: { status: 'PUBLISHED', publishedAt: new Date() },
  });

  // 2. Record slug history for SEO redirects
  await tx.articleSlugHistory.upsert({
    where: { slug: updatedArticle.slug },
    update: { articleId: updatedArticle.id },
    create: { slug: updatedArticle.slug, articleId: updatedArticle.id },
  });

  // 3. Create audit trail
  await tx.auditLog.create({
    data: {
      actorId: editorUser.id,
      action: 'ARTICLE_PUBLISH',
      entityType: 'Article',
      entityId: articleId,
      metadata: { previousStatus: 'APPROVED' },
    },
  });

  // 4. Dispatch notification to author
  await tx.notification.create({
    data: {
      userId: updatedArticle.authorId,
      type: 'ARTICLE_PUBLISHED',
      title: 'Your article has been published',
      message: `"${updatedArticle.title}" is now live to the public.`,
      entityId: articleId,
    },
  });
});
```

---

## 6. Health Checks & Graceful Termination

To support zero-downtime deployments and container orchestrators, two health endpoints are exposed:
- `GET /health/live`: Fast liveness check verifying the HTTP server is responsive.
- `GET /health/ready`: Deep readiness check validating PostgreSQL database connectivity and Redis availability (if enabled). Returns 503 if the database is unreachable.

### Graceful Termination Process
When receiving `SIGTERM` or `SIGINT`:
1. Stop accepting new HTTP requests (`server.close()`).
2. Allow ongoing in-flight requests a grace period (e.g. 10 seconds) to complete.
3. Terminate active BullMQ job workers.
4. Close Prisma client connections (`await prisma.$disconnect()`).
5. Close Redis client connections (`await redis.quit()`).
6. Exit process cleanly with code 0.
