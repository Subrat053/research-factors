import { config } from '../config/index.js';
import { LocalStorageProvider } from './providers/LocalStorageProvider.js';
import { CloudinaryStorageProvider } from './providers/CloudinaryStorageProvider.js';
import { R2StorageProvider } from './providers/R2StorageProvider.js';

class StorageFactorySingleton {
  constructor() {
    this.instances = new Map();
  }

  getProvider(providerName = config.STORAGE_PROVIDER) {
    if (!this.instances.has(providerName)) {
      let providerInstance;

      switch (providerName) {
        case 'cloudinary':
          providerInstance = new CloudinaryStorageProvider();
          break;
        case 'r2':
          providerInstance = new R2StorageProvider();
          break;
        case 'local':
        default:
          providerInstance = new LocalStorageProvider();
          break;
      }

      this.instances.set(providerName, providerInstance);
    }

    return this.instances.get(providerName);
  }
}

export const StorageFactory = new StorageFactorySingleton();
