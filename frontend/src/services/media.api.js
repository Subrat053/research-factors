import { apiClient } from './api.client.js';

export const mediaApi = {
  /**
   * Uploads an image asset to the server.
   * Processes through Sharp optimization to WebP, EXIF stripping, and delegates to configured storage provider (Local/Cloudinary/R2).
   * @param {File} file - Browser File object
   * @param {Object} metadata - Optional altText, caption, license, source
   * @returns {Promise<Object>} API response with publicUrl and asset metadata
   */
  upload: (file, metadata = {}) => {
    const formData = new FormData();
    formData.append('file', file);
    if (metadata.altText) formData.append('altText', metadata.altText);
    if (metadata.caption) formData.append('caption', metadata.caption);
    if (metadata.source) formData.append('source', metadata.source);
    if (metadata.license) formData.append('license', metadata.license);

    return apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },

  /**
   * Uploads an image asset supporting either raw FormData or File + metadata.
   * Guarantees platform-independent upload across local disk, Cloudflare R2, Cloudinary, and S3.
   * @param {File|FormData} fileOrFormData
   * @param {Object} metadata
   * @returns {Promise<Object>}
   */
  uploadMedia: function (fileOrFormData, metadata = {}) {
    if (typeof FormData !== 'undefined' && fileOrFormData instanceof FormData) {
      return apiClient.post('/media/upload', fileOrFormData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    }
    return this.upload(fileOrFormData, metadata);
  },

  /**
   * Deletes a media asset by ID
   * @param {string} id - Media asset UUID
   */
  delete: (id) => apiClient.delete(`/media/${id}`)
};

// Static platform branding assets respecting Vite subfolder/root base path
export const LOGO_URL = `${(import.meta.env.BASE_URL || '/').replace(/\/+$/, '')}/logo.png?v=3`;
export const LOGO_WHITE_URL = `${(import.meta.env.BASE_URL || '/').replace(/\/+$/, '')}/logo-white.png?v=3`;
export const LOGO_ICON_URL = `${(import.meta.env.BASE_URL || '/').replace(/\/+$/, '')}/logo-icon.png?v=3`;

/**
 * Dynamically resolves the active storage base URL.
 * Falls back to deriving /uploads from VITE_API_URL if VITE_STORAGE_URL is omitted.
 */
export function getStorageBaseUrl() {
  if (import.meta.env.VITE_STORAGE_URL) {
    return import.meta.env.VITE_STORAGE_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '').replace(/\/api\/v1$/, '/uploads');
  }
  return 'http://localhost:5005/uploads';
}

/**
 * Normalizes media asset URLs to handle dynamic port shifts, cross-environment deployments, and relative paths
 * @param {string} url - Image source URL
 * @returns {string} Normalized absolute or CDN URL
 */
export function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const storageUrl = getStorageBaseUrl();
  const baseUrl = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');

  // 1. Detect legacy localhost / loopback addresses on any port and dynamically rewrite to active storage base
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\/(.*)$/i.test(url)) {
    const cleanPath = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/uploads\/?/i, '');
    return `${storageUrl}/${cleanPath}`;
  }

  // 2. Handle relative /uploads path
  if (url.startsWith('/uploads')) {
    const cleanPath = url.replace(/^\/uploads\/?/, '');
    return `${storageUrl}/${cleanPath}`;
  }

  // 3. Handle bare storage keys (e.g. "media/uuid.webp")
  if (url.startsWith('media/')) {
    return `${storageUrl}/${url}`;
  }

  // 4. Handle local public assets (/images/, /logo.png, etc.)
  if (url.startsWith('/')) {
    return `${baseUrl}${url}`;
  }

  // 5. External CDN URLs (Cloudinary, Cloudflare R2, AWS S3, etc.)
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('//')) {
    return url;
  }

  return url;
}
