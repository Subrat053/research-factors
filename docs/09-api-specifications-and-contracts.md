# 09. API SPECIFICATIONS & RESPONSE CONTRACTS

## 1. API Architecture Principles

All APIs are versioned under the `/api/v1` prefix. The API conforms strictly to RESTful conventions, utilizing standard HTTP status codes and predictable URL hierarchies.

### Response Uniformity
Every response returned by the backend conforms to one of two structural envelopes:

#### 1. Success Envelope (`200 OK`, `201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "title": "Quantum Computation Frontiers",
    "slug": "quantum-computation-frontiers"
  },
  "message": "Article published successfully"
}
```

For paginated collections:
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 142,
      "totalPages": 8,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

#### 2. Error Envelope (`400`, `401`, `403`, `404`, `409`, `422`, `429`, `500`)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Input data failed validation checks",
    "requestId": "6a9e1d82-e8a2-4a7b-a3d8-e3bb9e248b1a",
    "details": [
      {
        "path": "title",
        "message": "Title must be at least 5 characters long"
      }
    ]
  }
}
```

---

## 2. Standardized Error Codes

| Code | HTTP Status | Meaning |
| :--- | :---: | :--- |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token. |
| `FORBIDDEN` | 403 | Authenticated user lacks required permission or ownership. |
| `RESOURCE_NOT_FOUND` | 404 | Targeted entity does not exist. |
| `SLUG_CONFLICT` | 409 | Unique constraint conflict (e.g. slug already exists). |
| `VALIDATION_FAILED` | 422 | Request body or query parameters failed Zod schema checks. |
| `RATE_LIMITED` | 429 | Exceeded permissible request rate. |
| `INTERNAL_SERVER_ERROR`| 500 | Unhandled server exception (stack trace omitted in production).|

---

## 3. Core API Endpoints Directory

### Authentication (`/api/v1/auth`)
- `POST /register`: Register user account (triggers email verification).
- `POST /login`: Authenticate with email/password; sets HttpOnly cookie.
- `POST /logout`: Clears session cookie and invalidates token.
- `GET /me`: Returns currently authenticated user profile and permissions.
- `POST /forgot-password`: Issues a secure time-limited password reset token.
- `POST /reset-password`: Resets password using valid token.

### Public Content (`/api/v1/articles`, `/api/v1/categories`, `/api/v1/search`)
- `GET /articles`: Paginated list of published articles with category/tag/sort filters.
- `GET /articles/:slug`: Full published article with blocks, author info, and related items.
- `GET /categories`: Active category hierarchy.
- `GET /tags/trending`: Most popular tags.
- `GET /search`: PostgreSQL full-text search across titles, excerpts, blocks, and tags.

### Author Workspace (`/api/v1/author/articles`)
- `GET /author/articles`: List all articles created by the authenticated author.
- `POST /author/articles`: Initialize a new draft article.
- `PATCH /author/articles/:id/draft`: Debounced autosave endpoint for draft header & blocks.
- `GET /author/articles/:id/preview`: Secure author preview of draft content.
- `POST /author/articles/:id/submit`: Transition article from `DRAFT` or `REJECTED` to `PENDING_REVIEW`.

### Editorial & Administration (`/api/v1/admin/articles`)
- `GET /admin/articles`: Filter all articles across system statuses (`PENDING_REVIEW`, etc.).
- `POST /admin/articles/:id/approve`: Move article to `APPROVED`.
- `POST /admin/articles/:id/reject`: Reject article with required `rejectionReason`.
- `POST /admin/articles/:id/publish`: Publish approved article (updates status & `publishedAt`).
- `POST /admin/articles/:id/schedule`: Set future publication time.
- `POST /admin/articles/:id/unpublish`: Revert article to `ARCHIVED` or `DRAFT`.

### Community (`/api/v1/comments`, `/api/v1/bookmarks`)
- `GET /articles/:id/comments`: Fetch root comments for an article (paginated).
- `GET /comments/:id/replies`: Fetch replies for a specific root comment.
- `POST /articles/:id/comments`: Create top-level comment or reply (depth <= 1).
- `POST /comments/:id/like`: Toggle like/upvote on comment.
- `POST /comments/:id/report`: Submit moderation report for comment.
- `POST /articles/:id/bookmark`: Toggle bookmark for authenticated reader.
- `GET /account/bookmarks`: List reader's saved research library.

### Media Abstraction (`/api/v1/media`)
- `POST /media/upload`: Multipart file upload. Processes through Sharp, stores via active `StorageProvider`, creates `Media` record.
- `DELETE /media/:id`: Deletes media from storage and database (if not linked to published articles).
