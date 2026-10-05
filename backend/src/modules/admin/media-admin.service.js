import { prisma } from '../../config/db.js';
import { MediaService } from '../media/media.service.js';
import { AppError } from '../../middleware/errorHandler.js';
import { resolveMediaUrl } from '../../utils/mediaUrlResolver.js';

export class MediaAdminService {
  /**
   * Scans content references across Articles, Blocks, Categories, Users, and SEO metadata
   * for a given set of media assets.
   */
  static async _enrichMediaWithUsages(mediaItems) {
    if (!mediaItems || mediaItems.length === 0) return [];

    const urls = mediaItems.map(m => m.publicUrl).filter(Boolean);
    const keys = mediaItems.map(m => m.storageKey).filter(Boolean);

    // Parallel batch queries
    const [articles, categories, users, seoItems, blocks] = await Promise.all([
      prisma.article.findMany({
        where: {
          OR: [
            { coverImageUrl: { in: urls } },
            { sponsorLogoUrl: { in: urls } }
          ]
        },
        select: {
          id: true,
          title: true,
          slug: true,
          coverImageUrl: true,
          sponsorLogoUrl: true
        }
      }),
      prisma.category.findMany({
        where: { imageUrl: { in: urls } },
        select: { id: true, name: true, slug: true, imageUrl: true }
      }),
      prisma.user.findMany({
        where: { avatarUrl: { in: urls } },
        select: { id: true, firstName: true, lastName: true, avatarUrl: true }
      }),
      prisma.seoMetadata.findMany({
        where: {
          OR: [
            { customOgImage: { in: urls } },
            { customTwitterImage: { in: urls } },
            { generatedOgImage: { in: urls } }
          ]
        },
        select: {
          id: true,
          entityType: true,
          entityId: true,
          customOgImage: true,
          customTwitterImage: true,
          generatedOgImage: true
        }
      }),
      prisma.$queryRaw`
        SELECT b.id, b.block_type as "blockType", b.position, b.content::text as "contentText",
               a.id as "articleId", a.title as "articleTitle", a.slug as "articleSlug"
        FROM article_blocks b
        JOIN articles a ON b.article_id = a.id
        WHERE b.content::text LIKE '%media/%' OR b.content::text LIKE '%uploads%'
      `.catch(() => [])
    ]);

    return mediaItems.map(m => {
      const usages = [];
      const mUrl = m.publicUrl;
      const mKey = m.storageKey;

      // 1. Articles
      articles.forEach(art => {
        if (art.coverImageUrl === mUrl || (mKey && art.coverImageUrl?.includes(mKey))) {
          usages.push({
            type: 'article',
            label: `Article: ${art.title} (Cover Image)`,
            field: 'coverImageUrl'
          });
        }
        if (art.sponsorLogoUrl === mUrl || (mKey && art.sponsorLogoUrl?.includes(mKey))) {
          usages.push({
            type: 'article',
            label: `Article: ${art.title} (Sponsor Logo)`,
            field: 'sponsorLogoUrl'
          });
        }
      });

      // 2. Categories
      categories.forEach(cat => {
        if (cat.imageUrl === mUrl || (mKey && cat.imageUrl?.includes(mKey))) {
          usages.push({
            type: 'category',
            label: `Category: ${cat.name} (Illustration)`,
            field: 'imageUrl'
          });
        }
      });

      // 3. Users
      users.forEach(usr => {
        if (usr.avatarUrl === mUrl || (mKey && usr.avatarUrl?.includes(mKey))) {
          usages.push({
            type: 'user',
            label: `User Profile: ${usr.firstName} ${usr.lastName}`.trim(),
            field: 'avatarUrl'
          });
        }
      });

      // 4. Article Blocks
      blocks.forEach(blk => {
        if (blk.contentText?.includes(mUrl) || (mKey && blk.contentText?.includes(mKey))) {
          usages.push({
            type: 'article_block',
            label: `Article: ${blk.articleTitle} (Block #${blk.position + 1})`,
            field: `content (${blk.blockType})`
          });
        }
      });

      // 5. SEO Metadata
      seoItems.forEach(seo => {
        if (
          seo.customOgImage === mUrl ||
          seo.customTwitterImage === mUrl ||
          seo.generatedOgImage === mUrl ||
          (mKey && (seo.customOgImage?.includes(mKey) || seo.customTwitterImage?.includes(mKey)))
        ) {
          usages.push({
            type: 'seo',
            label: `SEO Card: ${seo.entityType} (${seo.entityId})`,
            field: 'socialImage'
          });
        }
      });

      return {
        ...m,
        usageCount: usages.length,
        usagesSummary: usages.map(u => u.label),
        isUsed: usages.length > 0
      };
    });
  }

  /**
   * Lists all media assets across the platform with usage stats and filtering
   */
  static async listMedia({ provider = '', mimeType = '', search = '', usageFilter = '', page = 1, limit = 24 }) {
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

    const [rawMedia, total] = await Promise.all([
      prisma.media.findMany({
        where,
        include: {
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: usageFilter ? undefined : skip,
        take: usageFilter ? undefined : take
      }),
      prisma.media.count({ where })
    ]);

    const formattedMedia = rawMedia.map(m => ({
      id: m.id,
      publicUrl: resolveMediaUrl(m.publicUrl),
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
    }));

    // Enrich with usage statistics
    const enrichedMedia = await this._enrichMediaWithUsages(formattedMedia);

    let finalMedia = enrichedMedia;
    let finalTotal = total;

    // Apply usageFilter if specified
    if (usageFilter === 'used') {
      finalMedia = enrichedMedia.filter(m => m.usageCount > 0);
      finalTotal = finalMedia.length;
      finalMedia = finalMedia.slice(skip, skip + take);
    } else if (usageFilter === 'unused') {
      finalMedia = enrichedMedia.filter(m => m.usageCount === 0);
      finalTotal = finalMedia.length;
      finalMedia = finalMedia.slice(skip, skip + take);
    }

    return {
      media: finalMedia,
      pagination: {
        total: finalTotal,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.max(1, Math.ceil(finalTotal / take))
      }
    };
  }

  /**
   * Retrieves full granular usage references for a specific media asset
   */
  static async getMediaUsages(mediaId) {
    const media = await prisma.media.findUnique({
      where: { id: mediaId },
      include: {
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true }
        }
      }
    });

    if (!media) {
      throw new AppError('Media asset not found', 404, 'MEDIA_NOT_FOUND');
    }

    const mUrl = media.publicUrl;
    const resolvedMediaUrl = resolveMediaUrl(media.publicUrl);
    const mKey = media.storageKey;

    const [articles, categories, users, seoItems, blocks] = await Promise.all([
      prisma.article.findMany({
        where: {
          OR: [
            { coverImageUrl: mUrl },
            { coverImageUrl: { contains: mKey } },
            { sponsorLogoUrl: mUrl },
            { sponsorLogoUrl: { contains: mKey } }
          ]
        },
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
          coverImageUrl: true,
          sponsorLogoUrl: true,
          sponsorName: true,
          publishedAt: true
        }
      }),
      prisma.category.findMany({
        where: {
          OR: [
            { imageUrl: mUrl },
            { imageUrl: { contains: mKey } }
          ]
        },
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          isActive: true
        }
      }),
      prisma.user.findMany({
        where: {
          OR: [
            { avatarUrl: mUrl },
            { avatarUrl: { contains: mKey } }
          ]
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true
        }
      }),
      prisma.seoMetadata.findMany({
        where: {
          OR: [
            { customOgImage: mUrl },
            { customOgImage: { contains: mKey } },
            { customTwitterImage: mUrl },
            { customTwitterImage: { contains: mKey } },
            { generatedOgImage: mUrl },
            { generatedOgImage: { contains: mKey } }
          ]
        },
        select: {
          id: true,
          entityType: true,
          entityId: true,
          customOgImage: true,
          customTwitterImage: true,
          generatedOgImage: true
        }
      }),
      prisma.$queryRaw`
        SELECT b.id, b.block_type as "blockType", b.position,
               a.id as "articleId", a.title as "articleTitle", a.slug as "articleSlug", a.status as "articleStatus"
        FROM article_blocks b
        JOIN articles a ON b.article_id = a.id
        WHERE b.content::text LIKE ${'%' + mKey + '%'}
           OR b.content::text LIKE ${'%' + mUrl + '%'}
        ORDER BY b.position ASC
      `.catch(() => [])
    ]);

    const detailedUsages = [];

    // Articles
    articles.forEach(art => {
      if (art.coverImageUrl === mUrl || (mKey && art.coverImageUrl?.includes(mKey))) {
        detailedUsages.push({
          id: `${art.id}-cover`,
          itemType: 'article',
          itemTypeLabel: 'Article',
          title: art.title,
          status: art.status,
          field: 'coverImageUrl',
          fieldLabel: 'Article Cover Image',
          viewUrl: `/articles/${art.slug}`,
          adminUrl: `/admin/editor/${art.id}`,
          extra: `Status: ${art.status}`
        });
      }
      if (art.sponsorLogoUrl === mUrl || (mKey && art.sponsorLogoUrl?.includes(mKey))) {
        detailedUsages.push({
          id: `${art.id}-sponsor`,
          itemType: 'article',
          itemTypeLabel: 'Article',
          title: art.title,
          status: art.status,
          field: 'sponsorLogoUrl',
          fieldLabel: 'Article Sponsor Logo',
          viewUrl: `/articles/${art.slug}`,
          adminUrl: `/admin/editor/${art.id}`,
          extra: art.sponsorName ? `Sponsor: ${art.sponsorName}` : 'Sponsored Article'
        });
      }
    });

    // Categories
    categories.forEach(cat => {
      detailedUsages.push({
        id: cat.id,
        itemType: 'category',
        itemTypeLabel: 'Category',
        title: cat.name,
        field: 'imageUrl',
        fieldLabel: 'Category Header / Illustration',
        viewUrl: `/categories/${cat.slug}`,
        adminUrl: `/admin/categories`,
        extra: `Slug: ${cat.slug} · ${cat.isActive ? 'Active' : 'Inactive'}`
      });
    });

    // Content Blocks
    blocks.forEach(blk => {
      detailedUsages.push({
        id: blk.id,
        itemType: 'article_block',
        itemTypeLabel: 'Article Manuscript Block',
        title: blk.articleTitle,
        status: blk.articleStatus,
        field: `block[${blk.position}].content`,
        fieldLabel: `Manuscript Body Block #${blk.position + 1} (${blk.blockType})`,
        viewUrl: `/articles/${blk.articleSlug}`,
        adminUrl: `/admin/editor/${blk.articleId}`,
        extra: `Block Type: ${blk.blockType} · Position: ${blk.position + 1}`
      });
    });

    // Users
    users.forEach(usr => {
      detailedUsages.push({
        id: usr.id,
        itemType: 'user',
        itemTypeLabel: 'User Profile',
        title: `${usr.firstName} ${usr.lastName}`.trim() || usr.email,
        field: 'avatarUrl',
        fieldLabel: 'Profile Avatar',
        viewUrl: null,
        adminUrl: `/admin/users`,
        extra: usr.email
      });
    });

    // SEO Metadata
    seoItems.forEach(seo => {
      detailedUsages.push({
        id: seo.id,
        itemType: 'seo',
        itemTypeLabel: 'SEO Metadata',
        title: `SEO Card for ${seo.entityType} (${seo.entityId})`,
        field: 'customOgImage',
        fieldLabel: 'Social Share Card Image',
        viewUrl: null,
        adminUrl: `/admin/seo`,
        extra: `Entity Type: ${seo.entityType}`
      });
    });

    return {
      media: {
        id: media.id,
        originalName: media.originalName,
        publicUrl: resolvedMediaUrl,
        mimeType: media.mimeType,
        sizeBytes: media.sizeBytes,
        width: media.width,
        height: media.height,
        provider: media.provider,
        storageKey: media.storageKey,
        altText: media.altText,
        caption: media.caption,
        createdAt: media.createdAt,
        uploader: media.createdBy ? {
          id: media.createdBy.id,
          name: `${media.createdBy.firstName} ${media.createdBy.lastName}`.trim(),
          email: media.createdBy.email
        } : null
      },
      totalUsages: detailedUsages.length,
      usages: detailedUsages
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

