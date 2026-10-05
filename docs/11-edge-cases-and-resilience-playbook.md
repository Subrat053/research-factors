# 11. EDGE CASES & RESILIENCE PLAYBOOK

## 1. Executive Perspective: 20+ Year Veteran Analysis

In twenty-plus years of building production web systems, catastrophic failures rarely stem from high-level architectural drawings—they stem from unhandled edge cases, subtle concurrency races, and resource lifecycle leaks. 

This document defines the exact defensive mitigations implemented across Research Factors to guarantee high availability, data integrity, and resilience under real-world conditions.

---

## 2. Deep-Dive Edge Case Analysis & Solutions

### Edge Case 1: Concurrent Slug Collisions
- **The Hazard**: Two authors simultaneously publish articles titled *"The Future of Solid-State Batteries"*. Both generate the slug `the-future-of-solid-state-batteries`. Without atomic locking, both might pass a `findUnique` check and fail at insertion with a database unique constraint violation.
- **The Solution**: 
  1. Use PostgreSQL unique constraint on `articles(slug)`.
  2. The slug generation utility executes a loop with an atomic advisory lock or catches code `P2002` (Prisma unique constraint failure) and automatically appends an incrementing counter (`-2`, `-3`) before completing the transaction.

### Edge Case 2: Orphaned Media Assets & Storage Bleed
- **The Hazard**: An author uploads 10 high-resolution images into the editor, then navigates away or abandons the draft. Over months, gigabytes of abandoned assets accumulate in Cloudinary/R2, inflating cloud storage costs.
- **The Solution**:
  1. The `Media` table records `createdById` and `createdAt`.
  2. When an article is saved, all referenced `mediaId`s are linked.
  3. A nightly BullMQ background cleanup job scans for `Media` records created > 48 hours ago that are not referenced in any `Article` (draft or published) and have no associated cover image. These orphaned records are pruned from storage and the database.

### Edge Case 3: Network Interruption During Autosave
- **The Hazard**: An author writes 500 words on an unstable mobile connection. The debounced autosave fails silently due to a timeout. The author closes their tab believing their work was preserved.
- **The Solution**:
  1. Frontend maintains a local fallback in browser `IndexedDB` or `localStorage` tagged with `article_draft_${id}`.
  2. If the network drops, the status badge turns amber/red: *"Offline — Changes saved locally to device"*.
  3. When connectivity restores, TanStack Query triggers an automatic re-sync.
  4. On page load, if local storage contains content newer than the server timestamp, the UI prompts: *"A newer local version of this draft was found. Would you like to restore it?"*

### Edge Case 4: Double-Click & Rapid Re-Submission
- **The Hazard**: An impatient reader clicks the "Post Comment" or "Like" button 5 times in rapid succession, resulting in duplicate entries or negative counters.
- **The Solution**:
  1. **Frontend**: The button is immediately disabled upon click with a subtle spinner until the promise resolves.
  2. **Database**: `CommentLike` uses a composite primary key `@@id([userId, commentId])`. Consecutive inserts fail harmlessly with `409 Conflict` or are handled idempotently via `upsert`.

### Edge Case 5: Role Revocation Mid-Session (JWT Invalidation)
- **The Hazard**: An editor's privileges are revoked or their account is suspended, but their stateless JWT token remains valid for another 2 hours, allowing unauthorized publishes.
- **The Solution**:
  1. The `authenticate` middleware caches user status and roles with a short TTL (e.g. 60 seconds) in Redis or executes a lightweight indexed lookup (`SELECT status, updated_at FROM users WHERE id = ?`).
  2. If the user's `status === 'SUSPENDED'` or `role` was altered after the token's issued-at (`iat`) timestamp, the request is immediately rejected with `401 TOKEN_REVOKED`.

### Edge Case 6: Infinite Cycles or Deep Nesting in Comments
- **The Hazard**: A malicious user sends an API payload setting a comment's `parentId` to its own ID, or creates a circular chain (`A -> B -> C -> A`), crashing tree recursion.
- **The Solution**:
  1. Disallow `parentId === commentId` at the database and validator level.
  2. Strict depth enforcement: A comment can only have `parentId` set to a root comment (depth = 0). It is physically impossible to create comments at depth >= 2.

### Edge Case 7: Deletion of Categories/Authors with Active Articles
- **The Hazard**: An admin deletes the "Technology" category or an author's account. Existing published articles referencing that foreign key crash or become orphaned.
- **The Solution**:
  1. Prisma enforces `onDelete: Restrict` on `Article.categoryId` and `Article.authorId`.
  2. Attempting to delete a category that contains articles returns `400 BAD_REQUEST: "Cannot delete category containing active articles. Reassign articles first."`
  3. User accounts are soft-deleted or marked `status: 'DEACTIVATED'` rather than physically deleted.

### Edge Case 8: PostgreSQL Connection Pool Exhaustion (Neon / Serverless)
- **The Hazard**: A viral article attracts 50,000 concurrent page requests. Serverless database instances exhaust available connection limits, throwing `FATAL: remaining connection slots are reserved for non-replication superuser connections`.
- **The Solution**:
  1. Enable connection pooling (`pgbouncer` or Neon pooled connection string `?sslmode=require&pgbouncer=true`).
  2. Express server initializes a single shared PrismaClient singleton (`globalForPrisma`).
  3. Caching hot public endpoints (e.g. article metadata, category lists) via in-memory cache or Redis with a 60-second TTL.

### Edge Case 9: Special Characters in Search Queries
- **The Hazard**: A reader searches for `c++ & pointer | !`, breaking PostgreSQL `to_tsquery()` syntax and causing unhandled 500 errors.
- **The Solution**:
  1. Sanitize raw search strings using `plainto_tsquery` or stripping non-alphanumeric punctuation before passing to Prisma's `search` operator.
  2. Fall back to case-insensitive `contains` matching if full-text search encounters an invalid lexeme.

### Edge Case 10: Timezone Discrepancies
- **The Hazard**: Scheduled publishing at "9:00 AM" fires in UTC instead of the author's local timezone, or publication dates display incorrectly across countries.
- **The Solution**:
  1. All database timestamps are strictly stored in **UTC (`DateTime @default(now())`)**.
  2. Scheduled publishing inputs require explicit ISO-8601 strings with timezone offsets.
  3. Frontend formats dates into the reader's local browser timezone using `Intl.DateTimeFormat`.

### Edge Case 11: Inactive Category, Suspended Author & Disabled Package Leakage
- **The Hazard**: An admin deactivates a category (`isActive = false`), suspends an author (`status = 'SUSPENDED'`), or disables a sponsorship package (`isActive = false`). If public endpoints only filter by `status: 'PUBLISHED'` without checking relation active flags, orphan or unapproved content leaks into homepage carousels, default archive queries, search indices, and recommendation rails.
- **The Solution**:
  1. **Strict Service-Level Filtering**: All public queries in `ArticleService`, `SearchService`, `CandidateService`, `BookmarkService`, and `CommentService` enforce `category: { isActive: true }` and `author: { status: 'ACTIVE' }`.
  2. **Direct Access Guard**: Attempting to load an article via `GET /articles/:slug` whose category is inactive or whose author is suspended throws `404 CATEGORY_INACTIVE` or `404 AUTHOR_INACTIVE`.
  3. **Publishing Invariant**: Authors and editors cannot publish an article under an inactive category; the transaction throws `400 CATEGORY_INACTIVE`.
  4. **Public Settings Sanitation**: `SettingsAdminService.getPublicSettings` strips all sponsorship packages with `isActive === false`.
  5. **Admin Visibility Retained**: All admin catalog routes (`/admin/articles`, `/admin/categories`, `/admin/users`) continue to display active and inactive items with visual badges so administrators can manage and reactivate them.

### Edge Case 12: Interactive Transaction Timeout on Remote & Serverless PostgreSQL
- **The Hazard**: Prisma defaults interactive transactions (`prisma.$transaction(async (tx) => ... )`) to an aggressive 5,000ms timeout. When connecting to remote or serverless PostgreSQL instances (e.g. Neon, Supabase, or AWS RDS across regions over TLS/SSL), network latency per query roundtrip is typically 120ms–250ms. Executing a comprehensive manuscript publishing pipeline (resolving 8–15 tags sequentially, updating article columns, deleting old blocks, batch inserting new blocks, upserting 301 slug redirect history, recording audit logs, and generating author notifications) accumulates 15–25 sequential database round-trips, easily exceeding 5,000ms. Prisma forcefully aborts the transaction connection mid-flight:
  `Transaction API error: Transaction already closed: A query cannot be executed on an expired transaction. The timeout for this transaction was 5000 ms, however 5183 ms passed since the start of the transaction.`
  This causes an unhandled 500 Internal Server Error when authors or editors execute "Modify Changes" or publish large manuscripts.
- **The Solution**:
  1. **Configurable Transaction Options (`PRISMA_TX_OPTIONS`)**: Configure all interactive write transactions with explicit `{ maxWait: 10000, timeout: 25000 }` options (10s connection wait, 25s execution timeout) in `ArticleService` and `AdminService`.
  2. **Batch Tag Resolution**: Replace sequential `for...of` `tx.tag.findFirst` queries with a single batch `tx.tag.findMany({ where: { slug: { in: parsedSlugs } } })`. Only missing tags are created in the database, reducing round-trips from 10–20 to 1–2.
  3. **Decouple Heavy Reads & Serialization**: Transaction blocks (`tx`) are strictly reserved for atomic write mutations (article updates, block insertions, slug history, audit logs). Full entity queries with heavy relation joins (`category`, `blocks`, `tags`, `authorProfile`) and external calculations (`SeoResolverService.resolveSEO`) are moved *outside* the transaction after the transaction commits, releasing locks in under 1 second.
  4. **Consolidated Atomic Updates**: Status transitions, publication timestamps, and staged draft clearing (`hasUnpublishedChanges: false`, `draftData: null`) are combined directly into `applyModificationsToArticle`, eliminating duplicate `tx.article.update` round-trips.

