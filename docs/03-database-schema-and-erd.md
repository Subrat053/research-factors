# 03. DATABASE SCHEMA & ENTITY RELATIONSHIP DESIGN

## 1. Database Philosophy & Universal Portability

The database is built on PostgreSQL with **Prisma ORM**. All tables use UUIDv4 identifiers for primary keys, preventing sequential enumeration attacks and facilitating distributed migrations.

### Universal Connection Guarantee
The backend binds exclusively to a single connection string:
```bash
DATABASE_URL="postgresql://user:password@host:port/database?sslmode=prefer"
```
The Prisma client is initialized without any cloud-vendor specific logic. It operates identically across:
1. Local PostgreSQL in Docker
2. Neon Serverless PostgreSQL (with connection pooling)
3. Managed cloud instances (AWS RDS, Supabase, DigitalOcean Managed DB)

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    User ||--o{ UserRole : has
    Role ||--o{ UserRole : assigned_to
    Role ||--o{ RolePermission : has
    Permission ||--o{ RolePermission : granted_in
    User ||--o| AuthorProfile : owns
    User ||--o{ Article : writes
    Category ||--o{ Article : categorizes
    Article ||--o{ ArticleBlock : contains
    Article ||--o{ ArticleTag : tagged_with
    Tag ||--o{ ArticleTag : applies_to
    Article ||--o{ ArticleSlugHistory : tracks
    User ||--o{ Comment : writes
    Article ||--o{ Comment : receives
    Comment ||--o{ Comment : parent_of
    User ||--o{ CommentLike : likes
    Comment ||--o{ CommentLike : receives
    User ||--o{ CommentReport : flags
    User ||--o{ Bookmark : saves
    Article ||--o{ Bookmark : saved_in
    User ||--o{ Notification : receives
    User ||--o{ Media : uploads
    User ||--o{ AuditLog : acts_in
    User ||--o{ ArticleFeedback : gives
    Article ||--o{ ArticleFeedback : receives
    User ||--o{ UserArticleTypePreference : has
```

---

## 3. Production Prisma Schema (`schema.prisma`)

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  DEACTIVATED
}

enum ArticleStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  PUBLISHED
  REJECTED
  ARCHIVED
}

enum ArticleType {
  RESEARCH
  REVIEW
  COMPARISON
  GUIDE
  ANALYSIS
  OPINION
}

enum CommentStatus {
  VISIBLE
  PENDING
  HIDDEN
  REPORTED
  DELETED
}

enum ReportReason {
  SPAM
  OFFENSIVE
  HARASSMENT
  MISINFORMATION
  PERSONAL_INFO
  PROMOTIONAL
  OTHER
}

// ================= AUTH & RBAC =================

model User {
  id               String       @id @default(uuid()) @db.Uuid
  email            String       @unique
  passwordHash     String       @map("password_hash")
  firstName        String       @map("first_name")
  lastName         String       @map("last_name")
  avatarUrl        String?      @map("avatar_url")
  bio              String?
  status           UserStatus   @default(ACTIVE)
  isEmailVerified  Boolean      @default(false) @map("is_email_verified")
  emailVerifyToken String?      @map("email_verify_token")
  resetPasswordToken String?    @map("reset_password_token")
  resetPasswordExpires DateTime? @map("reset_password_expires")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  // Relations
  roles            UserRole[]
  authorProfile    AuthorProfile?
  articles         Article[]
  comments         Comment[]
  commentLikes     CommentLike[]
  commentReports   CommentReport[]
  bookmarks        Bookmark[]
  notifications    Notification[]
  media            Media[]
  auditLogs        AuditLog[]   @relation("ActorAudit")

  @@index([email])
  @@index([status])
  @@map("users")
}

model Role {
  id          String           @id @default(uuid()) @db.Uuid
  name        String           @unique // e.g., 'GUEST', 'USER', 'AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'
  description String?
  isSystem    Boolean          @default(false) @map("is_system")
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  users       UserRole[]
  permissions RolePermission[]

  @@map("roles")
}

model Permission {
  id          String           @id @default(uuid()) @db.Uuid
  action      String           @unique // e.g. 'article.create', 'article.publish'
  module      String           // e.g. 'article', 'comment', 'user'
  description String?
  createdAt   DateTime         @default(now()) @map("created_at")

  roles       RolePermission[]

  @@map("permissions")
}

model UserRole {
  userId    String   @map("user_id") @db.Uuid
  roleId    String   @map("role_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      Role     @relation(fields: [roleId], references: [id], onDelete: Cascade)

  @@id([userId, roleId])
  @@map("user_roles")
}

model RolePermission {
  roleId       String     @map("role_id") @db.Uuid
  permissionId String     @map("permission_id") @db.Uuid
  createdAt    DateTime   @default(now()) @map("created_at")

  role         Role       @relation(fields: [roleId], references: [id], onDelete: Cascade)
  permission   Permission @relation(fields: [permissionId], references: [id], onDelete: Cascade)

  @@id([roleId, permissionId])
  @@map("role_permissions")
}

model AuthorProfile {
  id          String   @id @default(uuid()) @db.Uuid
  userId      String   @unique @map("user_id") @db.Uuid
  headline    String?
  biography   String?
  websiteUrl  String?  @map("website_url")
  twitterUrl  String?  @map("twitter_url")
  linkedinUrl String?  @map("linkedin_url")
  githubUrl   String?  @map("github_url")
  isApproved  Boolean  @default(false) @map("is_approved")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("author_profiles")
}

// ================= ARTICLES & BLOCKS =================

model Category {
  id             String     @id @default(uuid()) @db.Uuid
  name           String     @unique
  slug           String     @unique
  description    String?
  imageUrl       String?    @map("image_url")
  isActive       Boolean    @default(true) @map("is_active")
  showInFooter   Boolean    @default(true) @map("show_in_footer")
  seoTitle       String?    @map("seo_title")
  seoDescription String?    @map("seo_description")
  seoKeywords    String?    @map("seo_keywords")
  canonicalUrl   String?    @map("canonical_url")
  parentId       String?    @map("parent_id") @db.Uuid
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")

  parent         Category?  @relation("CategoryHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children       Category[] @relation("CategoryHierarchy")
  articles       Article[]

  @@index([slug])
  @@index([isActive])
  @@index([showInFooter])
  @@map("categories")
}

model Tag {
  id        String       @id @default(uuid()) @db.Uuid
  name      String       @unique
  slug      String       @unique
  createdAt DateTime     @default(now()) @map("created_at")

  articles  ArticleTag[]

  @@index([slug])
  @@map("tags")
}

model Article {
  id             String          @id @default(uuid()) @db.Uuid
  title          String
  slug           String          @unique
  subtitle       String?
  excerpt        String?
  coverImageUrl  String?         @map("cover_image_url")
  coverImageAlt  String?         @map("cover_image_alt")
  type           ArticleType     @default(RESEARCH)
  status         ArticleStatus   @default(DRAFT)
  readingTimeMin Int             @default(1) @map("reading_time_min")
  viewCount      Int             @default(0) @map("view_count")
  seoTitle       String?         @map("seo_title")
  seoDescription String?         @map("seo_description")
  canonicalUrl   String?         @map("canonical_url")
  scheduledAt    DateTime?       @map("scheduled_at")
  publishedAt    DateTime?       @map("published_at")
  rejectionReason String?        @map("rejection_reason")
  hasUnpublishedChanges Boolean        @default(false) @map("has_unpublished_changes")
  draftData       Json?                @map("draft_data")
  authorId        String          @map("author_id") @db.Uuid
  categoryId     String          @map("category_id") @db.Uuid
  createdById    String          @map("created_by_id") @db.Uuid
  publishedById  String?         @map("published_by_id") @db.Uuid
  createdAt      DateTime        @default(now()) @map("created_at")
  updatedAt      DateTime        @updatedAt @map("updated_at")

  // Relations
  author         User            @relation(fields: [authorId], references: [id], onDelete: Restrict)
  category       Category        @relation(fields: [categoryId], references: [id], onDelete: Restrict)
  blocks         ArticleBlock[]
  tags           ArticleTag[]
  comments       Comment[]
  bookmarks      Bookmark[]
  slugHistory    ArticleSlugHistory[]

  @@index([slug])
  @@index([status, publishedAt])
  @@index([authorId])
  @@index([categoryId])
  @@index([type])
  @@map("articles")
}

model ArticleBlock {
  id        String   @id @default(uuid()) @db.Uuid
  articleId String   @map("article_id") @db.Uuid
  blockType String   @map("block_type") // paragraph, heading, image, table, comparison, quote, callout, embed, divider
  position  Int
  content   Json     // Standardized block JSON payload
  metadata  Json?    // Optional styling or presentation flags
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([articleId, position])
  @@map("article_blocks")
}

model ArticleTag {
  articleId String   @map("article_id") @db.Uuid
  tagId     String   @map("tag_id") @db.Uuid

  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@id([articleId, tagId])
  @@map("article_tags")
}

model ArticleSlugHistory {
  id        String   @id @default(uuid()) @db.Uuid
  slug      String   @unique
  articleId String   @map("article_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@index([slug])
  @@map("article_slug_history")
}

// ================= MEDIA =================

model Media {
  id           String   @id @default(uuid()) @db.Uuid
  provider     String   // 'local', 'cloudinary', 'r2'
  storageKey   String   @map("storage_key")
  publicUrl    String   @map("public_url")
  originalName String   @map("original_name")
  mimeType     String   @map("mime_type")
  sizeBytes    Int      @map("size_bytes")
  width        Int?
  height       Int?
  altText      String?  @map("alt_text")
  caption      String?
  source       String?
  license      String?
  createdById  String   @map("created_by_id") @db.Uuid
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  createdBy    User     @relation(fields: [createdById], references: [id], onDelete: Restrict)

  @@index([storageKey])
  @@index([createdById])
  @@map("media")
}

// ================= COMMUNITY =================

model Comment {
  id        String        @id @default(uuid()) @db.Uuid
  articleId String        @map("article_id") @db.Uuid
  userId    String        @map("user_id") @db.Uuid
  parentId  String?       @map("parent_id") @db.Uuid
  depth     Int           @default(0) // Guard rail: 0 (root), 1 (reply), max 2
  content   String
  status    CommentStatus @default(VISIBLE)
  likeCount Int           @default(0) @map("like_count")
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")

  article   Article       @relation(fields: [articleId], references: [id], onDelete: Cascade)
  user      User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Comment?      @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[]     @relation("CommentReplies")
  likes     CommentLike[]
  reports   CommentReport[]

  @@index([articleId, status, createdAt])
  @@index([parentId])
  @@index([userId])
  @@map("comments")
}

model CommentLike {
  userId    String   @map("user_id") @db.Uuid
  commentId String   @map("comment_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  comment   Comment  @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@id([userId, commentId])
  @@map("comment_likes")
}

model CommentReport {
  id        String       @id @default(uuid()) @db.Uuid
  commentId String       @map("comment_id") @db.Uuid
  userId    String       @map("user_id") @db.Uuid
  reason    ReportReason
  details   String?
  createdAt DateTime     @default(now()) @map("created_at")

  comment   Comment      @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, commentId]) // Enforces single report per user per comment
  @@index([commentId])
  @@map("comment_reports")
}

model Bookmark {
  userId    String   @map("user_id") @db.Uuid
  articleId String   @map("article_id") @db.Uuid
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  article   Article  @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@id([userId, articleId])
  @@map("bookmarks")
}

model Notification {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  type      String   // 'COMMENT_REPLY', 'COMMENT_LIKE', 'ARTICLE_APPROVED', 'ARTICLE_PUBLISHED', etc.
  title     String
  message   String
  entityId  String?  @map("entity_id")
  isRead    Boolean  @default(false) @map("is_read")
  createdAt DateTime @default(now()) @map("created_at")

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, isRead, createdAt])
  @@map("notifications")
}

// ================= SYSTEM & AUDIT =================

model ContactMessage {
  id        String   @id @default(uuid()) @db.Uuid
  name      String
  email     String
  subject   String
  message   String
  isRead    Boolean  @default(false) @map("is_read")
  isResolved Boolean @default(false) @map("is_resolved")
  createdAt DateTime @default(now()) @map("created_at")

  @@index([isRead, createdAt])
  @@map("contact_messages")
}

model AuditLog {
  id         String   @id @default(uuid()) @db.Uuid
  actorId    String?  @map("actor_id") @db.Uuid
  action     String   // 'ARTICLE_APPROVED', 'USER_SUSPENDED', etc.
  entityType String   @map("entity_type")
  entityId   String   @map("entity_id")
  metadata   Json?
  createdAt  DateTime @default(now()) @map("created_at")

  actor      User?    @relation("ActorAudit", fields: [actorId], references: [id], onDelete: SetNull)

  @@index([entityType, entityId])
  @@index([actorId, createdAt])
  @@map("audit_logs")
}

// ================= RECOMMENDATION & PERSONALIZATION =================

enum ArticleFeedbackType {
  LIKE
  DISLIKE
}

model ArticleFeedback {
  id           String              @id @default(uuid()) @db.Uuid
  canonicalId  String              @map("canonical_id")
  visitorId    String              @map("visitor_id")
  userId       String?             @map("user_id") @db.Uuid
  articleId    String              @map("article_id") @db.Uuid
  feedbackType ArticleFeedbackType @map("feedback_type")
  createdAt    DateTime            @default(now()) @map("created_at")
  updatedAt    DateTime            @updatedAt @map("updated_at")

  user         User?               @relation(fields: [userId], references: [id], onDelete: Cascade)
  article      Article             @relation(fields: [articleId], references: [id], onDelete: Cascade)

  @@unique([canonicalId, articleId])
  @@index([visitorId, articleId])
  @@index([userId, articleId])
  @@index([articleId, feedbackType])
  @@map("article_feedbacks")
}

model UserArticleTypePreference {
  id               String       @id @default(uuid()) @db.Uuid
  canonicalId      String       @map("canonical_id")
  visitorId        String       @map("visitor_id")
  userId           String?      @map("user_id") @db.Uuid
  articleType      ArticleType  @map("article_type")
  positiveScore    Float        @default(0) @map("positive_score")
  negativeScore    Float        @default(0) @map("negative_score")
  interactionCount Int          @default(1) @map("interaction_count")
  lastInteractedAt DateTime     @default(now()) @map("last_interacted_at")
  createdAt        DateTime     @default(now()) @map("created_at")
  updatedAt        DateTime     @updatedAt @map("updated_at")

  user             User?        @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([canonicalId, articleType])
  @@index([visitorId])
  @@index([userId])
  @@index([articleType])
  @@map("user_article_type_preferences")
}
```

---

## 4. Staged Draft Revision Buffer Architecture (`hasUnpublishedChanges` & `draftData`)

### 1. Architectural Problem & Live Isolation Guarantee
In digital journalism and research publishing, editing an already live, peer-reviewed, published article must **never** auto-publish incomplete sentences, temporary drafts, or unapproved revisions to readers or search engine crawlers.

To eliminate this vulnerability while preserving the convenience of debounced autosave:
1. The `Article` model incorporates a dedicated JSON staging buffer:
   - `hasUnpublishedChanges` (`has_unpublished_changes`): Boolean flag default `false`.
   - `draftData` (`draft_data`): Nullable JSON column storing pending manuscript changes.
2. **Public Isolation**:
   - `ArticleService.getPublishedArticles` and `ArticleService.getArticleBySlug` strictly read the normalized, live `Article` columns and relational `article_blocks` rows. They ignore `draftData`.
   - Public readers and search engine scrapers will never encounter partial or unapproved edits while an author is actively typing.

### 2. Lifecycle Database Invariants

```
                             [ Author edits PUBLISHED article ]
                                             │
                                             ▼
                                  [ Autosave Triggered ]
                                             │
                                             ▼
                             [ PATCH /articles/:id/draft ]
                                             │
                         ┌───────────────────┴───────────────────┐
                         ▼                                       ▼
               If status === 'DRAFT'                   If status === 'PUBLISHED'
              Direct transactional write:             Safe staged buffer write:
              - tx.article.update(fields)             - tx.article.update({
              - tx.articleBlock.deleteMany()              draftData: payload,
              - tx.articleBlock.createMany(blocks)        hasUnpublishedChanges: true,
              - tx.articleTag.sync()                      updatedAt: new Date()
                                                        })
                                                      - Zero modification to live blocks!
```

### 3. State Commitment & Discard Flow
- **Direct Commit & Live Publication** (`POST /api/v1/articles/:id/modify-changes` with `article.publish`):
  - Commits `draftData` inside an interactive Prisma transaction (`prisma.$transaction`).
  - Updates normalized `Article` columns, replaces `article_blocks` rows, synchronizes `article_tags`, and updates `seo_metadata`.
  - Sets `hasUnpublishedChanges = false` and `draftData = null`.
- **Editorial Review Submission** (`POST /api/v1/articles/:id/modify-changes` without `article.publish`):
  - Stages modifications into `draftData`, sets `hasUnpublishedChanges = true`, transitions status to `PENDING_REVIEW`, and logs audit trail.
  - Live article blocks remain untouched on the public site until an editor approves and publishes the review queue item.
- **Draft Discard** (`POST /api/v1/articles/:id/discard-draft`):
  - Transactionally clears `draftData = null` and resets `hasUnpublishedChanges = false`.
  - Reverts the author workspace back to the active live published version with zero data loss or orphan blocks.
