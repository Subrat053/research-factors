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
   * Deletes a media asset by ID
   * @param {string} id - Media asset UUID
   */
  delete: (id) => apiClient.delete(`/media/${id}`)
};

/**
 * Normalizes media asset URLs to handle dynamic port shifts and relative paths
 * @param {string} url - Image source URL
 * @returns {string} Normalized absolute or CDN URL
 */
export function normalizeMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const storageUrl = import.meta.env.VITE_STORAGE_URL || 'http://localhost:5005/uploads';

  // Replace any legacy localhost:5000 variations with active storage URL
  if (url.includes(':5000/uploads')) {
    return url.replace(/https?:\/\/localhost:5000\/uploads/g, storageUrl)
              .replace(/localhost:5000\/uploads/g, storageUrl);
  }

  // If URL is a relative /uploads path
  if (url.startsWith('/uploads')) {
    const base = storageUrl.replace(/\/+$/, '');
    const cleanPath = url.replace(/^\/uploads\/?/, '');
    return `${base}/${cleanPath}`;
  }

  return url;
}
