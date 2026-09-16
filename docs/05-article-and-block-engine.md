# 05. ARTICLE & BLOCK EDITOR ENGINE

## 1. Editorial Architecture Overview

Articles in Research Factors are structured digital publications rather than unformatted blobs of raw HTML. The editing system uses **Tiptap v2**, serialized and stored as modular, ordered records in the `ArticleBlock` database table.

This block-based architecture ensures:
1. **Clean Data Portability**: Content can be rendered natively across web, mobile apps, RSS feeds, or headless syndication.
2. **Safe Rendering**: Prevents stored XSS attacks by validating block schemas on write and rendering with approved React components.
3. **Extensibility**: New block types (e.g. interactive charts, polls, audio players) can be introduced without altering existing articles.

---

## 2. Article State Machine Lifecycle

```
                 ┌────────────────────────────────┐
                 │             DRAFT              │ ◄────────┐
                 └────────────────────────────────┘          │
                                  │                          │
                        submitForReview()                    │
                                  ▼                          │
                 ┌────────────────────────────────┐          │
                 │         PENDING_REVIEW         │          │
                 └────────────────────────────────┘          │
                                  │                          │
                    ┌─────────────┴─────────────┐            │
                    │                           │            │
            approveArticle()             rejectArticle()     │
                    │                           │            │
                    ▼                           ▼            │
         ┌───────────────────┐        ┌───────────────────┐  │
         │     APPROVED      │        │     REJECTED      │──┘
         └───────────────────┘        └───────────────────┘ (Author edits)
                    │
            publishArticle()
                    │
                    ▼
         ┌───────────────────┐
         │     PUBLISHED     │
         └───────────────────┘
                    │
            archiveArticle()
                    │
                    ▼
         ┌───────────────────┐
         │     ARCHIVED      │
         └───────────────────┘
```

---

## 3. Supported Content Blocks & JSON Schemas

Each block in `ArticleBlock` contains `blockType`, integer `position`, and a structured `content` JSON payload.

### 1. Paragraph Block (`paragraph`)
```json
{
  "type": "paragraph",
  "content": {
    "text": "Recent empirical studies indicate that quantum computing accelerates optimization algorithms by a factor of..."
  }
}
```

### 2. Heading Block (`heading`)
```json
{
  "type": "heading",
  "content": {
    "level": 2,
    "text": "Methodology and Experimental Setup"
  }
}
```

### 3. Image Block (`image`)
```json
{
  "type": "image",
  "content": {
    "mediaId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "url": "https://cdn.researchfactors.com/media/quantum-setup.webp",
    "caption": "Figure 1: Cryogenic chamber test array.",
    "alt": "Laboratory setup of quantum processing unit"
  }
}
```

### 4. Comparison Table Block (`comparison`)
```json
{
  "type": "comparison",
  "content": {
    "headers": ["Feature", "Classical Architecture", "Quantum Hybrid"],
    "rows": [
      {
        "label": "Time Complexity",
        "values": ["O(2^n) exponential", "O(n^2) polynomial"]
      },
      {
        "label": "Thermal Dissipation",
        "values": ["Standard air/liquid cooling", "Sub-Kelvin dilution refrigeration"]
      }
    ]
  }
}
```

### 5. Callout / Key Takeaway Block (`callout`)
```json
{
  "type": "callout",
  "content": {
    "variant": "info", // "info" | "warning" | "key_finding" | "quote"
    "title": "Key Finding",
    "text": "The hybrid processor maintained 99.4% gate fidelity over a continuous 72-hour benchmark."
  }
}
```

### 6. Quote Block (`quote`)
```json
{
  "type": "quote",
  "content": {
    "quote": "Science is not a body of facts; it is a way of thinking.",
    "author": "Carl Sagan",
    "source": "The Demon-Haunted World"
  }
}
```

### 7. Embed Block (`embed`)
```json
{
  "type": "embed",
  "content": {
    "provider": "youtube", // "youtube" | "vimeo" | "github_gist"
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "caption": "Video demonstration of real-time simulation"
  }
}
```

---

## 4. Autosave Engine & Concurrency Protections

### Frontend Autosave Implementation
- When an author edits an article in `ArticleEditor.jsx`, changes trigger a **debounced save hook** (1,500ms debounce).
- Status indicator states:
  - `IDLE`: "All changes saved"
  - `DIRTY`: "Unsaved changes..."
  - `SAVING`: "Saving draft..."
  - `SAVED`: "Saved just now"
  - `ERROR`: "Save failed — Click to retry"
- A `beforeunload` event listener prevents tab closure if `isDirty` is true.

### Backend Upsert Strategy
- Autosave hits `PATCH /api/v1/articles/:id/draft`.
- The server updates the article header fields and executes a transactional block replacement:
  ```javascript
  await prisma.$transaction(async (tx) => {
    // 1. Update article summary and timestamp
    await tx.article.update({
      where: { id: articleId },
      data: { title, excerpt, categoryId, updatedAt: new Date() }
    });

    // 2. Wipe existing blocks and rewrite updated sequence
    await tx.articleBlock.deleteMany({ where: { articleId } });
    await tx.articleBlock.createMany({
      data: blocks.map((b, idx) => ({
        articleId,
        blockType: b.type,
        position: idx,
        content: b.content,
        metadata: b.metadata || {}
      }))
    });
  });
  ```

---

## 5. Slug Collisions & Canonical URL Preservation

### Unique Slug Algorithm
Slugs are generated from the article title using strict transliteration (`slugify`).
If a slug collision occurs:
1. Append an incrementing integer (`-2`, `-3`, etc.).
2. Once published, the slug is locked.
3. If an editor updates a published article's slug:
   - The old slug is recorded in `ArticleSlugHistory`.
   - The public router automatically executes an HTTP 301 redirect from old slugs to the current canonical URL.

---

## 6. Secure Draft Preview Engine

- Draft articles must NEVER be crawled by search engines.
- Previews are accessible via:
  `GET /author/articles/:id/preview`
- The backend validates session permissions (`req.user.id === article.authorId` or `article.read_draft` permission).
- The response sets strict HTTP headers:
  ```http
  X-Robots-Tag: noindex, nofollow, noarchive
  Cache-Control: private, no-cache, no-store
  ```

---

## 7. Authoring Studio & Interactive Block Matrix Implementation

The manuscript editor (`/editor` and `/editor/:id`) in [`ArticleEditorPage.jsx`](file:///d:/Wizmonk/ResearchFactor/frontend/src/pages/author/ArticleEditorPage.jsx) provides a dynamic, resilient block authoring studio:

### 1. Dynamic RBAC Permission Checks
All actions are conditionally enabled based on the author's resolved permissions via `useAuth().hasPermission`:
- `article.create`: Required to access the manuscript studio and initialize new drafts.
- `article.update_own`: Enforced on `PATCH /api/v1/articles/:id/draft`.
- `article.submit`: Required to trigger `POST /api/v1/articles/:id/submit`. Submitting users without this permission are given an informative alert.
- `media.upload`: Required to upload manual image files. If unavailable, authors are informed and offered an external URL fallback.

### 2. Manual Media Upload Pipeline
- Integrated with [`media.api.js`](file:///d:/Wizmonk/ResearchFactor/frontend/src/services/media.api.js), sending `multipart/form-data` to `POST /api/v1/media/upload`.
- Files undergo Sharp optimization (stripped EXIF, converted to WebP at 82% quality, auto-rotated) and storage delegation via `StorageFactory` (Local, Cloudinary, or R2).
- Supported across both **Cover Image** and **Media Image Blocks** with live thumbnail previews, remove/replace buttons, alt text, and captions.

### 3. Interactive Content Block Form Controls
- **Heading**: H2 Section vs. H3 Subsection level toggles with title input.
- **Paragraph**: Multiline prose textarea with live word count, storing both clean text and semantic HTML.
- **Pull Quote**: Dedicated inputs for quotation prose, author attribution, and publication source citation.
- **Callout Box**: Multi-variant selector (`info`, `warning`, `tip`), title input, and observation body text.
- **Comparison Matrix Table**: Visual spreadsheet-style editor supporting dynamic `+ Add Column`, `- Remove Column`, `+ Add Row`, and `- Remove Row` with real-time JSON synchronization.
- **Media Image**: Drag-and-drop or file picker uploading via Sharp WebP, URL fallback, alt description, and figure caption.
- **Divider**: Visual horizontal break separator with reorder and delete controls.

### 4. Review Submission Resilience & Workflow Status Guards
- Pre-submission validation asserts title length (>= 5 chars), required primary category, and at least one content block.
- Automatically synchronizes and saves any pending block changes before submitting.
- Reflects the active manuscript status (`Draft`, `Under Review`, `Published`, `Changes Requested`) in the editor header badge.
- Re-submission is safely guarded when status is `PENDING_REVIEW`, displaying an informative `<Clock /> Under Review` state and preventing redundant 400 Bad Request submissions.
- When an article has status `REJECTED`, editorial notes (`rejectionReason`) are prominently surfaced, and the submit button adapts to `Re-submit for Review`.
- Alert popups (`activeAlert`) automatically auto-hide after 5 seconds while preserving the manual dismiss button.

### 5. Featured Article Promotion & Homepage Masthead
- Articles can be designated as **Featured** (`is_featured: true`) during editorial review in [`ArticleReviewQueuePage.jsx`](file:///d:/Wizmonk/ResearchFactor/frontend/src/pages/admin/ArticleReviewQueuePage.jsx) via a single `Featured` toggle.
- Backend exposes `GET /api/v1/articles/featured` to retrieve the latest featured published research.
- The Homepage masthead (`HomePage.jsx`) queries this endpoint, displaying the featured article in the hero slot (`<ArticleCard variant="featured" />`) with an editorial `Featured` badge and deduplicating it from the general feed.

---

## 8. Future Roadmap for Article Engine

1. **WYSIWYG Inline Formatting Toolbar**:
   - Embed lightweight inline marks (bold, italic, code snippet, footnote superscript, and hyperlinks) directly inside paragraph textareas via Tiptap extension integration.
2. **Draft Revisions & Rollback History**:
   - Introduce an `ArticleRevision` model in PostgreSQL to snapshot manuscript states on every explicit save or review submission, allowing authors to compare diffs and restore previous checkpoints.
3. **Collaborative Draft Presence & Soft Locking**:
   - Implement WebSocket heartbeats or Redis locks to prevent concurrent overwrites when multiple co-authors collaborate on the same research manuscript.
4. **Clipboard Image Paste & Drag-and-Drop Inserter**:
   - Support pasting images directly from the OS clipboard into the editor canvas, auto-uploading them via `mediaApi.upload` into a new `image` block.
5. **BibTeX & DOI Citation Importer**:
   - Provide an automatic metadata extractor that populates quote and reference blocks by resolving Digital Object Identifiers (DOIs) or pasting BibTeX records.
