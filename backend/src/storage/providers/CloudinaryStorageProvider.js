import { v2 as cloudinary } from 'cloudinary';
import { StorageProvider } from '../StorageProvider.js';
import { config } from '../../config/index.js';

export class CloudinaryStorageProvider extends StorageProvider {
  constructor() {
    super();
    cloudinary.config({
      cloud_name: config.CLOUDINARY_CLOUD_NAME,
      api_key: config.CLOUDINARY_API_KEY,
      api_secret: config.CLOUDINARY_API_SECRET,
      secure: true
    });
  }

  async upload(buffer, options = {}) {
    const folder = options.folder || 'research_factors';

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'image'
        },
        (error, result) => {
          if (error) return reject(error);
          resolve({
            storageKey: result.public_id,
            publicUrl: result.secure_url,
            sizeBytes: result.bytes
          });
        }
      );
      uploadStream.end(buffer);
    });
  }

  async delete(storageKey) {
    try {
      const result = await cloudinary.uploader.destroy(storageKey);
      return result.result === 'ok';
    } catch {
      return false;
    }
  }

  getPublicUrl(storageKey) {
    return cloudinary.url(storageKey, { secure: true });
  }

  async exists(storageKey) {
    try {
      const resource = await cloudinary.api.resource(storageKey);
      return !!resource;
    } catch {
      return false;
    }
  }
}
