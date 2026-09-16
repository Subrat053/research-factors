import { prisma } from '../../config/db.js';
import { MediaService } from '../media/media.service.js';

export class MediaAdminService {
  /**
   * Lists all media assets across the platform
   */
  static async listMedia({ provider = '', mimeType = '', search = '', page = 1, limit = 24 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (provider) {
      where.provider = provider.toLowerCase();
    }
    if (mimeType) {
      where.mimeType = mimeType;
    }
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { originalName: { contains: q, mode: 'insensitive' } },
        { altText: { contains: q, mode: 'insensitive' } },
        { caption: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [media, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take
      }),
      prisma.media.count({ where })
    ]);

    return {
      media: media.map(m => ({
        id: m.id,
        publicUrl: m.publicUrl,
        originalName: m.originalName,
        mimeType: m.mimeType,
        sizeBytes: m.sizeBytes,
        width: m.width,
        height: m.height,
        provider: m.provider,
        storageKey: m.storageKey,
        altText: m.altText,
        caption: m.caption,
        source: m.source,
        license: m.license,
        createdAt: m.createdAt,
        uploader: m.createdBy ? {
          id: m.createdBy.id,
          name: `${m.createdBy.firstName} ${m.createdBy.lastName}`.trim(),
          email: m.createdBy.email
        } : null
      })),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Force deletes a media asset
   */
  static async deleteMediaAsset(mediaId, actorId) {
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) {
      throw new AppError('Media asset not found', 404, 'MEDIA_NOT_FOUND');
    }

    await MediaService.deleteMedia(mediaId, actorId, true);

    await prisma.auditLog.create({
      data: {
        actorId,
        action: 'media.force_delete',
        entityType: 'Media',
        entityId: mediaId,
        metadata: {
          originalName: media.originalName,
          provider: media.provider,
          storageKey: media.storageKey
        }
      }
    });

    return { id: mediaId, deleted: true };
  }
}
