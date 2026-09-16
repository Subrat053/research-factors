import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'crypto';
import path from 'path';
import { StorageProvider } from '../StorageProvider.js';
import { config } from '../../config/index.js';

export class R2StorageProvider extends StorageProvider {
  constructor() {
    super();
    this.bucket = config.R2_BUCKET;
    this.publicUrlBase = config.R2_PUBLIC_URL || '';

    this.s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${config.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.R2_ACCESS_KEY_ID || '',
        secretAccessKey: config.R2_SECRET_ACCESS_KEY || ''
      }
    });
  }

  async upload(buffer, options = {}) {
    const folder = options.folder || 'media';
    const ext = options.filename ? path.extname(options.filename) : '.webp';
    const key = `${folder}/${crypto.randomUUID()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: buffer,
        ContentType: options.mimeType || 'image/webp'
      })
    );

    return {
      storageKey: key,
      publicUrl: this.getPublicUrl(key),
      sizeBytes: buffer.length
    };
  }

  async delete(storageKey) {
    try {
      await this.s3.send(
        new DeleteObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      );
      return true;
    } catch {
      return false;
    }
  }

  getPublicUrl(storageKey) {
    return `${this.publicUrlBase.replace(/\/$/, '')}/${storageKey.replace(/^\//, '')}`;
  }

  async exists(storageKey) {
    try {
      await this.s3.send(
        new HeadObjectCommand({
          Bucket: this.bucket,
          Key: storageKey
        })
      );
      return true;
    } catch {
      return false;
    }
  }
}
