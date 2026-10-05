import { config } from '../config/index.js';

/**
 * Dynamically resolves and re-bases media asset URLs to the active environment.
 * - External CDN URLs (Cloudinary, R2, S3) are preserved as-is.
 * - Localhost or port-shifted URLs are dynamically rewritten to the active API_URL/uploads base.
 * - Relative paths (/uploads/...) are dynamically qualified with the active storage base.
 *
 * @param {string} url - Raw media URL or path
 * @returns {string} Fully resolved, environment-appropriate URL
 */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return url;

  const storageBase = (config.LOCAL_STORAGE_PUBLIC_URL || `${config.API_URL.replace(/\/+$/, '')}/uploads`).replace(/\/+$/, '');

  // 1. Detect legacy localhost / loopback addresses on any port and rewrite to active storage base
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/rf)?\/uploads\/(.*)$/i.test(url)) {
    const cleanPath = url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/rf)?\/uploads\/?/i, '');
    return `${storageBase}/${cleanPath}`;
  }

  // 2. Relative /uploads or /rf/uploads path
  if (url.startsWith('/rf/uploads')) {
    const cleanPath = url.replace(/^\/rf\/uploads\/?/, '');
    return `${storageBase}/${cleanPath}`;
  }
  if (url.startsWith('/uploads')) {
    const cleanPath = url.replace(/^\/uploads\/?/, '');
    return `${storageBase}/${cleanPath}`;
  }

  // 3. Bare storage key (e.g. "media/uuid.webp")
  if (url.startsWith('media/')) {
    return `${storageBase}/${url}`;
  }

  // 4. External CDN assets (Cloudinary, Cloudflare R2, AWS S3, etc.)
  return url;
}
