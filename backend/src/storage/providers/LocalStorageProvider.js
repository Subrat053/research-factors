import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { StorageProvider } from '../StorageProvider.js';
import { config } from '../../config/index.js';

export class LocalStorageProvider extends StorageProvider {
  constructor(options = {}) {
    super();
    this.baseDir = options.basePath ? path.resolve(options.basePath) : path.resolve(process.cwd(), config.LOCAL_STORAGE_PATH);
    const fallbackBase = `${config.API_URL.replace(/\/+$/, '')}/uploads`;
    this.publicUrlBase = (options.publicBaseUrl || config.LOCAL_STORAGE_PUBLIC_URL || fallbackBase).replace(/\/+$/, '');
  }

  async _ensureDir(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
  }

  _getSafeFilePath(storageKey) {
    const resolvedPath = path.resolve(this.baseDir, storageKey);
    if (!resolvedPath.startsWith(this.baseDir)) {
      throw new Error('Path traversal attempt detected');
    }
    return resolvedPath;
  }

  async upload(buffer, options = {}) {
    const folder = options.folder || 'media';
    const ext = options.filename ? path.extname(options.filename) : '.webp';
    const randomName = `${crypto.randomUUID()}${ext}`;
    const storageKey = path.join(folder, randomName).replace(/\\/g, '/');

    const fullDirPath = path.resolve(this.baseDir, folder);
    await this._ensureDir(fullDirPath);

    const fullFilePath = this._getSafeFilePath(storageKey);
    await fs.writeFile(fullFilePath, buffer);

    const publicUrl = this.getPublicUrl(storageKey);

    return {
      storageKey,
      publicUrl,
      sizeBytes: buffer.length,
      mimeType: options.mimeType || 'image/webp'
    };
  }

  async delete(storageKey) {
    try {
      const fullFilePath = this._getSafeFilePath(storageKey);
      await fs.unlink(fullFilePath);
      return true;
    } catch (err) {
      if (err.code === 'ENOENT') return false;
      throw err;
    }
  }

  getPublicUrl(storageKey) {
    const cleanKey = storageKey.replace(/\\/g, '/');
    return `${this.publicUrlBase.replace(/\/$/, '')}/${cleanKey.replace(/^\//, '')}`;
  }

  async exists(storageKey) {
    try {
      const fullFilePath = this._getSafeFilePath(storageKey);
      await fs.access(fullFilePath);
      return true;
    } catch {
      return false;
    }
  }
}
