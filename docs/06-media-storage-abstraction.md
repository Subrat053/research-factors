# 06. MEDIA & STORAGE ABSTRACTION SYSTEM

## 1. Architectural Mandate: Zero Vendor Coupling

Per PRD Sections 32–39 and Section 102, the application must NEVER tightly couple its article, user, or media logic to Cloudinary, Cloudflare R2, AWS S3, or the local filesystem.

Switching storage providers must require **only an environment variable change**:
```bash
STORAGE_PROVIDER=local       # For local development
STORAGE_PROVIDER=cloudinary  # For Cloudinary integration
STORAGE_PROVIDER=r2          # For Cloudflare R2 / S3-compatible buckets
```
No controller, service, or React component contains any provider-specific conditionals (`if (cloudinary)`).

---

## 2. Storage Provider Pattern & Class Design

```
                     ┌───────────────────────────────┐
                     │         MediaService          │
                     └───────────────────────────────┘
                                     │
                     Calls StorageFactory.getProvider()
                                     │
                                     ▼
                     ┌───────────────────────────────┐
                     │    <<StorageProvider>>        │
                     │  - upload(fileBuffer, opts)   │
                     │  - delete(storageKey)         │
                     │  - getPublicUrl(storageKey)   │
                     │  - exists(storageKey)         │
                     │  - getMetadata(storageKey)    │
                     └───────────────────────────────┘
                                     ▲
             ┌───────────────────────┼───────────────────────┐
             │                       │                       │
 ┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────────┐
 │  LocalStorageProvider │ │CloudinaryProvider │ │  R2StorageProvider    │
 │ (Disk + Express Static│ │(Cloudinary v2 SDK)│ │(@aws-sdk/client-s3)   │
 └───────────────────────┘ └───────────────────┘ └───────────────────────┘
```

---

## 3. The `StorageProvider` Interface Contract

Every adapter must implement the exact same async methods:

```javascript
// backend/src/storage/StorageProvider.js
export class StorageProvider {
  /**
   * Uploads a processed buffer to storage
   * @param {Buffer} buffer - Clean, processed image buffer
   * @param {Object} options - { filename, mimeType, folder }
   * @returns {Promise<{ storageKey: string, publicUrl: string, sizeBytes: number }>}
   */
  async upload(buffer, options) {
    throw new Error('Method upload() must be implemented');
  }

  /**
   * Deletes a stored file by storageKey
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async delete(storageKey) {
    throw new Error('Method delete() must be implemented');
  }

  /**
   * Generates public access URL for a storage key
   * @param {string} storageKey
   * @returns {string}
   */
  getPublicUrl(storageKey) {
    throw new Error('Method getPublicUrl() must be implemented');
  }

  /**
   * Checks if asset exists
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async exists(storageKey) {
    throw new Error('Method exists() must be implemented');
  }
}
```

---

## 4. Provider Implementations

### 1. `LocalStorageProvider.js`
- Saves files to `LOCAL_STORAGE_PATH` (e.g. `./uploads/media`).
- Validates that destination paths remain strictly inside the storage directory (path traversal defense using `path.resolve` and `startsWith`).
- Returns public URLs resolved against `LOCAL_STORAGE_PUBLIC_URL` (e.g. `http://localhost:5000/uploads/media/...`).

### 2. `CloudinaryStorageProvider.js`
- Uses official `cloudinary` v2 SDK.
- Streams the processed image buffer to Cloudinary using `upload_stream`.
- Storage key stores the Cloudinary `public_id`.
- Returns Cloudinary secure CDN URL.

### 3. `R2StorageProvider.js`
- Uses `@aws-sdk/client-s3` pointing to Cloudflare R2 S3-compatible endpoint (`https://<ACCOUNT_ID>.r2.cloudflarestorage.com`).
- Uploads using `PutObjectCommand`.
- Returns public CDN URL constructed with `R2_PUBLIC_URL`.

---

## 5. Image Processing Pipeline with Sharp

All uploaded images pass through a strict processing pipeline before reaching any storage provider:

```
Incoming Multipart File (Multer memoryStorage)
   │
   ▼
1. Security & Validation
   - Check file size (max 8MB)
   - Magic byte header inspection (file-type) to reject spoofed extensions
   - Disallow SVG (to prevent embedded XSS scripts)
   ▼
2. Sharp Transformation Pipeline
   - Strip sensitive EXIF & GPS location metadata
   - Normalize rotation based on EXIF orientation
   - Resize hero/content images to maximum width 2048px (maintaining aspect ratio)
   - Convert to modern WebP format (quality: 82)
   - Generate responsive thumbnail (400px width WebP)
   ▼
3. Dispatch to StorageProvider.upload()
   ▼
4. Record in Media Table
   - Store dimensions (width, height), sizeBytes, mimeType, and storageKey
```

---

## 6. Zero-Code-Change Environment Configuration

Switching from local development to production Cloudflare R2 requires updating only `.env`:

```env
# Switch from:
# STORAGE_PROVIDER=local
# LOCAL_STORAGE_PATH="./uploads"
# LOCAL_STORAGE_PUBLIC_URL="http://localhost:5000/uploads"

# To:
STORAGE_PROVIDER=r2
R2_ACCOUNT_ID="your-cloudflare-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key-id"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET="research-factors-media"
R2_PUBLIC_URL="https://media.researchfactors.com"
```
No application code is touched.

---

## 7. Frontend Integration & Author Upload Pipeline

The frontend client consumes the storage abstraction via [`media.api.js`](file:///d:/Wizmonk/ResearchFactor/frontend/src/services/media.api.js):

```javascript
import { apiClient } from './api.client.js';

export const mediaApi = {
  upload: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.altText) formData.append('altText', metadata.altText);
    if (metadata.caption) formData.append('caption', metadata.caption);
    return apiClient.post('/media/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
  delete: (id) => apiClient.delete(`/media/${id}`)
};
```

### Key UI Features in Article Editor:
1. **Manual File Picker & Drag-and-Drop Dropzone**: Authors can drag or select PNG, JPEG, WebP, or AVIF files up to 8MB.
2. **Sharp WebP Pipeline Visual Feedback**: Live spinner and progress feedback while the server strips EXIF, resizes to max 2048px, and outputs high-efficiency WebP.
3. **Storage-Agnostic Response**: The returned `publicUrl` is immediately assigned to `coverImageUrl` or `block.content.url`, whether the server is running on Local disk (`/uploads/...`), Cloudinary CDN, or Cloudflare R2.
4. **URL Input Fallback**: Authors can seamlessly toggle to input external research image URLs directly.

---

## 8. Administrative Media Library & Content Usage System

The administrative interface (`/rf/admin/media`) provides comprehensive visibility and lifecycle management for all uploaded digital assets:

### Multi-View Display System
Administrators can toggle seamlessly between three presentation formats (persisted locally in browser state):
1. **Grid View**: Visual card matrix displaying high-resolution thumbnails, storage provider pills, dimensions/size, uploader, usage count badges, and quick actions.
2. **List View**: Horizontal rows optimizing scanning speed for large catalogs, featuring thumbnail previews, metadata pills, inline content usage summary pills, and action controls.
3. **Tabular View (Table)**: Compact editorial data table (`<table>`) detailing asset preview, storage provider, resolution, size, direct content usage button/badge, uploader, and administration actions.

### Content Usage & Reference Tracking (`GET /api/v1/admin/media/:id/usages`)
Every media asset is cross-referenced in real-time across all publication models to determine exactly where it is utilized:
- **Articles**: Checked against `coverImageUrl` (Article Cover) and `sponsorLogoUrl` (Sponsor Logo).
- **Article Blocks**: Scanned across `article_blocks` content JSON (e.g. `blockType: 'image'` at specific manuscript positions).
- **Categories**: Checked against `Category.imageUrl` (Category Header / Illustration).
- **User Profiles**: Checked against `User.avatarUrl` (Profile Avatar).
- **SEO Metadata**: Checked against `customOgImage`, `customTwitterImage`, and `generatedOgImage` (Social Share Cards).

### Interactive Asset Usage Inspector Modal
Clicking on any usage badge or "Usages" action triggers an inspector dialog displaying:
- Complete file metadata and 1-click URL copy.
- Active publication status badge (`Active in Publication` vs. `Orphaned Digital Asset (Unused)`).
- Granular list of referencing entities, specifying the exact content field (e.g. `coverImageUrl`, `content.url` in Block #3, `imageUrl`), with direct click-through links to view the public page or edit the item in the admin.

---

## 9. Profile Avatar & User Asset Upload Architecture

### Unified Pipeline for User Photos
Profile photos uploaded on `/admin/profile` pass through the identical production-ready storage architecture:
1. **Client-Side Validation & Dispatch**:
   - `handleAvatarFileChange` validates MIME types (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`) and ensures file size <= 8MB.
   - Invokes `mediaApi.upload(file, metadata)` or `mediaApi.uploadMedia(fileOrFormData)`.
2. **Server-Side Ingestion & Privacy Sanitization**:
   - Express receives the file via `multer.memoryStorage()`.
   - Sharp strips all EXIF metadata (camera serial numbers, GPS geolocation, device information).
   - Sharp auto-orients based on original orientation before stripping.
   - Converts to WebP format (`quality: 82`) and stores via active `StorageFactory.getProvider()`.
3. **Database Association & Provider Independence**:
   - Persists a `Media` record storing `provider` (`local`, `cloudinary`, `r2`), `storageKey`, and `publicUrl`.
   - Returns `{ success: true, data: { publicUrl, storageKey, ... } }`.
   - The user profile saves `avatarUrl: publicUrl` in PostgreSQL.
4. **Multi-Provider Dynamic Fetching & CDN Support (`normalizeMediaUrl`)**:
   - For local development: Automatically prepends the backend host (`http://localhost:5005/uploads/...`).
   - For production cloud deployments (Cloudflare R2, AWS S3, Cloudinary): Retains full absolute CDN URLs with zero hardcoding or code modification.
5. **Universal Reader Access (RBAC)**:
   - The atomic permission `media.upload` is assigned to all authenticated account tiers (including default `USER` role), enabling readers as well as editorial staff to upload avatars without encountering 403 Forbidden errors.

---

## 10. Dynamic Multi-Environment Storage & Single-Variable Deployment Architecture

To ensure seamless transitions between local development and cloud production (e.g. Render, Railway, AWS):

### 1. Dynamic Public Storage Base (`backend/src/config/index.js`)
- `LOCAL_STORAGE_PUBLIC_URL` automatically defaults to `${config.API_URL}/uploads`.
- Switching from local (`API_URL=http://localhost:5005`) to production (`API_URL=https://your-backend.onrender.com`) immediately updates all generated upload URLs without code changes.

### 2. Multi-Tier Media URL Normalization (`mediaUrlResolver.js` & `media.api.js`)
- **Backend DTO Layer** (`resolveMediaUrl` in `article.dto.js`, `user.dto.js`, `media.controller.js`):
  - Detects legacy localhost/loopback URLs on any port and dynamically re-bases them to the active environment's `API_URL/uploads`.
  - External CDN URLs (Cloudinary, Cloudflare R2, S3) are preserved verbatim.
  - Relative paths (`/uploads/...` or `media/...`) are dynamically prefixed with the active storage base.
- **Frontend Client Layer** (`normalizeMediaUrl` in `media.api.js`):
  - Automatically derives `VITE_STORAGE_URL` from `VITE_API_URL` if omitted.
  - Sanitizes any incoming localhost URLs to the active frontend storage base.
  - Guarantees zero Private Network Access (PNA) or loopback CORS violations in modern browsers.

### 3. Database URL Normalization Utility (`npm run db:normalize-media`)
- Provides a one-click CLI script (`backend/scripts/normalize-db-media-urls.js`) to migrate and sanitize any legacy database rows in PostgreSQL when migrating between hosts.

---

## 11. Future Roadmap for Media & Storage System

1. **Integrated Media Library Asset Picker**:
   - Add a modal dialog in the editor allowing authors to browse, search, and reuse previously uploaded figures and illustrations from `GET /admin/media` without re-uploading duplicate assets.
2. **Direct-to-S3 / R2 Pre-Signed URL Uploads**:
   - For high-volume environments or massive figures (>20MB), implement pre-signed S3 PUT URL generation so uploads bypass Express directly into Cloudflare R2 / AWS S3 buckets.
3. **Responsive `srcset` & BlurHash Generation**:
   - Generate multi-resolution srcset variants (400w, 800w, 1200w, 2048w) and compact BlurHash strings stored in `metadata.blurHash` for instant progressive image loading.
4. **Interactive SVG Diagram Sanitization & Ingestion**:
   - Add a dedicated DOMPurify/sanitize pipeline allowing safe vector SVG ingestion for scientific architecture diagrams.


