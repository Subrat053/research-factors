import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { StorageFactory } from '../../storage/StorageFactory.js';
import { prisma } from '../../config/db.js';
import { config } from '../../config/index.js';
import { AppError } from '../../middleware/errorHandler.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const MAX_FILE_SIZE = 8 * 1024 * 1024; // 8MB

export class MediaService {
  /**
   * Processes, optimizes, and stores uploaded image assets
   */
  static async uploadMedia(file, userId, metadata = {}) {
    if (!file || !file.buffer) {
      throw new AppError('No file provided for upload', 400, 'FILE_MISSING');
    }

    if (file.size > MAX_FILE_SIZE) {
      throw new AppError('File size exceeds maximum permissible limit of 8MB', 400, 'FILE_TOO_LARGE');
    }

    // 1. Verify actual file content via magic-byte inspection (disallow disguised files)
    const detectedType = await fileTypeFromBuffer(file.buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      throw new AppError(
        `Unsupported or invalid file format. Permissible formats: JPEG, PNG, WebP, AVIF.`,
        400,
        'INVALID_FILE_TYPE'
      );
    }

    // 2. Sharp optimization pipeline: strip EXIF, resize, convert to WebP
    const image = sharp(file.buffer).rotate(); // auto-orient based on EXIF before stripping
    const imageMetadata = await image.metadata();

    const processedBuffer = await image
      .resize({
        width: 2048,
        height: 2048,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: 82 })
      .toBuffer();

    const finalMetadata = await sharp(processedBuffer).metadata();

    // 3. Delegate to configured StorageProvider via StorageFactory
    const storage = StorageFactory.getProvider();
    const uploadResult = await storage.upload(processedBuffer, {
      filename: file.originalname.replace(/\.[^/.]+$/, '.webp'),
      mimeType: 'image/webp',
      folder: 'media'
    });

    // 4. Record asset in PostgreSQL database
    const mediaRecord = await prisma.media.create({
      data: {
        provider: config.STORAGE_PROVIDER,
        storageKey: uploadResult.storageKey,
        publicUrl: uploadResult.publicUrl,
        originalName: file.originalname,
        mimeType: 'image/webp',
        sizeBytes: uploadResult.sizeBytes,
        width: finalMetadata.width || imageMetadata.width,
        height: finalMetadata.height || imageMetadata.height,
        altText: metadata.altText || null,
        caption: metadata.caption || null,
        source: metadata.source || null,
        license: metadata.license || null,
        createdById: userId
      }
    });

    return mediaRecord;
  }

  /**
   * Deletes media from storage provider and database
   */
  static async deleteMedia(mediaId, userId, hasAdminRights = false) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new AppError('Media asset not found', 404, 'MEDIA_NOT_FOUND');
    }

    if (!hasAdminRights && media.createdById !== userId) {
      throw new AppError('Access denied: You do not own this media asset', 403, 'FORBIDDEN_MEDIA_OWNERSHIP');
    }

    const storage = StorageFactory.getProvider(media.provider);
    await storage.delete(media.storageKey);

    await prisma.media.delete({ where: { id: mediaId } });
    return true;
  }
}
