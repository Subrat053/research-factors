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
| | `tag.manage` | Create, edit, and merge tags. |
| **Media** | `media.upload` | Upload images and media assets. |
| | `media.delete_own` | Delete self-uploaded media not linked to published articles. |
| | `media.delete_any` | Delete any media asset. |
| **Users & Authors** | `user.read_list` | View registered user directory. |
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
| `tag.manage` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
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

---

## 5. Privilege Escalation Defenses

1. **Role Hierarchy Guard**:
   - An `ADMIN` cannot assign the `SUPER_ADMIN` role to anyone.
   - An `ADMIN` cannot modify or suspend a `SUPER_ADMIN` account.
   - Only `SUPER_ADMIN` can mutate the `RolePermission` or `UserRole` mappings.
2. **Author Role Promotion**:
   - Users become `AUTHOR` only after an explicit admin approval flow (`authorProfile.isApproved: true`).
   - Regular users cannot bypass review to set their own profile to `isApproved = true`.
