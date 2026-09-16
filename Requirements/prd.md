# RESEARCH FACTORS

## Production-Grade Research Publishing & Community Platform

### Master PRD + Technical Architecture + Implementation Specification

---

# 1. PROJECT OVERVIEW

Build a production-ready, scalable web application named:

# Research Factors

Suggested tagline:

> Research. Read. Share.

Research Factors is a research-based digital publishing platform where authors can create and publish structured articles, research pieces, reviews, comparisons, analysis, guides, opinions, and other editorial content.

Articles must support rich content such as:

* Text
* Headings
* Images
* Image galleries
* Tables
* Comparison tables
* Quotes
* Lists
* Videos/embeds
* Links
* Callouts
* Charts or data blocks
* Other extensible content blocks

Public users should experience the platform primarily as a modern digital publication/newspaper/magazine.

Readers can:

* Read articles
* Search articles
* Browse categories
* View authors
* Register/login
* Comment
* Reply to comments
* Like/helpful comments
* Report comments
* Bookmark articles
* Share articles
* Manage their profile
* Receive notifications

Authors can:

* Create articles
* Save drafts
* Edit drafts
* Preview articles
* Submit articles for editorial review
* See approval/rejection status
* Edit rejected articles
* Manage their published articles
* View basic article statistics

Editors/Admins can:

* Review articles
* Approve/reject articles
* Publish/unpublish articles
* Schedule articles
* Manage authors
* Manage users
* Manage categories/tags
* Manage media
* Moderate comments
* Manage reports
* Manage contact enquiries
* Manage permissions
* View audit logs
* Manage platform configuration

The system must be designed for scalability, security, maintainability, SEO, accessibility, performance, and future feature expansion.

---

# 2. CORE PRODUCT PRINCIPLE

The platform revolves around one core workflow:

Author researches a topic
↓
Author creates article
↓
Author adds rich content
↓
Author saves draft
↓
Author submits for review
↓
Editor/Admin reviews
↓
Approve / Reject
↓
Publish
↓
Public reads article
↓
Readers share thoughts
↓
Comments/replies
↓
Moderation

Do not over-engineer the initial product with complex research intelligence, evidence graphs, product databases, recommendation engines, or AI decision systems.

The article is the primary content entity.

Future functionality must be possible without requiring a complete architectural rewrite.

---

# 3. TECHNOLOGY STACK

## Frontend

Use:

* React.js
* JavaScript, NOT TypeScript
* Vite
* React Router
* Tailwind CSS
* TanStack Query
* React Hook Form
* Zod
* Axios or fetch abstraction
* Tiptap for rich article editing
* Lucide React or another consistent icon library

Do not use Next.js.

The frontend must communicate with the backend through APIs.

---

# 4. BACKEND

Use:

* Node.js
* Express.js
* JavaScript
* REST API
* Prisma ORM
* PostgreSQL

Structure the backend as a modular monolith.

Do NOT use:

* Laravel
* PHP
* Filament
* Microservices for V1

The architecture should make it possible to extract services later if necessary.

---

# 5. DATABASE PROVIDER REQUIREMENT

The application MUST support PostgreSQL through a single environment variable:

DATABASE_URL

The application must work with:

1. Local PostgreSQL
2. Neon PostgreSQL
3. Managed PostgreSQL server
4. Production PostgreSQL server
5. Other PostgreSQL-compatible hosting

Example:

DATABASE_URL="postgresql://user@localhost:5432/research_factors"

or:

DATABASE_URL="postgresql://user@neon-host/database?sslmode=require"

The application code MUST NOT contain provider-specific database connection logic.

Do not hardcode:

* Host
* Port
* Username
* Password
* Database name
* Neon-specific logic
* Localhost-specific logic

Only environment configuration should change.

Prisma must use DATABASE_URL.

---

# 6. DATABASE ARCHITECTURE

Use PostgreSQL with Prisma.

Database schema must be normalized and designed for future growth.

Initial major entities:

* User
* Role
* Permission
* UserRole
* RolePermission
* AuthorProfile
* Article
* ArticleBlock
* Category
* Tag
* ArticleTag
* Media
* Comment
* CommentLike
* CommentReport
* Bookmark
* Notification
* ContactMessage
* AuditLog

Additional entities can be introduced only where justified.

Use:

* UUID primary keys
* Foreign keys
* Proper indexes
* Unique constraints
* Created timestamps
* Updated timestamps
* Soft deletion where appropriate
* Referential integrity

Use UTC timestamps in the database.

---

# 7. USER ROLES

Implement RBAC.

Initial roles:

## Guest

Can:

* View public pages
* View articles
* Browse categories
* Search
* View author profiles

Cannot:

* Comment
* Bookmark
* Like
* Create articles
* Access private dashboards

## User

Can:

* Everything Guest can do
* Comment
* Reply
* Like comments
* Report comments
* Bookmark articles
* Manage profile
* Manage notifications

## Author

Can:

* Everything User can do
* Create articles
* Edit own drafts
* Submit articles
* View own article status
* View own article statistics
* Manage author profile

Cannot:

* Publish directly unless explicitly granted permission
* Edit another author's article
* Manage users
* Manage platform settings

## Editor

Can:

* Review articles
* Edit articles where permitted
* Approve articles
* Reject articles
* Publish articles
* Unpublish articles
* Schedule articles
* Moderate comments
* Manage categories/tags
* Manage media

## Admin

Can:

* Manage users
* Manage authors
* Manage editors
* Manage articles
* Manage comments
* Manage categories
* Manage tags
* Manage media
* Manage reports
* Manage contact messages
* Manage permissions
* View audit logs

## Super Admin

Full system access.

Can:

* Manage roles
* Manage permissions
* Manage administrators
* Manage system configuration
* Perform all administrative actions

---

# 8. RBAC IMPLEMENTATION

Do NOT scatter role checks throughout the application.

Do not build logic like:

if user.role === "admin"

in hundreds of files.

Implement centralized authorization.

Example conceptual structure:

permissions:

article.create
article.read
article.update
article.delete
article.submit
article.approve
article.reject
article.publish
article.unpublish
article.schedule

comment.create
comment.update
comment.delete
comment.moderate
comment.report

user.read
user.update
user.suspend

category.create
category.update
category.delete

media.upload
media.delete

system.settings
audit.read

Use middleware/policies to verify permissions.

Also enforce resource ownership.

An Author must never be able to edit another author's article simply by changing an article ID in an API request.

---

# 9. AUTHENTICATION

Implement secure authentication.

Required:

* Register
* Login
* Logout
* Email verification
* Forgot password
* Reset password
* Change password
* Session/token management
* Account activation/deactivation

Use secure password hashing such as Argon2id or bcrypt.

Prefer secure HttpOnly cookies for authentication/session tokens where appropriate.

Never expose password hashes.

Never return sensitive authentication information in normal API responses.

Implement:

* Rate limiting
* Login attempt protection
* Input validation
* Secure cookies
* Security headers

---

# 10. PUBLIC WEBSITE

Create a clean, modern editorial design.

The website should feel like:

* Digital magazine
* Modern newspaper
* Research publication
* Editorial website

It should NOT feel like:

* An admin dashboard
* A generic SaaS dashboard
* A basic blog template

---

# 11. PUBLIC ROUTES

Implement approximately:

/
/research
/research/
/research//
/categories
/authors
/authors/
/search
/about
/editorial-policy
/community-guidelines
/privacy-policy
/terms
/cookie-policy
/disclaimer
/contact
/login
/register
/forgot-password
/reset-password

Authenticated:

/account
/account/profile
/account/bookmarks
/account/comments
/account/notifications
/account/settings

Author:

/author/dashboard
/author/articles
/author/articles/create
/author/articles//edit
/author/articles//preview

Admin:

/admin
/admin/articles
/admin/articles/
/admin/users
/admin/authors
/admin/categories
/admin/tags
/admin/media
/admin/comments
/admin/reports
/admin/contact-messages
/admin/roles
/admin/permissions
/admin/audit-logs
/admin/settings

Use route guards.

---

# 12. LANDING PAGE

Build a high-quality homepage.

Sections:

## Header

Logo:

Research Factors

Navigation:

* Home
* Research
* Categories
* Authors
* Trending

Search

Sign In

Join

Responsive mobile navigation.

---

## Hero

Headline:

> Research that helps you understand the world.

Supporting text:

> Explore researched articles, reviews, comparisons, analysis and perspectives across products, technology, business and more.

Search input:

> What are you researching?

CTA:

Explore Research

Secondary CTA:

Become an Author

---

## Featured Research

Large editorial cards.

Each card should show:

* Cover image
* Category
* Article type
* Title
* Excerpt
* Author
* Date
* Reading time

---

## Latest Research

Responsive article grid/list.

---

## Trending

Show articles based on configurable engagement metrics.

---

## Categories

Display selected categories.

---

## Popular Discussions

Display articles with active reader discussions.

---

## Featured Authors

Display selected authors.

---

## Author CTA

> Have something worth researching?

> Publish your research and share your perspective with the world.

CTA:

Become an Author

---

## Footer

Include:

* About
* Research
* Categories
* Authors
* Contact
* Editorial Policy
* Community Guidelines
* Privacy
* Terms
* Disclaimer
* Social links

---

# 13. RESEARCH LISTING PAGE

Route:

/research

Features:

* Search
* Category filter
* Article type filter
* Author filter
* Date filter
* Sort by latest
* Sort by popular
* Sort by most discussed

Article cards should display:

* Image
* Category
* Type
* Title
* Excerpt
* Author
* Date
* Reading time
* Comment count

Use server-side pagination.

Do not depend only on infinite scroll.

---

# 14. CATEGORY PAGE

Example:

/research/technology

Show:

* Category title
* Category description
* Featured articles
* Latest articles
* Trending articles
* Most discussed articles

Category pages must have unique SEO metadata.

---

# 15. ARTICLE PAGE

This is the primary public content page.

Structure:

Breadcrumbs

Category

Article type

Title

Subtitle/excerpt

Author

Publication date

Updated date where applicable

Reading time

Cover image

Article content

Article blocks

Conclusion if provided

Tags

Share controls

Bookmark button

Article metadata

Author information

Community discussion

Related articles

---

# 16. ARTICLE CONTENT BLOCK SYSTEM

Use Tiptap.

The article editor must support extensible blocks.

Initial block types:

1. Paragraph
2. Heading
3. Image
4. Image Gallery
5. Table
6. Comparison Table
7. Quote
8. Ordered List
9. Unordered List
10. Video Embed
11. External Embed
12. Link
13. Callout
14. Divider
15. Chart/Data block if implemented

The architecture must make adding new block types later easy.

Do not store arbitrary executable HTML.

Sanitize content.

---

# 17. ARTICLE BLOCK STORAGE

Article content should be structured.

Use ArticleBlock.

Fields conceptually:

id
articleId
blockType
position
content
metadata
createdAt
updatedAt

Content can be JSON.

Example conceptual block:

{
"type": "paragraph",
"content": {
"text": "Article paragraph..."
}
}

Image:

{
"type": "image",
"content": {
"mediaId": "..."
},
"metadata": {
"alt": "...",
"caption": "..."
}
}

Comparison:

{
"type": "comparison",
"content": {
"columns": [...],
"rows": [...]
}
}

The frontend renderer must render blocks based on blockType.

---

# 18. ARTICLE TYPES

Initial article types:

* Research
* Review
* Comparison
* Guide
* Analysis
* Opinion

Admin should be able to configure available article types if useful.

Do not create separate database structures for each article type.

All should use the same Article entity.

---

# 19. ARTICLE STATUS

Implement:

* DRAFT
* PENDING_REVIEW
* APPROVED
* PUBLISHED
* REJECTED
* ARCHIVED

Workflow:

Author creates DRAFT.

Author submits.

Status becomes PENDING_REVIEW.

Editor reviews.

Approve:

APPROVED

Publish:

PUBLISHED

Reject:

REJECTED

Author edits and resubmits.

---

# 20. ARTICLE VERSIONING

Do not implement complex Git-like version control in V1.

However, design the system so future versioning is possible.

At minimum maintain:

* createdAt
* updatedAt
* publishedAt
* updatedBy
* publishedBy

Admin/editor actions must be recorded in AuditLog.

---

# 21. ARTICLE PREVIEW

Authors and editors must be able to preview an article before publication.

Preview must resemble the actual public article page.

Draft content must NOT be publicly indexable.

Use secure preview access.

---

# 22. ARTICLE SCHEDULING

Allow Editors/Admins to schedule publication.

Fields:

publishedAt
scheduledAt
status

A background job should publish scheduled articles.

Do not depend on a user manually opening the admin panel.

---

# 23. AUTHOR DASHBOARD

Dashboard should show:

* Total articles
* Drafts
* Pending review
* Published
* Rejected
* Total views
* Total comments

Author article list:

* Title
* Status
* Category
* Created
* Updated
* Published
* Views
* Comments
* Actions

---

# 24. AUTHOR ARTICLE CREATION

Form:

Title

Subtitle/Excerpt

Cover Image

Category

Article Type

Tags

Content Editor

SEO Title

SEO Description

Optional canonical URL

Buttons:

Save Draft

Preview

Submit for Review

Autosave drafts where practical.

Warn before navigating away with unsaved changes.

---

# 25. ADMIN ARTICLE MANAGEMENT

Admin/editor must be able to:

* Search articles
* Filter by status
* Filter author
* Filter category
* Edit
* Preview
* Approve
* Reject
* Publish
* Unpublish
* Schedule
* Archive
* Delete where permitted

Reject action must allow a reason.

---

# 26. USER COMMENTS

Users can comment on published articles.

Comment fields:

* id
* articleId
* userId
* parentId
* content
* status
* createdAt
* updatedAt

Support nested replies.

Limit nesting depth to avoid unusable discussion trees.

Recommended:

Maximum 2–3 levels.

---

# 27. COMMENT MODERATION

Comment status:

* VISIBLE
* PENDING
* HIDDEN
* REPORTED
* DELETED

Admin/editor can:

* Hide
* Delete
* Restore
* Review
* Suspend user if necessary

---

# 28. COMMENT REPORTING

Users can report comments.

Reasons:

* Spam
* Offensive
* Harassment
* Misinformation
* Personal information
* Promotional content
* Other

Store report records.

Prevent users from repeatedly submitting unlimited reports for the same comment.

---

# 29. COMMENT LIKES

Users can mark comments as helpful/liked.

Enforce unique constraint:

userId + commentId

Prevent duplicate likes.

---

# 30. BOOKMARKS

Users can save articles.

Unique constraint:

userId + articleId

Account page:

Saved Research

Provide remove bookmark functionality.

---

# 31. NOTIFICATIONS

Initial notification types:

* Comment reply
* Comment like
* Article approved
* Article rejected
* Article published
* Account-related notifications

Users can mark notifications:

* Read
* Unread

Implement pagination.

---

# 32. MEDIA ARCHITECTURE

This is a CRITICAL requirement.

The application MUST NOT tightly couple article logic to Cloudinary, R2, local filesystem, or any specific storage vendor.

Implement a storage abstraction layer.

Concept:

MediaService

with methods such as:

upload()
delete()
getUrl()
getPublicUrl()
getMetadata()
exists()

The application should communicate only with MediaService.

---

# 33. STORAGE PROVIDER CONFIGURATION

Use environment configuration:

STORAGE_PROVIDER=local

or:

STORAGE_PROVIDER=cloudinary

or:

STORAGE_PROVIDER=r2

The rest of the application must not need modification.

Example:

STORAGE_PROVIDER=cloudinary

Then configure:

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

For R2:

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_URL

For local:

LOCAL_STORAGE_PATH
LOCAL_STORAGE_PUBLIC_URL

The storage adapter handles provider-specific logic.

---

# 34. STORAGE INTERFACE

Create a common interface/contract conceptually:

StorageProvider

upload(file, options)

delete(fileKey)

getUrl(fileKey)

exists(fileKey)

getMetadata(fileKey)

Do not put provider-specific logic in controllers.

---

# 35. PROVIDER ADAPTERS

Implement:

LocalStorageProvider

CloudinaryStorageProvider

R2StorageProvider

Potential future:

S3StorageProvider

Each provider implements the same interface.

Example architecture:

storage/
StorageProvider.js
StorageFactory.js
providers/
LocalStorageProvider.js
CloudinaryStorageProvider.js
R2StorageProvider.js

Application:

const storage = StorageFactory.getProvider();

Then:

storage.upload(...)

Never:

if cloudinary then ...

throughout the application.

---

# 36. MEDIA DATABASE RECORD

Media entity should store metadata such as:

id
provider
storageKey
url or public identifier where appropriate
originalName
mimeType
size
width
height
altText
caption
createdBy
createdAt
updatedAt

Do not assume every provider uses the same identifier.

storageKey must be abstract enough to represent:

* Local file path/key
* R2 object key
* Cloudinary public ID

---

# 37. MEDIA UPLOAD FLOW

Preferred:

Frontend
↓
Backend validation
↓
Storage service
↓
Provider adapter
↓
Storage provider
↓
Media database record
↓
Return media object

For high-scale uploads, design the architecture so direct signed uploads can be introduced later.

---

# 38. IMAGE PROCESSING

Images must be optimized.

Support:

* JPEG
* PNG
* WebP
* AVIF where practical

Validate:

* MIME type
* file size
* dimensions
* actual file content

Generate optimized sizes/thumbnails where appropriate.

Do not blindly trust file extensions.

Use Sharp or equivalent image-processing library.

---

# 39. MEDIA SECURITY

Protect against:

* Malicious file uploads
* Unsupported formats
* Oversized files
* Fake MIME types
* Path traversal
* Executable uploads

Never execute uploaded files.

Local storage must prevent path traversal.

---

# 40. SEARCH

V1:

Use PostgreSQL full-text search.

Search:

* Article title
* Excerpt
* Article content
* Tags
* Author name
* Category

Use indexes where appropriate.

Design SearchService abstraction so a future provider such as Meilisearch/OpenSearch can be added without rewriting article logic.

---

# 41. SEO

SEO must be implemented from the beginning.

Every public article must support:

* SEO title
* Meta description
* Canonical URL
* Open Graph title
* Open Graph description
* Open Graph image
* Twitter/X card metadata
* Structured data
* Breadcrumb structured data where appropriate

Do not duplicate metadata across all pages.

---

# 42. SEO ARTICLE STRUCTURE

Article page should expose crawlable HTML content.

Because frontend is React, implement appropriate SSR/prerendering strategy if required for production SEO.

Do not assume that client-side rendering alone is sufficient.

Use a React-compatible SEO rendering strategy that allows search engines to reliably access article content and metadata.

---

# 43. SEO URLS

Use human-readable slugs.

Example:

/research/technology/best-laptops-for-developers

Not:

/article?id=123

Slugs must be unique.

When changing a published slug:

* preserve old slug
* create redirect
* prevent broken backlinks

---

# 44. SITEMAPS

Implement:

/robots.txt

/sitemap.xml

If content grows significantly, use sitemap indexes and separate sitemaps.

Include:

* Published articles
* Categories
* Authors where useful

Do not include:

* Drafts
* Rejected articles
* Private pages
* Admin pages
* User account pages

---

# 45. STRUCTURED DATA

Implement schema.org structured data where appropriate.

Possible types:

* Article
* BlogPosting
* NewsArticle only when genuinely applicable
* Person for authors
* BreadcrumbList

Do not add misleading structured data.

---

# 46. 404 AND ERROR PAGES

Create:

404 page

500/error page

Network error states

Empty states

Loading states

Skeleton loaders

Permission denied page

Unauthorized page

---

# 47. ACCESSIBILITY

Implement:

* Semantic HTML
* Keyboard navigation
* Accessible forms
* Proper labels
* Focus states
* Alt text
* Accessible modals
* Accessible dropdowns
* Screen-reader-friendly controls
* Sufficient contrast
* Reduced-motion consideration

Do not rely only on color to communicate state.

---

# 48. RESPONSIVE DESIGN

Must support:

* Desktop
* Laptop
* Tablet
* Mobile

Article reading experience must be optimized for mobile.

Do not simply shrink desktop layout.

---

# 49. DESIGN SYSTEM

Create reusable components.

Examples:

Layout:

Header
Footer
Container
Section

Typography:

Heading
Text
Label
Badge

Content:

ArticleCard
AuthorCard
CategoryCard
Comment
CommentThread
ArticleRenderer
Table
ComparisonTable
ImageBlock
QuoteBlock
CalloutBlock

Forms:

Input
Textarea
Select
Checkbox
Button
Modal
Dropdown

Feedback:

Toast
Alert
Skeleton
EmptyState
ErrorState

Use consistent spacing, typography, border radius, shadows, and responsive behavior.

---

# 50. ADMIN UI & EDITORIAL BACKOFFICE

The Admin interface is completely separate visually from the public magazine, styled with an elite, dark-mode editorial dashboard aesthetic (`AdminLayout`) featuring:

* Persistent, responsive collateral sidebar with role-aware navigational grouping (`Core Editorial`, `Taxonomy & Assets`, `Community & Moderation`, `Governance & Security`, `Super Admin Systems`)
* Live database connectivity pulse indicator
* User profile badge with prominent `SUPER_ADMIN` / `STAFF_ADMIN` tier indicator
* Editorial stat cards and responsive KPI metrics
* Full-featured data tables with pagination, search, status pills, and direct inspection links
* Granular modal dialogs (Suspension with mandatory audit reasons, Role assignment, Tag Merge, Scheduling, Feedback)
* Zero external framework coupling (no Filament, no TypeScript; built exclusively with React, Tailwind CSS, TanStack Query, and Lucide React)

---

# 50.1. ROLE-BASED ACCESS CONTROL (RBAC) & PERMISSION MATRIX (SUPER ADMIN EXCLUSIVE)

Super Admin has exclusive governance over platform roles and permissions:

* **Role Management**:
  * View all system roles (`SUPER_ADMIN`, `ADMIN`, `EDITOR`, `AUTHOR`, `USER`, `GUEST`) and custom user-defined roles.
  * Create custom roles with tailored permission subsets.
  * Update description and permissions of custom roles.
  * Prevent deletion or renaming of core system roles (`isSystem: true`).
* **Atomic Permission Catalog**:
  * 34 granular permissions across 8 architectural domains (`article.*`, `comment.*`, `category.*`, `tag.*`, `media.*`, `user.*`, `author.*`, `role.*`, `admin.*`, `report.*`, `contact.*`, `audit.*`).
  * Permission assignment matrix interface grouped by domain module with quick toggle checkboxes.
  * **Super Admin Core Lockout Protection**: Core governance permissions (`role.manage`, `admin.manage`, `user.assign_role`, `audit.read`) cannot be stripped from the `SUPER_ADMIN` role.

---

# 50.2. SYSTEM SETTINGS & PLATFORM DIAGNOSTICS (SUPER ADMIN EXCLUSIVE)

Super Admin can configure and monitor the platform in real time:

* **Platform Configuration**:
  * `general`: Site name, tagline, logo URL, support email, maintenance mode switch.
  * `seo`: Default meta title, meta description, OpenGraph image URL, Twitter handle.
  * `policies`: Terms of Service, Privacy Policy, Editorial Guidelines markdown content.
  * Configuration persisted via `SystemSetting` key-value model in PostgreSQL.
* **SMTP Outbound Test Console**:
  * Send live test emails via configured `EmailService` to verify SMTP connectivity and dispatch.
* **Real-Time System Diagnostics**:
  * Live PostgreSQL query latency telemetry.
  * Configured storage provider status (`local`, `cloudinary`, or `r2`).
  * Node.js runtime process metrics (RSS, heap memory allocation, process uptime).

---

# 51. ADMIN DASHBOARD

Show real-time aggregated metrics via optimized SQL grouping:

* Total manuscripts & breakdown (Published, Pending Review, Drafts, Rejected, Archived)
* Total comments & reported comments
* Total users & verified accredited authors
* Total categories & total keyword tags
* Unread public contact inquiries
* Recent manuscript submissions table with author, status, and direct live inspection links
* Quick administrative launcher cards

---

# 52. CATEGORY MANAGEMENT

Admin can:

* Create new categories with auto-generated slugs
* Edit category name, description, and hierarchy
* Manage hierarchical parent-child category trees
* Prevent cyclical or self-parenting references
* Prevent deletion when articles or subcategories are actively assigned (Safe deletion validation)

---

# 53. TAG MANAGEMENT & MERGE UTILITY

Admin can:

* Create, edit, and search keyword tags
* Prevent duplicate tag slugs or names
* **Tag Merge Utility (`POST /api/v1/admin/tags/merge`)**:
  * Select source tags and consolidate them into a designated target tag.
  * Atomically re-link all article associations (`ArticleTag`) to the target tag within a Prisma transaction.
  * Remove redundant source tags and record an immutable audit log of the merge operation.

---

# 54. USER MANAGEMENT & ANTI-ESCALATION SAFEGUARDS

Admin can:

* Search and filter users by query, status (`ACTIVE`, `SUSPENDED`, `DEACTIVATED`), and assigned role
* View user registration date, verified status, and article/comment counts
* **Status Modulation**:
  * Activate, deactivate, or suspend accounts.
  * Suspending an account requires a mandatory audit reason logged to `AuditLog`.
  * Suspended users are immediately blocked from logging in or mutating resources (`ACCOUNT_SUSPENDED`).
* **Role Allocation**:
  * Assign or remove roles from user accounts.
* **Anti-Privilege Escalation Barriers**:
  * Standard `ADMIN` users CANNOT grant `ADMIN` or `SUPER_ADMIN` roles (`FORBIDDEN_ELEVATE_ADMIN`).
  * Standard `ADMIN` users CANNOT suspend, deactivate, or alter roles of `SUPER_ADMIN` accounts (`FORBIDDEN_MUTATE_SUPER_ADMIN`).
* **Self-Lockout Prevention**:
  * The system prohibits demoting or suspending the last active `SUPER_ADMIN` (`LAST_SUPER_ADMIN_IMMUTABLE`).

---

# 55. AUTHOR ACCREDITATION MANAGEMENT

Admin can:

* Review pending author accreditation applications with credentials, bio, and portfolio links
* Approve applications (automatically grants the `AUTHOR` role and marks `isApproved: true`)
* Reject applications with structured editorial feedback notes sent to the applicant
* Update author headline, biography, and academic affiliations
* View author submission history and published research metrics

---

# 55.1. MANUSCRIPT LIFECYCLE & FORCE ACTIONS

Admin can:

* Browse all platform manuscripts across all statuses (`DRAFT`, `PENDING_REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`, `REJECTED`)
* Review pending manuscripts with full block-rendered prose inspection
* Approve manuscripts for immediate publication or scheduling
* Return manuscripts to authors with line-by-line editorial feedback notes
* Archive live articles
* Schedule article publication for future timestamps
* Force delete manuscripts with cascade cleanup across tags, comments, bookmarks, and block content

---

# 55.2. COMMUNITY REPORT TRIAGE

Admin can:

* View reported comments flagged by readers with violation categories (`SPAM`, `HARASSMENT`, `MISINFORMATION`, `OTHER`) and reporter notes
* Dismiss reports if standard editorial compliance is met
* Hide comment from public article view
* Delete comment permanently from the database
* Suspend offending comment author directly from the moderation queue with reason logging

---

# 56. CONTACT MANAGEMENT

Contact form fields:

* Name
* Email
* Subject
* Message

Admin can:

* View incoming messages in an editorial inbox
* Mark messages as read / unread
* Mark messages as resolved
* Delete resolved inquiries
* Direct mailto reply shortcut to contact email

---

# 56.1. MEDIA ASSET EXPLORER & PURGING

Admin can:

* Browse platform-wide uploaded media assets with mime type, file dimensions, file size, and uploader attribution
* Filter by storage provider (`local`, `cloudinary`, `r2`)
* Copy public CDN URLs
* Force delete orphaned or policy-violating media (purges database record and calls `StorageFactory.delete()` on physical storage provider)

---

# 56.2. IMMUTABLE AUDIT LOGGING

Platform records immutable audit entries for all sensitive actions:

* `user.status_change`, `user.role_change`
* `author.approved`, `author.rejected`
* `article.scheduled`, `article.archived`, `article.force_delete`
* `tag.merged`
* `settings.update`
* `report.resolved`, `comment.moderated`
* Contains `userId`, `action`, `resourceType`, `resourceId`, IP address, user agent, and JSON `payload` inspector in admin UI.


---

# 57. EMAIL SYSTEM

Create an email abstraction.

Do not hardcode a specific email provider.

Environment:

EMAIL_PROVIDER=smtp

or future providers.

Support SMTP configuration.

Example:

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM_EMAIL
SMTP_FROM_NAME

Create EmailService abstraction so provider can later be changed.

Email types:

* Verification
* Password reset
* Welcome
* Article submitted
* Article approved
* Article rejected
* Comment reply
* Contact notification

---

# 58. BACKGROUND JOBS

Use Redis + BullMQ when asynchronous jobs are required.

Jobs:

* Scheduled publishing
* Email sending
* Notification processing
* Image processing
* Search indexing
* Analytics aggregation
* Cleanup tasks

Do not make users wait for non-critical background operations.

---

# 59. REDIS

Redis can be used for:

* Caching
* Rate limiting
* Queue
* Temporary data
* Job processing

Do not make the application completely dependent on Redis for basic CRUD functionality.

If Redis is unavailable, critical database operations should remain understandable and fail gracefully.

---

# 60. API ARCHITECTURE

Use versioned APIs.

Example:

/api/v1/auth
/api/v1/users
/api/v1/articles
/api/v1/categories
/api/v1/tags
/api/v1/comments
/api/v1/media
/api/v1/search
/api/v1/authors
/api/v1/bookmarks
/api/v1/notifications
/api/v1/admin

Use RESTful conventions.

---

# 61. API RESPONSE FORMAT

Use consistent responses.

Success:

{
"success": true,
"data": {...},
"message": "..."
}

Error:

{
"success": false,
"error": {
"code": "VALIDATION_ERROR",
"message": "Invalid request",
"details": [...]
}
}

Do not leak stack traces in production.

---

# 62. VALIDATION

Validate all external input.

Use Zod or another schema validation solution.

Validate:

* Body
* Query
* Params
* File uploads

Never trust frontend validation alone.

---

# 63. SECURITY

Implement:

* Helmet
* CORS
* Rate limiting
* Request size limits
* Input validation
* Output sanitization
* XSS protection
* Secure cookies
* Password hashing
* Authorization middleware
* Resource ownership checks
* File upload validation
* SQL injection protection through Prisma
* CSRF protection where applicable
* Security headers

Never expose:

* DATABASE_URL
* API secrets
* Cloudinary secret
* R2 secret
* SMTP password
* JWT signing secrets

---

# 64. ENVIRONMENT CONFIGURATION

Create:

.env.example

Example categories:

APP_ENV
APP_URL
API_URL
PORT

DATABASE_URL

AUTH_SECRET
JWT_SECRET

STORAGE_PROVIDER

LOCAL_STORAGE_PATH
LOCAL_STORAGE_PUBLIC_URL

CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET

R2_ACCOUNT_ID
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
R2_PUBLIC_URL

REDIS_URL

SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
SMTP_FROM_EMAIL
SMTP_FROM_NAME

SENTRY_DSN

Do not commit .env.

---

# 65. CONFIGURATION ARCHITECTURE

Create centralized configuration.

Example conceptual structure:

config/
app.js
database.js
auth.js
storage.js
email.js
redis.js

Validate required environment variables when the application starts.

Fail early with a clear configuration error.

Do not scatter process.env throughout business logic.

---

# 66. DATABASE MIGRATIONS

Use Prisma migrations.

Commands should support:

* Development migration
* Production migration
* Prisma generate
* Seed

Never modify production schema manually without migration tracking.

---

# 67. SEED DATA

Create seed data for development.

Include:

* Super Admin
* Admin
* Editor
* Author
* User
* Sample categories
* Sample tags
* Sample articles

Do not use real passwords in production seed data.

Use development-only credentials from environment variables.

---

# 68. DATABASE INDEXING

Add indexes for common queries.

Examples:

Article:

status
slug
authorId
categoryId
publishedAt
createdAt

Comment:

articleId
userId
parentId
status
createdAt

User:

email
status

Category:

slug

Tag:

slug

Avoid blindly indexing every column.

---

# 69. SLUG MANAGEMENT

Create reusable slug utilities.

Requirements:

* Unique slug
* URL-safe
* Stable after publication
* Collision handling

Example:

best-smartphones

If collision:

best-smartphones-2

When published slug changes, maintain redirect mapping.

Consider an ArticleSlugHistory table.

---

# 70. ARTICLE VIEW ANALYTICS

Initial analytics can track:

* Article views
* Approximate unique views
* Referrer
* Device category
* Timestamp

Do not store unnecessary personal data.

Avoid counting every refresh as a meaningful unique visitor.

Use aggregation where appropriate.

---

# 71. AUDIT LOGGING

Record sensitive administrative actions.

Example:

Admin A

approved article X

Editor B

rejected article Y

Admin C

suspended user Z

Fields:

id
actorId
action
entityType
entityId
metadata
createdAt

Do not store sensitive secrets inside audit metadata.

---

# 72. ERROR MONITORING

Integrate Sentry or equivalent.

Monitor:

* Frontend errors
* Backend errors
* API failures
* Background job failures

Do not expose internal error details to users.

---

# 73. LOGGING

Implement structured server logs.

Include:

* timestamp
* request ID
* method
* path
* status
* duration
* error code

Avoid logging:

* passwords
* tokens
* secrets
* sensitive personal data

---

# 74. REQUEST ID

Every API request should have a request/correlation ID.

Use it for:

* logs
* error tracking
* debugging

Return a safe request ID in error responses where useful.

---

# 75. RATE LIMITING

Rate-limit:

* Login
* Registration
* Password reset
* Comment creation
* Contact form
* Article submission
* Media uploads
* Search where necessary

Use Redis-backed rate limiting when scaling.

---

# 76. CACHING

Cache read-heavy content where useful.

Potential cache targets:

* Homepage
* Category lists
* Popular articles
* Article metadata
* Public author profiles

Never cache private user data publicly.

Invalidate caches when content changes.

---

# 77. PERFORMANCE

Target:

* Fast first load
* Fast article rendering
* Optimized images
* Minimal unnecessary API calls
* Database pagination
* Lazy loading
* CDN delivery
* Compression
* Efficient indexes

Do not load all comments on the article page.

Paginate comments.

---

# 78. API PAGINATION

Use consistent pagination.

Example:

?page=1&limit=20

Response:

{
"items": [],
"pagination": {
"page": 1,
"limit": 20,
"total": 100,
"totalPages": 5
}
}

Set safe maximum limits.

---

# 79. ARTICLE COMMENTS PAGINATION

Initial article request should NOT return thousands of comments.

Load:

* First page
* Then pagination/load more

Replies should also be controlled.

---

# 80. FRONTEND STATE MANAGEMENT

Do not put everything into global state.

Use:

TanStack Query for server state.

Local React state for:

* UI state
* Modals
* Editor state where appropriate
* Temporary form state

Use a lightweight global state library only if genuinely required.

---

# 81. API CLIENT

Create a centralized API client.

Example conceptual structure:

api/
client.js
auth.js
articles.js
comments.js
users.js
media.js
categories.js
authors.js
admin.js

Do not scatter raw fetch calls throughout components.

---

# 82. ERROR HANDLING FRONTEND

Create reusable:

* API error handler
* Toast
* Form errors
* Empty state
* Retry state
* Loading state

Example:

Network unavailable

> We couldn't connect to the server. Please try again.

---

# 83. ARTICLE EDITOR UX

Editor should provide:

* Autosave
* Keyboard shortcuts where useful
* Drag/reorder blocks
* Image upload
* Table editing
* Preview
* Word count
* Reading time estimate
* Unsaved changes warning

Do not make the editor unnecessarily complex.

---

# 84. IMAGE UX

When uploading image:

* Preview
* Upload progress
* Error state
* Alt text field
* Caption field
* Replace image
* Remove image

Image should not be inserted into article until upload succeeds.

---

# 85. DRAFT AUTOSAVE

Implement autosave carefully.

Possible approach:

Save after a short debounce.

Do not create hundreds of database records.

Use update/upsert.

Show:

> Saved just now

or:

> Saving...

or:

> Unable to save

---

# 86. ARTICLE SEO EDITOR

Authors/editors should have optional:

SEO Title

SEO Description

Social Image

Canonical URL

Use sensible fallbacks:

SEO title → Article title

SEO description → Article excerpt

OG image → Article cover image

---

# 87. PUBLIC ARTICLE SOCIAL SHARING

Support:

* Copy link
* WhatsApp
* Facebook
* X
* LinkedIn

Use proper Open Graph metadata.

---

# 88. RELATED ARTICLES

Article page should display related articles based on:

* Category
* Tags
* Content similarity where available

V1 can use simple category/tag matching.

Do not introduce AI recommendations initially.

---

# 89. TRENDING LOGIC

V1 can use a simple weighted formula.

Example:

score =
views

* comments × weight
* bookmarks × weight
* recentness factor

Keep the algorithm configurable.

Do not make it an ML system.

---

# 90. CONTENT DISCOVERY

Public users should easily find:

* Latest
* Trending
* Most discussed
* Categories
* Authors
* Search results

---

# 91. USER PROFILE

Public profile can show:

* Name
* Profile image
* Bio
* Join date

For users who choose to expose it.

Do not expose private email by default.

---

# 92. PRIVACY

Private user data must not be returned through public APIs.

Do not expose:

* Email unless intentionally public
* Password information
* Internal IDs where unnecessary
* Tokens
* Admin information
* Private profile fields

Public APIs should use DTO/response serializers rather than returning entire database records.

---

# 93. DATA OWNERSHIP

Users should be able to:

* Update profile
* Change password
* Manage account
* Request account deletion where required
* Manage notification preferences

Implement appropriate privacy/legal workflows based on applicable law.

---

# 94. MODERATION ARCHITECTURE

Build moderation as a first-class feature.

Moderation queue should show:

* Reported comments
* Pending comments if enabled
* Suspicious activity
* User reports

Admin can:

* Review
* Hide
* Delete
* Restore
* Take user action

---

# 95. ANTI-SPAM

Initial protections:

* Rate limiting
* Email verification
* Comment length limits
* Link limits
* Duplicate detection
* Basic spam checks
* Report mechanism

Design for future integration with external anti-spam services.

---

# 96. CONTENT SAFETY

Users must not be allowed to inject:

* JavaScript
* arbitrary iframe code
* executable HTML

Only allow approved embeds/providers.

Sanitize rich content.

---

# 97. COPYRIGHT / MEDIA

Media records should support:

* Source
* Copyright attribution
* Alt text
* Caption
* License metadata where applicable

Do not assume that an image found online is free to use.

---

# 98. EDITORIAL PAGES

Create:

## About Research Factors

Explain:

* Mission
* Content purpose
* Platform philosophy

## Editorial Policy

Explain:

* Editorial standards
* Corrections
* Author responsibilities
* Commercial disclosures

## Community Guidelines

Explain:

* Comment standards
* Prohibited behavior
* Reporting

## Disclaimer

Explain:

* Informational nature
* Appropriate limitations

---

# 99. COMMERCIAL FUTURE COMPATIBILITY

The architecture should allow future features such as:

* Sponsored articles
* Affiliate links
* Advertising
* Company profiles
* Premium content

But do NOT implement these unnecessarily in V1.

When implemented, commercial content must be clearly distinguishable from editorial content.

---

# 100. ADMIN SETTINGS

Keep settings limited.

Useful settings:

* Site name
* Tagline
* Logo
* Favicon
* Contact email
* Social links
* Default SEO settings
* Comment configuration
* Registration configuration

Do not make every piece of website content admin-configurable.

Most UI content should remain code-driven/static.

---

# 101. EMAIL SMTP SETTINGS

If SMTP is configured, provide test email functionality for Admin.

Do not store SMTP credentials in normal database tables unless there is a compelling security architecture.

Prefer environment/secrets management.

---

# 102. FILE STORAGE SWITCHING

This is NON-NEGOTIABLE.

Switching:

STORAGE_PROVIDER=local

to:

STORAGE_PROVIDER=cloudinary

must not require changes to:

* Article controllers
* Article services
* User services
* Admin services
* React components

Only configuration and provider adapter should change.

Same requirement for R2.

---

# 103. DATABASE SWITCHING

This is NON-NEGOTIABLE.

Switching:

DATABASE_URL

from:

local PostgreSQL

to:

Neon PostgreSQL

to:

server PostgreSQL

must not require application code changes.

Only environment configuration should change.

Prisma migrations must remain compatible with supported PostgreSQL environments.

---

# 104. FUTURE STORAGE MIGRATION

Design media records so that storage migration can be performed later.

Example:

Current:

Cloudinary

Future:

R2

A migration utility should eventually be able to:

1. Read media records
2. Download/copy source
3. Upload to new provider
4. Update provider/storageKey
5. Verify destination
6. Optionally delete old file

Do not require this utility in V1, but architecture must allow it.

---

# 105. PROJECT STRUCTURE

Use a clean modular structure.

Frontend example:

src/
app/
assets/
components/
common/
layout/
article/
comments/
forms/
pages/
public/
auth/
account/
author/
admin/
features/
articles/
comments/
auth/
users/
media/
categories/
hooks/
services/
api/
utils/
validators/
routes/
styles/

Backend:

src/
config/
controllers/
services/
repositories/
routes/
middleware/
validators/
policies/
utils/
modules/
auth/
users/
authors/
articles/
comments/
categories/
tags/
media/
notifications/
search/
admin/
storage/
StorageProvider.js
StorageFactory.js
providers/
LocalStorageProvider.js
CloudinaryStorageProvider.js
R2StorageProvider.js
email/
EmailService.js
jobs/
prisma/
app.js
server.js

Keep business logic out of route handlers.

---

# 106. SERVICE LAYER

Controllers should be thin.

Bad:

Route
→ 300 lines of database logic

Good:

Route
→ Controller
→ Validation
→ Authorization
→ Service
→ Repository/Prisma

Business rules belong in services.

---

# 107. REPOSITORY LAYER

Do not blindly create repositories for every trivial Prisma call.

Use repository/data-access abstractions where they provide meaningful separation.

Do not create unnecessary architectural ceremony.

---

# 108. TRANSACTIONS

Use Prisma transactions when multiple database changes must succeed/fail together.

Examples:

* Article publication + related state updates
* User/role changes
* Comment/report actions
* Bookmark operations where needed

---

# 109. CONCURRENCY

Protect against race conditions.

Examples:

* Duplicate bookmarks
* Duplicate likes
* Duplicate slugs
* Simultaneous article publishing
* Simultaneous comment moderation

Use database constraints as the final protection.

---

# 110. SOFT DELETE

Consider soft deletion for:

* Users
* Articles
* Comments
* Media

where recovery/audit requirements justify it.

Do not blindly soft-delete everything.

---

# 111. TESTING

Implement tests from the beginning.

## Unit tests

Test:

* Permission logic
* Slug generation
* Article state transitions
* Validation
* Storage provider selection
* Utility functions

## Integration/API tests

Test:

* Registration
* Login
* Article creation
* Article submission
* Approval
* Publishing
* Comments
* Bookmarks
* Permissions
* Media upload

## E2E tests

Important flows:

1. User registration
2. User login
3. User comments
4. User bookmarks
5. Author creates article
6. Author submits article
7. Editor approves article
8. Editor publishes article
9. Public reader sees article
10. Reader comments
11. Admin moderates comment

---

# 112. STORAGE PROVIDER TESTS

Create provider contract tests.

The same test suite should run against:

LocalStorageProvider

CloudinaryStorageProvider

R2StorageProvider

Where integration credentials are available.

This ensures provider switching doesn't break application behavior.

---

# 113. DATABASE TESTING

Use a separate test PostgreSQL database.

Never run destructive automated tests against production.

---

# 114. CI/CD

Set up GitHub Actions or equivalent.

Pipeline:

Push
↓
Install
↓
Lint
↓
Unit tests
↓
Integration tests
↓
Build
↓
Deploy

Production deployment should only occur after required checks pass.

---

# 115. ENVIRONMENT SEPARATION

Have:

Development

Testing

Staging

Production

Each environment must have separate:

* DATABASE_URL
* storage configuration
* Redis
* email configuration
* secrets

Never use production credentials locally.

---

# 116. BACKUPS

Production PostgreSQL must have automated backups.

Define:

* Backup frequency
* Retention
* Recovery procedure

Test restoration periodically.

A backup that has never been restored/tested should not be considered reliable.

---

# 117. DEPLOYMENT

Recommended simple architecture:

Frontend:
React deployment/CDN

Backend:
Node.js server/container

Database:
Managed PostgreSQL

Storage:
Cloudinary or R2

Redis:
Managed Redis where needed

DNS/CDN/WAF:
Cloudflare

Do not start with Kubernetes unless actual scale requires it.

---

# 118. SCALABILITY PRINCIPLES

Build stateless API servers.

Do not store application state only in server memory.

Use:

* PostgreSQL for persistent data
* Redis for shared temporary state/cache/queues
* Object storage for media
* CDN for public assets

This allows multiple backend instances later.

---

# 119. DATABASE CONNECTION POOLING

Use appropriate PostgreSQL connection pooling.

For serverless/managed databases such as Neon, follow provider-supported pooling recommendations.

Do not create uncontrolled database connections per request.

---

# 120. HEALTH CHECKS

Implement:

GET /health

and where useful:

GET /ready

Health should indicate:

* Application running
* Database connectivity
* Required infrastructure status

Do not expose sensitive configuration.

---

# 121. GRACEFUL SHUTDOWN

Node server must gracefully handle:

SIGTERM

SIGINT

Close:

* HTTP server
* Database connections
* Redis connections
* Queue workers

---

# 122. SEO + PERFORMANCE ACCEPTANCE CRITERIA

Public pages should:

* Load quickly
* Have correct title
* Have unique description
* Have canonical URL
* Have proper Open Graph metadata
* Have crawlable content
* Have optimized images
* Have responsive layout
* Have valid sitemap
* Have robots.txt
* Have appropriate structured data

---

# 123. SECURITY ACCEPTANCE CRITERIA

Verify:

* Author cannot edit another author's article
* User cannot access admin endpoints
* Editor cannot change restricted system settings
* Guest cannot comment
* Unpublished article is inaccessible publicly
* Draft isn't indexed
* Deleted content doesn't remain publicly accessible
* Uploaded executable files are rejected
* XSS is sanitized
* Rate limits work
* Password reset tokens expire
* Sensitive environment variables never appear in API responses

---

# 124. ARTICLE ACCEPTANCE CRITERIA

An author must be able to:

1. Create article
2. Add title
3. Add excerpt
4. Upload cover
5. Add category
6. Add tags
7. Add content
8. Add image
9. Add table
10. Add comparison
11. Add quote
12. Add video/embed
13. Save draft
14. Preview
15. Submit for review

Editor must be able to:

16. Review
17. Reject with reason
18. Approve
19. Publish
20. Schedule
21. Unpublish

Public user must be able to:

22. Read
23. Share
24. Bookmark
25. Comment
26. Reply
27. Like
28. Report

---

# 125. UX PRINCIPLES

The entire website must prioritize:

* Simplicity
* Readability
* Fast navigation
* Clear hierarchy
* Minimal unnecessary forms
* Consistent interactions
* Clear feedback
* Mobile-first thinking
* Accessibility

Avoid excessive dashboards and unnecessary configuration.

---

# 126. ARTICLE READING EXPERIENCE

This is one of the highest priorities.

Article pages should have:

* Comfortable reading width
* Excellent typography
* Good line height
* Clear headings
* Image captions
* Table responsiveness
* Sticky share controls where appropriate
* Reading progress indicator optionally
* Related articles
* Clear author information
* Comment section

Do not overcrowd article pages with unnecessary UI.

---

# 127. ADMIN UX PRINCIPLES

Admin should optimize for:

* Speed
* Search
* Filtering
* Bulk workflows where useful
* Clear status
* Confirmation for destructive actions
* Auditability

---

# 128. EMPTY STATES

Every list must have a useful empty state.

Examples:

No articles:

> No research has been published yet.

No bookmarks:

> Save articles you want to read later.

No comments:

> Be the first to share your thoughts.

No notifications:

> You're all caught up.

---

# 129. LOADING STATES

Implement skeletons for:

* Article cards
* Article page
* Comments
* Author profile
* Admin tables

Do not show blank screens during normal loading.

---

# 130. ERROR STATES

Every important API operation needs:

* Loading
* Success
* Error
* Retry where appropriate

---

# 131. ACCESS CONTROL AT THREE LEVELS

Implement:

1. Route-level authorization
2. API-level authorization
3. Resource-level ownership authorization

Never trust frontend route protection as security.

Backend is authoritative.

---

# 132. PUBLIC VS PRIVATE DATA

Create explicit serializers/DTOs.

Public article response should return only public fields.

Private user response should return appropriate account data.

Admin response may contain additional fields according to permissions.

Never simply return Prisma objects directly.

---

# 133. API DOCUMENTATION

Create OpenAPI/Swagger documentation.

Document:

* Authentication
* Articles
* Comments
* Users
* Authors
* Media
* Categories
* Admin APIs

Keep documentation synchronized with API behavior.

---

# 134. DEVELOPMENT DOCUMENTATION

Create:

README.md

docs/

Include:

Architecture

Setup

Environment variables

Database

Migrations

Seeding

Storage providers

Email

Testing

Deployment

Troubleshooting

RBAC

API documentation

---

# 135. STORAGE SETUP DOCUMENTATION

Document exactly how to switch:

Local → Cloudinary

Local → R2

Cloudinary → R2

without changing application code.

Example:

Change:

STORAGE_PROVIDER=local

to:

STORAGE_PROVIDER=r2

Add required environment variables.

No controller/service/frontend code changes should be required.

---

# 136. DATABASE SETUP DOCUMENTATION

Document:

Local PostgreSQL:

DATABASE_URL=...

Neon:

DATABASE_URL=...

Production PostgreSQL:

DATABASE_URL=...

No application code change.

---

# 137. DOCKER

Docker support is recommended.

Create:

Dockerfile

docker-compose.yml

where appropriate for development.

Development compose can include:

* PostgreSQL
* Redis

Do not require Docker for developers who prefer native PostgreSQL.

---

# 138. LOCAL DEVELOPMENT

A developer should be able to:

1. Clone repository
2. Install dependencies
3. Create .env
4. Configure DATABASE_URL
5. Run Prisma migration
6. Seed database
7. Start backend
8. Start frontend

Document every step.

---

# 139. FEATURE FLAGS

Use lightweight feature flags only where useful.

Potential flags:

commentsEnabled
registrationEnabled
authorRegistrationEnabled

Do not create a complicated feature flag platform for V1.

---

# 140. FUTURE EXTENSIBILITY

Architecture should allow future modules:

* AI assistance
* Advanced search
* Recommendation engine
* Affiliate links
* Sponsored content
* Company profiles
* Paid subscriptions
* Advanced analytics
* Mobile app
* API access
* Research datasets

But these must NOT unnecessarily complicate V1.

---

# 141. WHAT NOT TO BUILD IN V1

Do NOT implement:

* Microservices
* Kubernetes
* AI recommendation engine
* Product intelligence database
* Evidence graph
* Complex research scoring
* Verified purchases
* Enterprise dashboards
* Advanced subscription system
* Complex affiliate marketplace
* Machine learning ranking
* Overly configurable CMS

Build a strong publishing platform first.

---

# 142. IMPLEMENTATION ORDER

Build in this exact logical sequence.

## Phase 1 — Foundation

* Repository
* Environment configuration
* React setup
* Express setup
* Prisma
* PostgreSQL
* Database migrations
* Error handling
* Logging
* API structure

## Phase 2 — Authentication

* User
* Role
* Permission
* Register
* Login
* Logout
* Email verification
* Password reset

## Phase 3 — RBAC

* Role management
* Permission middleware
* Resource ownership

## Phase 4 — Public UI

* Layout
* Header
* Footer
* Homepage
* Research listing
* Category
* Author
* Search

## Phase 5 — Article System

* Article
* ArticleBlock
* Tiptap
* Draft
* Preview
* Submission
* Approval
* Publishing

## Phase 6 — Media

* Storage abstraction
* Local provider
* Cloudinary provider
* R2 provider
* Image processing

## Phase 7 — Community

* Comments
* Replies
* Likes
* Reports
* Moderation
* Bookmarks
* Notifications

## Phase 8 — Admin

* Dashboard
* Users
* Authors
* Articles
* Categories
* Tags
* Media
* Comments
* Reports
* Audit logs
* Settings

## Phase 9 — SEO

* Metadata
* Sitemap
* Robots
* Canonicals
* Structured data
* Redirects

## Phase 10 — Production Hardening

* Security
* Rate limiting
* Caching
* Background jobs
* Monitoring
* Testing
* CI/CD
* Backups
* Performance optimization

---

# 143. DEFINITION OF DONE

The application is NOT considered complete merely because pages exist.

A feature is complete only when:

* UI works
* API works
* Validation works
* Authorization works
* Database constraints exist
* Error states exist
* Loading states exist
* Mobile UI works
* Security is considered
* Tests exist for important logic
* Audit requirements are implemented where applicable
* SEO is implemented for public content where applicable
* Documentation is updated

---

# 144. CRITICAL DEVELOPMENT RULE

Before implementing any feature:

1. Understand existing architecture.
2. Check existing models.
3. Check existing permissions.
4. Check reusable components.
5. Check existing services.
6. Reuse existing abstractions.
7. Avoid duplicate logic.
8. Preserve backward compatibility.
9. Add migrations instead of destructive schema changes.
10. Add tests for important behavior.

Do not blindly overwrite existing files.

---

# 145. CODE QUALITY RULES

Use:

* Clear naming
* Small reusable functions
* Separation of concerns
* Consistent error handling
* Centralized validation
* Centralized configuration
* Centralized authorization
* Service layer for business logic
* Reusable React components

Avoid:

* Giant components
* Giant controllers
* Duplicate API calls
* Hardcoded credentials
* Hardcoded provider logic
* Direct database access from React
* Business logic inside UI components

---

# 146. FINAL ARCHITECTURE

Target architecture:

```
                 INTERNET
                     │
                CLOUDFLARE
               CDN / WAF / DNS
                     │
             ┌───────┴───────┐
             │               │
          REACT            EXPRESS
         Frontend           API
             │               │
             │          Service Layer
             │               │
             │        Authorization
             │               │
             │            Prisma
             │               │
             │          PostgreSQL
             │
             │
      ┌──────┴───────────────┐
      │                      │
  MediaService             Redis
      │                      │
┌─────┼─────┐             BullMQ
│     │     │
```

Local Cloudinary R2

Database provider:

DATABASE_URL
↓
PostgreSQL
↓
Local / Neon / Server PostgreSQL

Storage provider:

STORAGE_PROVIDER
↓
StorageFactory
↓
Local / Cloudinary / R2

This abstraction is mandatory.

---

# 147. FINAL PRODUCT PRINCIPLE

Research Factors is not initially a complex decision engine.

It is:

```
                RESEARCH
                   ↓
                ARTICLE
                   ↓
             PUBLICATION
                   ↓
                READER
                   ↓
          COMMUNITY THOUGHTS
                   ↓
              MODERATION
```

The platform must make these five things exceptionally good:

1. Authors can create beautiful researched articles.
2. Articles can contain rich media and structured data.
3. Readers can discover and read articles easily.
4. Readers can share their perspectives.
5. Editors/admins can control the entire publishing and moderation workflow securely.

Build those foundations extremely well.

Everything else should be extensible rather than mandatory.
