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

## 6. Moderation Queue & Audit Log

The admin moderation console (`/admin/comments`) allows editors to:
- Filter comments by status: `REPORTED`, `PENDING`, `HIDDEN`, `VISIBLE`.
- View the reporter's notes and the contextual article.
- Actions:
  - **Approve / Dismiss Reports**: Resets status to `VISIBLE`.
  - **Hide Comment**: Sets status to `HIDDEN` (hidden from public view, preserved for records).
  - **Soft Delete**: Content replaced with *"[Comment deleted by moderator]"*.
  - **Suspend User**: Temporarily or permanently restricts the author's commenting privileges.
- Every moderation action automatically creates an unalterable `AuditLog` entry.
