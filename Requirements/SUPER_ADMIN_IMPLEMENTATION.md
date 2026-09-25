# RESEARCH FACTORS — SUPER ADMIN & EDITORIAL BACKOFFICE SPECIFICATION
**Version:** 1.0.0  
**Status:** Production Implemented & Verified  
**Architecture:** Modular Monolith (Express.js, Prisma ORM, PostgreSQL, React 18, Tailwind CSS, TanStack Query)

---

## 1. EXECUTIVE SUMMARY

The Super Admin and Editorial Administration subsystem provides enterprise-grade governance, centralized Role-Based Access Control (RBAC), multi-layer privilege escalation barriers, and backoffice operational controls for Research Factors.

Built according to the directives in `AGENTS.md` and `Requirements/prd.md`, the platform strictly separates the public magazine experience from the dark-mode editorial command center, ensuring:
- **Zero Raw Entity Leakage**: All responses pass through explicit Data Transfer Object (DTO) serializers.
- **Centralized Security**: Zero hardcoded role checks (`user.role === 'admin'`) in routes; all actions are mediated by `requirePermission` or `requireSuperAdmin` middleware.
- **Atomic Concurrency**: Sensitive operations (e.g., Tag Merging, Manuscript Force Deletion) execute inside interactive Prisma transactions (`prisma.$transaction`).
- **Zero TypeScript**: Pure JavaScript (`.jsx`, `.js`) across frontend and backend.

---

## 2. CENTRALIZED RBAC & ATOMIC PERMISSION CATALOG

The platform enforces 34 atomic permissions organized across 9 architectural domains:

| Domain | Action / Permission | Description |
| :--- | :--- | :--- |
| **Article** | `article.create` | Author article draft creation |
| | `article.read_draft` | Access unpublished manuscripts |
| | `article.update_own` | Edit authored drafts |
| | `article.update_any` | Administrative editorial modifications |
| | `article.delete_own` | Author draft removal |
| | `article.delete_any` | Force deletion of any manuscript |
| | `article.submit` | Submit draft to editorial review desk |
| | `article.approve` | Accept/approve manuscript for publication |
| | `article.reject` | Return manuscript with feedback notes |
| | `article.publish` | Set approved manuscript live to public |
| | `article.unpublish` | Revert live article to draft |
| | `article.schedule` | Set timestamp for automated release |
| **Comment** | `comment.create` | Post peer responses |
| | `comment.delete_own` | Remove own commentary |
| | `comment.like` | Upvote peer commentary |
| | `comment.report` | Flag comments for editorial triage |
| | `comment.moderate` | Hide, delete, or dismiss comment flags |
| **Category** | `category.manage` | Category hierarchy, slugs, safe deletion |
| **Tag** | `tag.manage` | Tag creation, cleanup, and atomic tag merging |
| **Media** | `media.upload` | Media asset upload via StorageProvider |
| | `media.delete_own` | Remove own media assets |
| | `media.delete_any` | Administrative media force purge |
| | `media.manage` | Browse and inspect platform media library |
| **User** | `user.read_list` | View user directory |
| | `user.manage_status` | Activate, deactivate, or suspend accounts |
| | `user.assign_role` | Allocate or revoke user roles |
| **Author** | `author.apply` | Submit author accreditation application |
| | `author.approve` | Approve/reject research author credentials |
| | `author.manage_profile` | Edit author headlines and biographies |
| **RBAC / Role** | `role.manage` | Create, edit custom roles and permission matrix |
| **Admin System**| `admin.manage` | Modify global platform configuration and settings |
| **Reports** | `report.manage` | Triage and resolve community violations |
| **Contact** | `contact.manage` | Inquiries inbox, status tracking, resolution |
| **Audit** | `audit.read` | View immutable administrative audit trail |

### Role Hierarchy & Assignment Matrix
1. **`SUPER_ADMIN`**: Full platform authority with lockdown protection on core governance permissions (`role.manage`, `admin.manage`, `user.assign_role`, `audit.read`).
2. **`ADMIN`**: Editorial management staff. Can manage articles, authors, taxonomy, media, and triage reports. **Cannot** promote users to `ADMIN`/`SUPER_ADMIN` and **cannot** alter `SUPER_ADMIN` accounts.
3. **`EDITOR`**: Focused manuscript curation (`article.approve`, `article.reject`, `comment.moderate`).
4. **`AUTHOR`**: Accredited researchers (`article.create`, `article.update_own`, `article.submit`, `media.upload`).
5. **`USER`**: Registered community readers (`comment.create`, `comment.like`, `comment.report`).
6. **`GUEST`**: Public anonymous readers (read-only access to published content).

---

## 3. ANTI-ESCALATION & ANTI-LOCKOUT SAFEGUARDS

To prevent privilege escalation attacks and administrative accidents:

1. **Staff Admin Privilege Cap (`FORBIDDEN_ELEVATE_ADMIN`)**:
   - In `UserAdminService.updateUserRole`: If an executing actor is not a `SUPER_ADMIN`, attempting to assign the `ADMIN` or `SUPER_ADMIN` role throws a `403 Forbidden` error.
2. **Super Admin Account Immunity (`FORBIDDEN_MUTATE_SUPER_ADMIN`)**:
   - A standard `ADMIN` cannot suspend, deactivate, or demote a user holding the `SUPER_ADMIN` role.
3. **Last Super Admin Immutability (`LAST_SUPER_ADMIN_IMMUTABLE`)**:
   - The platform calculates the active count of `SUPER_ADMIN` users before any role demotion or account suspension. If `activeSuperAdmins <= 1`, the mutation is blocked.
4. **Core Permissions Immutability**:
   - In `RbacAdminService.updateRolePermissions`: Core governance permissions cannot be unchecked or removed from the `SUPER_ADMIN` role.

---

## 4. SUPER ADMIN EXCLUSIVE SUBSYSTEMS

### 4.1 Roles & Permissions Management (`/admin/roles`)
- **Backend Service**: `RbacAdminService` (`backend/src/modules/admin/rbac-admin.service.js`)
- **Endpoints**:
  - `GET /api/v1/admin/roles`: List all system and custom roles with associated permission counts.
  - `POST /api/v1/admin/roles`: Create a new custom role.
  - `PUT /api/v1/admin/roles/:id`: Update custom role description.
  - `DELETE /api/v1/admin/roles/:id`: Delete custom role (system roles immutable).
  - `GET /api/v1/admin/permissions`: List all 34 permissions grouped by domain module.
  - `PUT /api/v1/admin/roles/:id/permissions`: Atomically synchronize role permissions.
- **Frontend Page**: `RolesPermissionsPage.jsx` featuring an interactive module-grouped permission matrix.

### 4.2 System Settings & Platform Diagnostics (`/admin/settings`)
- **Backend Service**: `SettingsAdminService` (`backend/src/modules/admin/settings-admin.service.js`)
- **Model**: `SystemSetting` (`key`, `value` JSON, `category`, `isPublic`, `updatedBy`)
- **Endpoints**:
  - `GET /api/v1/admin/settings`: Retrieve settings grouped by category (`general`, `seo`, `policies`).
  - `PUT /api/v1/admin/settings`: Upsert category configurations with audit trail logging.
  - `POST /api/v1/admin/settings/test-email`: Trigger live outbound SMTP test verification.
  - `GET /api/v1/admin/settings/health`: Real-time diagnostics (PostgreSQL query latency, active storage provider status, Node.js memory RSS/heap, process uptime).
- **Frontend Page**: `SystemSettingsPage.jsx` with tabs for General, SEO, Editorial Policies, SMTP Tester, and Diagnostics telemetry.

---

## 5. ADMINISTRATIVE SUBMODULES

### 5.1 User Directory & Account Governance (`/admin/users`)
- Search by name or email, filter by account status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`) and assigned role.
- Suspend user with mandatory audit reason dialog. Suspended users are immediately rejected during token authentication (`ACCOUNT_SUSPENDED`).
- Assign and revoke roles with anti-escalation validation.

### 5.2 Author Accreditation Desk (`/admin/authors`)
- Pending applications queue displaying academic credentials, portfolio links, and research headlines.
- `Approve`: Automatically assigns `AUTHOR` role and marks `AuthorProfile.isApproved = true`.
- `Reject`: Captures editorial rationale and sends structured feedback.

### 5.3 Full Manuscript Lifecycle (`/admin/articles`)
- Manage manuscripts across all statuses: `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, `REJECTED`.
- `Schedule Publication`: Set future release date/time (`scheduledFor`).
- `Archive`: Transition live articles to `ARCHIVED` status.
- `Force Delete`: Prisma transaction with cascade deletion across tags, comments, bookmarks, and block content.

### 5.4 Category Hierarchy (`/admin/categories`)
- Tree table view displaying parent-child taxonomy.
- Slug auto-generation with collision avoidance.
- Safe deletion validation preventing removal of categories with active articles or children.

### 5.5 Keyword Tag Catalog & Tag Merge Tool (`/admin/tags`)
- Searchable tag inventory with article frequency counts.
- **Tag Merge Utility (`POST /api/v1/admin/tags/merge`)**: Consolidates multiple redundant tags into one primary tag, rewrites all `ArticleTag` join records, and deletes redundant tags within an interactive database transaction.

### 5.6 Community Report Triage Desk (`/admin/reports`)
- Influx queue for reported peer comments categorized by reason (`SPAM`, `HARASSMENT`, `MISINFORMATION`, `OTHER`).
- Triage actions: `DISMISS` report, `HIDE_COMMENT`, `DELETE_COMMENT`, or `SUSPEND_AUTHOR`.

### 5.7 Media Asset Explorer & Purging (`/admin/media`)
- Filter platform media by storage provider (`local`, `cloudinary`, `r2`).
- Copy public CDN URL, inspect dimensions, mime type, and byte size.
- Administrative force deletion: Deletes database record and invokes `StorageFactory.delete()` on physical storage provider.

### 5.8 Public Contact Messages Inbox (`/admin/contact-messages`)
- Inbound contact inquiries queue.
- Mark as read/unread, mark as resolved, delete.
- Quick `mailto:` reply link to sender.

### 5.9 Immutable Audit Trail (`/admin/audit-logs`)
- Filter logs by action type or resource.
- Interactive modal with formatted JSON payload inspector.

---

## 6. FRONTEND EDITORIAL BACKOFFICE ARCHITECTURE

The administrative UI is built with:
- **`AdminLayout`**: Persistent responsive dark slate sidebar (`#020617` / `#0f172a`), real-time database connectivity pulse, role indicator pill, and mobile drawer.
- **`ProtectedRoute`**: Centralized routing guards supporting both `requiredPermission` and `requiredRole`.
- **`adminApi`**: Centralized API client utilizing `Axios` with automatic CSRF/Bearer token attachment.
- **Vite Production Bundle**: Minified, zero TypeScript, 1,665 modules transformed without build warnings or lint errors.

---

## 7. VERIFICATION & TEST COVERAGE MATRIX

All automated test suites pass with 100% success rate:

```
 RUN  v1.6.1 D:/Wizmonk/ResearchFactor/backend

 ✓ tests/integration/super-admin.test.js  (8 tests)
 ✓ tests/integration/admin.test.js        (5 tests)
 ✓ tests/integration/community.test.js    (4 tests)
 ✓ tests/integration/auth.test.js         (6 tests)
 ✓ tests/integration/articles.test.js     (5 tests)
 ✓ tests/contract/storage.contract.test.js (2 tests)
 ✓ tests/integration/health.test.js       (5 tests)

 Test Files  7 passed (7)
      Tests  35 passed (35)
   Duration  73.01s
```

### Verified Scenarios:
1. Super Admin access to protected system endpoints.
2. Standard Admin 403 rejection on Super Admin routes.
3. Anti-privilege escalation (Admin cannot promote users to Admin or Super Admin).
4. Anti-lockout protections (cannot demote or suspend last active Super Admin).
5. Dynamic role creation and atomic permission matrix updates.
6. Tag Merge utility atomicity in PostgreSQL.
7. Outbound test email dispatch.
8. Real-time platform health diagnostics.
9. Frontend production build clean compilation (`npm run build`).

---

## 8. FUTURE ROADMAP & EXTENSIBILITY ITEMS

As required by Rule 10 of `AGENTS.md`, the following operational extensions are scheduled for upcoming iterations:

1. **Automated Scheduled Publication Worker**:
   - Implement a background cron job (`node-cron` or `BullMQ` with Redis) to execute `ArticleService.publishScheduledArticles()` every minute, transitioning articles whose `scheduledFor <= new Date()` to `PUBLISHED`.
2. **Audit Log Export Utility**:
   - Add CSV and JSON stream download endpoints for audit logs filtered by date range for regulatory compliance.
3. **IP & Subnet Range Blacklisting**:
   - Introduce an administrative IP ban table with Express middleware filtering for malicious actors.
4. **Granular Revision History Diff Viewer**:
   - Provide visual side-by-side block diffs for manuscript revision history in the editorial review modal.
5. **Webhook Dispatch System**:
   - Allow Super Admins to configure outbound HTTP webhooks on publication events (e.g., notifying RSS aggregators, Discord/Slack newsrooms).
