/**
 * Abstract interface for all storage providers (Local, Cloudinary, Cloudflare R2, AWS S3)
 * Every provider must implement these exact async methods with identical signatures.
 */
export class StorageProvider {
  /**
   * Uploads file buffer to storage destination
   * @param {Buffer} buffer - Clean, processed binary buffer
   * @param {Object} options - { filename, mimeType, folder }
   * @returns {Promise<{ storageKey: string, publicUrl: string, sizeBytes: number }>}
   */
  async upload(buffer, options) {
    throw new Error('Method upload(buffer, options) must be implemented by provider');
  }

  /**
   * Deletes asset by storageKey
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async delete(storageKey) {
    throw new Error('Method delete(storageKey) must be implemented by provider');
  }

  /**
   * Returns public CDN/accessible URL for storageKey
   * @param {string} storageKey
   * @returns {string}
   */
  getPublicUrl(storageKey) {
    throw new Error('Method getPublicUrl(storageKey) must be implemented by provider');
  }

  /**
   * Checks if asset exists in storage
   * @param {string} storageKey
   * @returns {Promise<boolean>}
   */
  async exists(storageKey) {
    throw new Error('Method exists(storageKey) must be implemented by provider');
  }
}
