# 07. COMMUNITY & MODERATION SYSTEM

## 1. Editorial Community Principles

Research Factors fosters high-signal reader discourse. Unlike chaotic social forums, discussions on Research Factors resemble letters to the editor, peer commentary, and thoughtful debate.

Key community design standards:
1. **Depth Restriction**: Comment nesting is strictly capped at **2 levels** (Root comments at depth 0, direct replies at depth 1). Infinite nesting creates mobile layout degradation and endless flame wars.
2. **First-Class Moderation**: Editors have instant audit tools to review reported content, hide offending remarks, or suspend abusive accounts.
3. **Optimistic & Engaging**: Readers can like comments and bookmark articles with instant UI feedback.

---

## 2. Nested Comment Tree Architecture

### Tree Representation
```
Article
  ├── Root Comment 1 (depth: 0, parentId: null)
  │     ├── Reply 1.1 (depth: 1, parentId: Root 1)
  │     └── Reply 1.2 (depth: 1, parentId: Root 1)
  │           └── [Replying here targets Root 1 or quotes user; depth remains capped at 1]
  └── Root Comment 2 (depth: 0, parentId: null)
```

### Depth Enforcement Algorithm
When submitting a comment:
```javascript
export async function createComment({ articleId, userId, parentId, content }) {
  let depth = 0;

  if (parentId) {
    const parentComment = await prisma.comment.findUnique({
      where: { id: parentId },
      select: { id: true, depth: true, status: true }
    });

    if (!parentComment || parentComment.status !== 'VISIBLE') {
      throw new ValidationError('Parent comment does not exist or is hidden');
    }

    if (parentComment.depth >= 1) {
      // Re-anchor reply to the top-level parent to prevent deep nesting
      throw new ValidationError('Nested replies beyond 2 levels are not permitted');
    }

    depth = 1;
  }

  return prisma.comment.create({
    data: {
      articleId,
      userId,
      parentId,
      depth,
      content: sanitizeComment(content),
      status: 'VISIBLE'
    }
  });
}
```

---

## 3. High-Performance Comment Pagination

The initial article page request **never loads all comments**.
1. Root comments are fetched via `GET /api/v1/articles/:id/comments?page=1&limit=20`.
2. Each root comment returns a `replyCount` badge.
3. Replies for a specific thread are loaded lazily when the reader clicks *"View 4 replies"*.
4. This ensures instantaneous page render speeds even on articles with thousands of reader interactions.

---

## 4. Like & Vote Integrity

- Readers can like comments to elevate high-value insights.
- The `CommentLike` table enforces a composite primary key: `@@id([userId, commentId])`.
- Atomic increment/decrement guarantees vote counts remain accurate without race conditions:
```javascript
export async function toggleCommentLike(userId, commentId) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } }
    });

    if (existing) {
      await tx.commentLike.delete({ where: { userId_commentId: { userId, commentId } } });
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true }
      });
      return { liked: false, likeCount: updated.likeCount };
    } else {
      await tx.commentLike.create({ data: { userId, commentId } });
      const updated = await tx.comment.update({
        where: { id: commentId },
        data: { likeCount: { increment: 1 } },
        select: { likeCount: true }
      });
      return { liked: true, likeCount: updated.likeCount };
    }
  });
}
```

---

## 5. Comment Reporting & Auto-Flagging

- Readers can flag comments with a structured `ReportReason` (`SPAM`, `OFFENSIVE`, `HARASSMENT`, `MISINFORMATION`, `PERSONAL_INFO`, `PROMOTIONAL`, `OTHER`).
- Duplicate reports from the same user on the same comment are blocked via `@@unique([userId, commentId])`.
- **Auto-Threshold Trigger**: If a comment accumulates **3 or more distinct user reports**, its status automatically transitions to `REPORTED`, highlighting it immediately in the Admin Moderation Queue.

---

## 6. Editorial Comments Hub & Reports Triage Governance

The backoffice provides two complementary desks for community governance:

### A. Global Comments Management Hub (`/admin/comments`)
Located at `/admin/comments` and powered by `CommentAdminService.listAllComments`:
- **Complete Scope**: Displays **all comments across all articles**, not just flagged ones.
- **Dynamic Status Filter Tabs with Live Badges**:
  - `All Comments` (total count)
  - `Reported` (amber alert badge with pulsing indicator when count > 0)
  - `Visible` (emerald badge)
  - `Hidden` (slate badge)
  - `Deleted` (red badge)
- **Search & Filter Toolbar**: Search by comment prose, author name/email, or article title; filter by article; sort by `Newest`, `Oldest`, `Most Reported`, or `Most Liked`.
- **Auto-Refresh & Polling**: Background TanStack Query poll (30s) or manual instant refresh.
- **Granular Report Inspection**: When a comment has reports (`reportCount > 0`), clicking `⚠️ X Reports — Inspect` opens the **Report Details Modal** without leaving the page.
- **Moderation Actions**:
  - `Approve / Restore`: Sets status to `VISIBLE`.
  - `Hide`: Sets status to `HIDDEN`.
  - `Delete`: Sets status to `DELETED` with confirmation modal.
  - Automatically clears associated report tickets and logs an immutable `AuditLog` entry.

### B. Reader Reports Triage Queue (`/admin/reports`)
Located at `/admin/reports` and powered by `ReportAdminService.listReports`:
- Focused queue for incoming violation complaints submitted by readers.
- Displays reporter details, classified violation tag (`SPAM`, `HARASSMENT`, `MISINFORMATION`, etc.), reporter notes, and offending comment prose.
- One-click actions: `Dismiss Report`, `Hide Comment`, `Delete Comment`, and `Suspend Commenter`.
- Cleans up associated reports across the comment to prevent duplicate orphan tickets.

### C. Thread Resilience & Moderation Placeholders
If a top-level parent comment is moderated (`HIDDEN` or `DELETED`), active replies are preserved rather than dropped. The parent renders a standardized moderation placeholder:
`"[This peer response was removed by a moderator for violating community standards]"`, ensuring reader conversations remain intelligible and navigable.

---

## 7. Audit Log Trail

Every administrative moderation event records an immutable entry in the `audit_logs` table:
```json
{
  "actorId": "c3f80c62-841f-4d69-a1b7-ff3c1c4f0b20",
  "action": "comment.hidden",
  "entityType": "Comment",
  "entityId": "a17f3940-bf76-47b2-bdcf-88229b47e2cc",
  "metadata": {
    "action": "HIDE",
    "reason": "Editorial review quarantine",
    "previousStatus": "VISIBLE",
    "newStatus": "HIDDEN",
    "articleId": "d059e663-ffc9-4672-9db8-2d887a0db5a2",
    "authorId": "1ef645f7-66a1-4328-94ef-657d2a5a5d09"
  },
  "createdAt": "2026-09-28T13:32:00.000Z"
}
```
All moderation records are inspectable in the system Audit Log (`/admin/audit-logs`).

---

## 8. Saved Research & Reader Bookmarks Library

### A. Architectural Flow & Persistence
- **Persistent Storage**: Saved articles are stored in PostgreSQL using the `Bookmark` model with a composite primary key `@@id([userId, articleId])`.
- **Idempotent Toggling**: Handled by `BookmarkService.toggleBookmark`:
  - If a bookmark exists, it is deleted and returns `{ bookmarked: false }`.
  - If not present, it is created and returns `{ bookmarked: true }`.
  - Prevents race conditions and duplicate entries.
- **DTO Serialization**: Responses serialize articles through `ArticleDTO.toPublicSummary`, guaranteeing that author profiles, category relationships, and comment counts (`_count.comments`) are consistently delivered without exposing internal or sensitive attributes.

### B. User Panel Integration (`/admin/bookmarks`)
- **Authenticated Access**: Moved from legacy public routing into the authenticated user panel at `/admin/bookmarks`. All authenticated users (Readers, Authors, Editors, Admins) have access without requiring elevated administrative privileges.
- **Navigation Integration**:
  - The public site header user dropdown (`Header.jsx`) links directly to `/admin/bookmarks` ("Saved Research").
  - Accessing the legacy path `/bookmarks` issues a client-side redirect (`<Navigate to="/admin/bookmarks" replace />`), directing unauthenticated guests to `/login` via `<ProtectedRoute>`.
  - The sidebar in `AdminLayout.jsx` displays the `Saved Research` menu item under personal settings for all authenticated roles.

### C. UI/UX, Themes & Responsiveness
- **Responsive Layout**: Designed for seamless reading across all screen sizes:
  - Mobile: Single column grid (`grid-cols-1`) with stacked filter and search controls.
  - Tablet: Two-column grid (`sm:grid-cols-2`).
  - Desktop: Three-column grid (`lg:grid-cols-3`).
- **Dark & Light Mode Support**:
  - Light mode: Pure white cards (`bg-white`), subtle borders (`border-slate-200`), dark slate typography (`text-slate-900`, `text-slate-600`), and soft slate accents.
  - Dark mode: Deep slate cards (`dark:bg-slate-900`), crisp contrast borders (`dark:border-slate-800`), bright white headings (`dark:text-slate-100`), and muted subtitles (`dark:text-slate-400`).
- **Interactive Capabilities**:
  - **Live Search**: Instant keyword search across article titles, subtitles, excerpts, categories, and author names.
  - **Category Filtering**: Dropdown filter generated dynamically from the categories present in the user's saved collection.
  - **Sorting**: Multi-mode sorting (`Recently Saved`, `Newest Published`, `Oldest Published`, `Title A-Z`).
  - **1-Click Removal**: Immediate unbookmarking directly from the card action with TanStack Query cache invalidation (`queryKey: ['bookmarks']`).
  - **Editorial Resilience**: Graceful skeleton loading states (`animate-pulse`), informative empty states when zero articles are saved, and filtered-out reset prompts.

