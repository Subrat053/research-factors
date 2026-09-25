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

### Public Content (`/api/v1/articles`, `/api/v1/categories`, `/api/v1/tags`, `/api/v1/search`)
- `GET /articles`: Paginated list of published articles with `category`, `tag`, `type` (format enum: `RESEARCH`, `REVIEW`, `COMPARISON`, `GUIDE`, `ANALYSIS`, `OPINION`), and `sort` filters.
- `GET /articles/:slug`: Full published article with blocks, author info, and related items.
- `GET /categories`: Active public category listing and hierarchy (returns `id`, `name`, `slug`, `description`, `imageUrl`, `isActive`, `showInFooter`, `seoTitle`, `seoDescription`, `seoKeywords`, `canonicalUrl`, `parent`, and published article count `_count.articles`).
- `GET /categories/:slug`: Public category detail by slug (returns single category metadata, custom SEO configuration fields, and active article counts; powers dynamic `/categories/:categorySlug` portal).
- `GET /tags`: Query and autocomplete tags with active article counts (`?search=query`).
- `GET /tags/:slug`: Get tag metadata and article counts by slug.
- `GET /tags/trending`: Most popular tags.
- `GET /search`: Search published articles across titles, excerpts, categories, and tags with optional `type`, `category`, and `limit` filters.
- `GET /search/trending`: Top trending research articles ordered by view counts and search click engagement (in-memory cached with 10-minute TTL to reduce database reads to near-zero).
- `GET /search/recommendations`: Tailored research recommendations based on the user's recent search type (`ArticleType`) or category (in-memory cached with 10-minute TTL).
- `POST /search/click`: Asynchronous, fire-and-forget search click engagement tracker that reinforces trending rankings without blocking client navigation.

### Author Workspace (`/api/v1/author/articles`)
- `GET /author/articles`: List all articles created by the authenticated author.
- `POST /author/articles`: Initialize a new draft article (supports dynamic category, `type` editorial format, dual-format tags, brand sponsorship fields (`isSponsored`, `sponsorName`, `sponsorDescription`, `sponsorUrl`, `sponsorLogoUrl`), and SEO metadata (`seoTitle`, `seoDescription`, `canonicalUrl`)).
- `PATCH /author/articles/:id/draft`: Debounced autosave endpoint for draft header, `type` editorial format, blocks, brand sponsorship, and SEO metadata.
- `GET /author/articles/:id/preview`: Secure author preview of draft content with sidebar sponsorship simulation and normal-form tags.
- `POST /author/articles/:id/submit`: Transition article from `DRAFT` or `REJECTED` to `PENDING_REVIEW`.

### Article Data Transfer Objects (DTO) Schema
- **`ArticleDTO.toPublicSummary`**: `id`, `title`, `slug`, `subtitle`, `excerpt`, `coverImageUrl`, `coverImageAlt`, `type`, `status`, `readingTimeMin`, `viewCount`, `isFeatured`, `isSponsored`, `sponsorName`, `sponsorDescription`, `sponsorUrl`, `sponsorLogoUrl`, `publishedAt`, `category`, `author`, `tags`, `commentCount`.
- **`ArticleDTO.toPublicDetail`**: Extends summary with `seoTitle`, `seoDescription`, `canonicalUrl`, `blocks` (ordered and sanitized), and `related` publications.
- **`ArticleDTO.toAuthorAdmin`**: Extends detail with `rejectionReason`, `scheduledAt`, `createdById`, `publishedById`, `createdAt`, `updatedAt`.

### Editorial & Administration (`/api/v1/admin/articles`, `/api/v1/categories`, `/api/v1/admin/users`)
- `GET /admin/articles`: Filter all articles across system statuses (`PENDING_REVIEW`, etc.).
- `POST /admin/articles/:id/approve`: Move article to `APPROVED`.
- `POST /admin/articles/:id/reject`: Reject article with required `rejectionReason`.
- `POST /admin/articles/:id/publish`: Publish article live directly or from review queue (`article.publish` permission; updates status to `PUBLISHED`, locks slug history, & sets `publishedAt`).
- `POST /admin/articles/:id/schedule`: Set future publication time.
- `POST /admin/articles/:id/unpublish`: Revert live article to `ARCHIVED` (`article.publish` / `article.unpublish` permission).
- `POST /admin/articles/bulk-status`: Batch transition article statuses (`{ articleIds: string[], action: 'PUBLISH' | 'ARCHIVE' }`, requires `article.publish`).
- `POST /admin/articles/bulk-delete`: Batch force delete articles and cascade cleanups (`{ articleIds: string[] }`, requires `article.delete_any`).
- `PATCH /admin/users/bulk-status`: Batch update user account statuses (`{ userIds: string[], status: 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED', reason?: string }`, requires `user.suspend`, includes actor self-exclusion safeguard).
- `GET /categories/all`: Admin listing of all categories including inactive records and full hierarchy (requires `category.manage`).
- `POST /categories`: Create new category with SEO metadata and `showInFooter` toggle (requires `category.manage`).
- `PUT /categories/:id`: Update category fields including SEO metadata, active status, and `showInFooter` (requires `category.manage`).
- `DELETE /categories/:id`: Delete category (requires `category.manage`).
- `POST /categories/merge`: Merge duplicate category into target category transactionally (`category.merge` / `category.manage`).

### Community (`/api/v1/comments`, `/api/v1/bookmarks`)
- `GET /articles/:id/comments`: Fetch root comments for an article (paginated).
- `GET /comments/:id/replies`: Fetch replies for a specific root comment.
- `POST /articles/:id/comments`: Create top-level comment or reply (depth <= 1).
- `POST /comments/:id/like`: Toggle like/upvote on comment.
- `POST /comments/:id/report`: Submit moderation report for comment.
- `DELETE /comments/:commentId`: Delete comment (author ownership verification or `comment.moderate` / Super Admin permission).
- `POST /articles/:id/bookmark`: Toggle bookmark for authenticated reader.
- `GET /account/bookmarks`: List reader's saved research library.

### Media Abstraction (`/api/v1/media`)
- `POST /media/upload`: Multipart file upload. Processes through Sharp, stores via active `StorageProvider`, creates `Media` record.
- `DELETE /media/:id`: Deletes media from storage and database (if not linked to published articles).

### Contact & Sponsorship Inquiries (`/api/v1/contact`, `/api/v1/admin/contact-messages`)
- `POST /contact/sponsorship`: Public submission of brand sponsorship and research partnership inquiries (rate-limited, sanitized, persists to `contact_messages`).
- `POST /contact`: Public submission of general reader inquiries and editorial correspondence (rate-limited, sanitized, persists to `contact_messages`).
- `POST /contact/general`: Alias for general reader inquiries.
- `GET /admin/contact-messages`: Permission-gated (`contact.manage`) paginated list with `status` (`unread`, `pending`, `resolved`) and `type` (`sponsorship`, `general`) filters, plus keyword search.
- `PATCH /admin/contact-messages/:id`: Permission-gated (`contact.manage`) update to toggle `isRead` or `isResolved` status (creates audit log).
- `DELETE /admin/contact-messages/:id`: Permission-gated (`contact.manage`) deletion of inquiry (creates audit log).
- `PATCH /admin/contact-messages/bulk`: Batch update status or read state across selected inquiries (`{ messageIds: string[], status?: 'unread' | 'pending' | 'resolved', isRead?: boolean }`, requires `contact.manage`).
- `POST /admin/contact-messages/bulk-delete`: Batch permanently delete selected inquiries (`{ messageIds: string[] }`, requires `contact.manage`).

