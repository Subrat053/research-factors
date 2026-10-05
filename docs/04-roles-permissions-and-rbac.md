# 04. ROLES, PERMISSIONS & ACCESS CONTROL (RBAC)

## 1. Authorization Philosophy

Research Factors uses a **Decoupled, Centralized Role-Based Access Control (RBAC)** architecture combined with **Resource Ownership Verification**. 

### Anti-Patterns Explicitly Prohibited
- Hardcoding role strings inside business logic or UI components (e.g. `if (user.role === 'admin')`).
- Scattershot permissions checks.
- Assuming an authenticated user owns every resource they target in API request parameters.

---

## 2. Granular Permissions Catalog

Permissions are atomic string identifiers grouped by business domain:

| Domain | Permission Identifier | Description |
| :--- | :--- | :--- |
| **Articles** | `article.create` | Create a new article draft. |
| | `article.read_draft` | Read unpublished draft articles (subject to ownership). |
| | `article.update_own` | Edit draft/rejected articles authored by oneself. |
| | `article.update_any` | Edit any article draft or content (editorial override). |
| | `article.delete_own` | Delete own unpublished draft. |
| | `article.delete_any` | Delete any article. |
| | `article.submit` | Submit draft article to editorial queue. |
| | `article.approve` | Approve a submitted article. |
| | `article.reject` | Reject an article submission with structured feedback. |
| | `article.publish` | Immediately publish an approved article. |
| | `article.unpublish` | Revert a published article to draft/archive. |
| | `article.schedule` | Schedule an article for future publication. |
| **Comments** | `comment.create` | Post top-level comments and replies. |
| | `comment.delete_own` | Delete one's own comment. |
| | `comment.like` | Like/upvote a comment. |
| | `comment.report` | Report a comment for moderation review. |
| | `comment.moderate` | Hide, restore, or delete any user comment. |
| **Categories & Tags** | `category.manage` | Create, edit, and archive categories. |
| | `category.merge` | Merge redundant categories and reassign articles transactionally. |
| | `tag.manage` | Create, edit, and merge tags. |
| **Media** | `media.upload` | Upload images and media assets. |
| | `media.delete_own` | Delete self-uploaded media not linked to published articles. |
| | `media.delete_any` | Delete any media asset. |
| **Users & Authors** | `user.create` | Create user accounts directly with initial role assignment. |
| | `user.read_list` | View registered user directory. |
| | `user.suspend` | Suspend or reactivate user accounts. |
| | `author.approve` | Approve author application requests. |
| | `role.assign` | Assign roles to accounts (subject to privilege hierarchy). |
| **System & Audit** | `system.settings` | Read and modify platform settings. |
| | `audit.read` | View administrative audit logs. |
| | `contact.manage` | Read and resolve contact submissions. |

---

## 3. Comprehensive Role-Permission Matrix

| Permission | GUEST | USER | AUTHOR | EDITOR | ADMIN | SUPER_ADMIN |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| Public Page / Article Read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `comment.create` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `comment.like` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `comment.report` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `comment.delete_own` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `bookmark.manage` | ❌ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `article.create` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `article.update_own` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `article.delete_own` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `article.submit` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `media.upload` | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `article.read_draft` (Any) | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `article.update_any` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `article.approve` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `article.reject` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `article.publish` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `article.unpublish` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `article.schedule` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `comment.moderate` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `category.manage` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `category.merge` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `tag.manage` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `user.create` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `user.read_list` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `user.suspend` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `author.approve` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `audit.read` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `contact.manage` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `role.assign` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `system.settings` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 4. Middleware Implementation Architecture

### 1. `authenticate` Middleware
Extracts and validates the JWT from either:
- Secure `HttpOnly` cookie (`accessToken`), OR
- `Authorization: Bearer <token>` header.
Attaches the authenticated `req.user` with loaded roles and cached permissions set.

### 2. `requirePermission(...permissions)` Middleware
Validates whether the user holds all required permissions. If not, immediately terminates the request with `403 FORBIDDEN`.

```javascript
export const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      });
    }

    if (req.user.isSuperAdmin || req.user.permissions.has(permission)) {
      return next();
    }

    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: `Missing required permission: ${permission}` }
    });
  };
};
```

### 3. Resource Ownership Policy Enforcement
Resource mutations must verify that the requester is either the resource owner OR has an override permission (such as `article.update_any`).

```javascript
export const requireArticleOwnership = async (req, res, next) => {
  const { id } = req.params;
  const article = await prisma.article.findUnique({ where: { id } });

  if (!article) {
    return res.status(404).json({
      success: false,
      error: { code: 'ARTICLE_NOT_FOUND', message: 'Article does not exist' }
    });
  }

  const isOwner = article.authorId === req.user.id;
  const canOverride = req.user.permissions.has('article.update_any');

  if (!isOwner && !canOverride) {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You do not own this article' }
    });
  }

  req.article = article;
  next();
};
```

### 4. Staged Revision & Live Modification Governance (`modifyChanges`)
Modifying an already `PUBLISHED` article requires distinct permission branching:
- **Ownership Verification**: Requester must own the article (`article.authorId === req.user.id`) or possess `article.update_any`.
- **Live Commit vs Review Queue Branching**:
  - If the user holds `article.publish` (or is `SUPER_ADMIN`): `POST /api/v1/articles/:id/modify-changes` transactionally applies the staged draft changes directly to the live published article (`status: 'PUBLISHED'`), clearing the buffer.
  - If the user lacks `article.publish` (e.g. an `AUTHOR` possessing `article.submit`): Staged draft modifications are preserved in `draftData`, and the article transitions to `PENDING_REVIEW`, entering the editorial triage queue. The live public publication remains completely protected and unmutated until an editor approves and publishes it.
- **Discard Draft**: Discarding staged uncommitted edits (`POST /api/v1/articles/:id/discard-draft`) requires article ownership or `article.update_any`.

---

## 5. Privilege Escalation Defenses

1. **Role Hierarchy Guard**:
   - An `ADMIN` cannot assign the `SUPER_ADMIN` role to anyone.
   - An `ADMIN` cannot modify or suspend a `SUPER_ADMIN` account.
   - Only `SUPER_ADMIN` can mutate the `RolePermission` or `UserRole` mappings.
2. **Author Role Promotion**:
   - Users become `AUTHOR` only after an explicit admin approval flow (`authorProfile.isApproved: true`).
   - Regular users cannot bypass review to set their own profile to `isApproved = true`.

---

## 6. Dynamic Frontend RBAC & Unified Adaptive Dashboard

### Unified Adaptive Dashboard Architecture
Rather than fragmenting the user experience across separate portals (e.g. `/author/dashboard` vs `/admin`), Research Factors employs a single **Unified Adaptive Dashboard (`/admin`)**. The dashboard automatically adapts its branding, navigation, metric calculations, and query scoping based strictly on the authenticated user's permissions:

1. **Dynamic Branding & Labels**:
   - **For Authors** (possessing `article.create` / `article.update_own` without global moderation permissions):
     - Dashboard Title: **Author Studio**
     - Subtitle: *"Track your research publication lifecycle, editorial review progress, and reader engagement"*
     - Articles Desk Label: **"My Articles"**
   - **For Editorial & Administrative Staff** (possessing `article.approve`, `article.update_any`, etc.):
     - Dashboard Title: **Editorial Control** or **Executive Backoffice**
     - Subtitle: *"Editorial governance, taxonomy controls, and real-time operational telemetry"*
     - Articles Desk Label: **"All Articles"**

2. **Scope-Aware Dynamic Querying (Ownership vs Global Visibility)**:
   - **Articles Endpoint (`GET /api/v1/admin/articles`)**:
     - Evaluates whether the requester has `article.approve`, `article.update_any`, or is `SUPER_ADMIN`.
     - If yes: returns platform-wide records across all authors.
     - If no: automatically injects `where: { authorId: req.user.id }`. Authors only receive their own drafts, pending reviews, rejections with feedback, and published works.
   - **Dashboard Telemetry (`GET /api/v1/admin/stats`)**:
     - If staff: returns system-wide metrics (total users, review queues, reported comments, categories, tags).
     - If author: returns author-specific KPIs (total articles, articles in review, published articles, and cumulative reader view counts).

3. **Self-Service Profile & Credentials Management (`/admin/profile`)**:
   - Exposed to all authenticated dashboard users.
   - Allows researchers to manage their profile picture (with Sharp WebP upload pipeline), name, short bio, academic headline, laboratory website, and external research profiles (Twitter/X, LinkedIn, GitHub).
   - Includes secure password update workflow with verification of current password.

4. **Seamless Role Progression (Zero Friction Promotion)**:
   - If an Author is granted staff permissions in the future (e.g. `comment.moderate` or `article.approve`), no new portal or redirection logic is needed. Their existing dashboard simply illuminates the newly unlocked desks directly within their sidebar.

5. **User-Friendly Naming Conventions**:
   - Replaced internal terminology ("Manuscript") with intuitive, reader-friendly terms (**"Articles"**, **"My Articles"**, **"All Articles"**, **"Write Article"**).

---

## 6. Administrative User Creation & Public Registration Governance

### 1. The `user.create` Atomic Permission
- **Purpose**: Authorizes privileged staff and administrators to directly provision new accounts with role allocations, bypassing the public registration flow.
- **Default Holder**: Assigned by default to `SUPER_ADMIN`, delegable to custom management roles via the RBAC permissions matrix.
- **Anti-Escalation Safeguards**:
  - Only `SUPER_ADMIN` can assign `ADMIN` or `SUPER_ADMIN` roles when creating accounts.
  - Other holders of `user.create` can provision standard community and editorial roles (`USER`, `AUTHOR`, `EDITOR`), preventing horizontal or vertical privilege escalation.
  - Users created via administrative provisioning can have their email pre-verified immediately (`isEmailVerified: true`), or dispatched an activation verification token.
  - If the `AUTHOR` role is assigned, an approved `AuthorProfile` is automatically provisioned.

### 2. Public Registration Activation & Deactivation (Kill-Switch)
- **Control Interface**: Located directly in the User Directory header (`/admin/users`), accessible to holders of `user.create` or `setting.manage`.
- **Underlying Setting**: Managed in `system_settings` under the `policies` key (`allowRegistration: boolean`).
- **Endpoints**:
  - `GET /api/v1/admin/settings/registration-status`: Retrieves current signup policy.
  - `PATCH /api/v1/admin/settings/registration-status`: Toggles signup state and records an audit log.
  - `GET /api/v1/admin/settings/public`: Safely exposes `allowRegistration` to public clients.

### 3. Graceful Deactivation Experience Across the Platform
When public registration is paused (`allowRegistration: false`):
1. **API Defense**: `POST /api/v1/auth/register` immediately rejects requests with `403 FORBIDDEN` (`REGISTRATION_DISABLED`).
2. **Public Register Page (`/register`)**: Suppresses form submission and displays an editorial notice: *"Public registrations are currently closed by editorial administration. Accounts are provisioned directly by platform administrators or through verified institutional invitation."*
3. **Public Sign-In Page (`/login`)**: Hides the "create an account" callout and notifies visitors that public signup is paused.
4. **Site Header (`Header.jsx`)**: Automatically hides the "Join Platform" call-to-action button.
5. **Administrative Exemption**: The administrative User Directory (`/admin/users`) remains fully operational, enabling curated, invite-only onboarding during publication embargoes or private beta phases.

### 4. Direct Provisioning Modal Experience
- **Desktop Horizontal Architecture**: The Create User Account modal utilizes a two-column responsive layout (`max-w-4xl` / `grid-cols-2` on `md:` screens) pairing Identity & Credentials on the left with Role Allocation & Verification settings on the right.
- **Zero-Scroll Viewport Optimization**: Structured to fit entirely within standard laptop and desktop viewports (~600–730px height) without requiring vertical scrolling, while maintaining full-width stacked responsiveness on mobile viewports.

---

## 7. Dynamic Author Accreditation & Profile Credentials Gating

### 1. Dynamic Role & Permission-Based Visibility
On `/admin/profile`, author accreditation and public byline credentials are fully dynamic:
- **Authorized Authors & Institutional Staff**:
  - Accounts with authoring/editorial roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `AUTHOR`) or permissions (`article.create`, `article.update_own`, `author.approve`) or an approved author profile see the **"Researcher Credentials & Byline"** section.
  - The accreditation badge displays **"Verified Author"** with an emerald shield badge (`ShieldCheck`), confirming institutional accreditation.
  - When updating researcher credentials (headline, biography, laboratory website, social links), the backend automatically ensures `authorProfile.isApproved = true` for privileged roles.
- **Non-Author Accounts (Standard Readers / `USER`)**:
  - The entire **"Researcher Credentials & Byline"** section is **completely hidden** from the user's profile view.
  - Non-authors only see their relevant identity cards: **Personal Information** (First Name, Last Name, Email, Avatar, Personal Bio) and **Security** (Password Management).
  - Eliminates extraneous author fields and prevents non-author users from being mistakenly labeled as "Accreditation Pending".

---

## 8. Universal Human-Readable Audit Enrichment & Security Trail

### 1. Architectural Philosophy
Audit records must be intelligible and directly actionable for administrative personnel without requiring engineering assistance or raw database UUID lookups. The platform employs a dynamic, read-time batch enrichment engine (`AuditEnricherService`) that enriches all historical and new audit logs across all system domains (`User`, `Article`, `Comment`, `Category`, `Tag`, `ContactMessage`, `Media`, `Role`, `SystemSetting`).

### 2. Batch Enrichment Engine (`AuditEnricherService`)
- **Zero N+1 Query Degradation**: Gathers all primary `entityId`s, metadata bulk arrays (`targetIds`, `articleIds`, `messageIds`), and relational references (`articleId`, `authorId`, `userId`) across the queried page (up to 50 logs).
- **Parallel Domain Fetching**: Executes batched `findMany` queries with `in: [...]` in a single `Promise.all` across Prisma entity models.
- **Dynamic Semantic Translation**:
  - Maps raw action keys (e.g. `user.bulk_suspended`, `article.published`, `comment.hidden`, `category.merged`) to human-readable labels (`"Bulk Suspended Users"`, `"Published Article"`, `"Quarantined Comment"`, `"Merged Category"`).
  - Assigns semantic badge variants (`danger`, `warning`, `success`, `purple`, `info`, `neutral`).
  - Synthesizes clear, plain-English narrative statements (e.g., *"Alexander Wright performed Bulk Suspended Users on 12 User Accounts. Reason: 'Spam prevention'"*).
  - Extracts structured state transitions and diffs (`previousStatus` -> `newStatus`, `previousRoles` -> `newRoles`, `reason`, `mergedInto`).
  - Resolves target objects with friendly display names, contextual subtitles, direct panel links, and child `items` arrays for bulk events.

### 3. Executive Audit Inspector UI (`/admin/audit-logs`)
- **Table Overview**:
  - **Timestamp**: Formatted relative elapsed time (`2h ago`) with exact time tooltip.
  - **Staff Actor**: Avatar initial, actor full name, and actor email.
  - **Action & Narrative**: Semantic action badge with an explanatory narrative subtitle.
  - **Entity**: Domain icon (`User`, `FileText`, `MessageSquare`, `FolderTree`, `Tag`, `Mail`, `Image`, `ShieldCheck`, `Settings`) with entity badge.
  - **Target Resource**: Friendly title/name with direct navigation link (e.g., jump to user directory or article view). Bulk operations display count badges (`"12 User Accounts"`).
  - **Inspect Action**: Triggers the comprehensive modal inspector.
- **Inspector Modal**:
  - **Narrative Banner**: High-priority plain-English summary of the event.
  - **Executive Cards**: Actor card and Target Resource card with a direct `"Open Target Resource ↗"` button.
  - **State Transitions Diff**: Visual badge comparison (`FROM -> TO`) for status and role changes.
  - **Bulk Affected Items Roster**: Renders an embedded table listing each affected entity's Name, Email/Identifier, Status badge, and direct jump link.
  - **Collapsible Raw Payload Drawer**: Houses the formatted JSON metadata with a one-click `"Copy"` clipboard trigger for technical forensics.

---

## 9. Post-Authentication Routing & Panel Onboarding Architecture

### 1. Panel Routing Logic (`resolvePostAuthRedirect`)
Upon successful authentication via `/login` or account registration via `/register`:
- **Explicit Deep Links**: If the query string contains a specific `?redirect=<path>` (e.g., from an authentication interceptor guarding an article editor or preview URL), the application navigates directly to that target path—unless the path is `'/'`, a login page, or a register page.
- **Editorial & Administrative Accounts**: Users possessing the `SUPER_ADMIN` role or any administrative/editorial/author permissions (`article.create`, `article.update_own`, `article.approve`, `comment.moderate`, `user.read_list`, `category.manage`, `tag.manage`, `media.manage`, etc.) are routed directly to the Management Panel (`/admin`).
- **Standard Community Accounts (`USER`)**: Registered readers without editorial privileges are routed directly to their Account Profile & Personal Settings panel (`/admin/profile`).
- **Already-Authenticated State Protection**: Authenticated users visiting `/login` or `/register` are automatically directed to their respective panel via a reactive `useEffect` guard, preventing duplicate credential entries.

---

### Future Roadmap
1. **Dynamic Custom Role Builder**: Allow Super Admins to define custom staff roles with granular, multi-select checkboxes for arbitrary combinations of permissions.
2. **Audit Log CSV/JSON Export**: Provide single-click export of filtered audit logs for SOC2 and institutional compliance reporting.
3. **Session Timeout & Inactivity Guards**: Enforce automated session invalidation for administrative consoles after 30 minutes of inactivity.
4. **Author Co-authorship & Collaborative Editing**: Extend article ownership from a single `authorId` to a `many-to-many` co-author association.



