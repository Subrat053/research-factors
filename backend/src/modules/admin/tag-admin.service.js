import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class TagAdminService {
  /**
   * Lists tags with article counts
   */
  static async listTags({ search = '', page = 1, limit = 50 }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } }
      ];
    }

    const [tags, total] = await Promise.all([
      prisma.tag.findMany({
        where,
        include: {
          _count: {
            select: { articles: true }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take
      }),
      prisma.tag.count({ where })
    ]);

    return {
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        articlesCount: t._count.articles,
        createdAt: t.createdAt
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
   * Creates a new tag
   */
  static async createTag({ name }) {
    if (!name || name.trim().length < 2) {
      throw new AppError('Tag name must be at least 2 characters long', 400, 'INVALID_NAME');
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const existing = await prisma.tag.findFirst({
      where: {
        OR: [{ name: { equals: trimmedName, mode: 'insensitive' } }, { slug }]
      }
    });

    if (existing) {
      throw new AppError(`A tag with name or slug '${trimmedName}' already exists`, 409, 'TAG_ALREADY_EXISTS');
    }

    return prisma.tag.create({
      data: {
        name: trimmedName,
        slug
      }
    });
  }

  /**
   * Updates an existing tag
   */
  static async updateTag(id, { name }) {
    if (!name || name.trim().length < 2) {
      throw new AppError('Tag name must be at least 2 characters long', 400, 'INVALID_NAME');
    }

    const trimmedName = name.trim();
    const slug = trimmedName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    return prisma.tag.update({
      where: { id },
      data: { name: trimmedName, slug }
    });
  }

  /**
   * Deletes a tag
   */
  static async deleteTag(id, actorId) {
    const tag = await prisma.tag.findUnique({ where: { id } });
    if (!tag) {
      throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      await tx.articleTag.deleteMany({ where: { tagId: id } });
      await tx.tag.delete({ where: { id } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'tag.delete',
          entityType: 'Tag',
          entityId: id,
          metadata: { name: tag.name, slug: tag.slug }
        }
      });
    });

    return { id, deleted: true };
  }

  /**
   * Merges sourceTag into targetTag, moving all article associations and deleting sourceTag (PRD Section 53)
   */
  static async mergeTags({ sourceTagId, targetTagId }, actorId) {
    if (!sourceTagId || !targetTagId) {
      throw new AppError('Both sourceTagId and targetTagId are required for merging', 400, 'INVALID_MERGE_REQUEST');
    }

    if (sourceTagId === targetTagId) {
      throw new AppError('Cannot merge a tag into itself', 400, 'CANNOT_MERGE_SAME_TAG');
    }

    const [sourceTag, targetTag] = await Promise.all([
      prisma.tag.findUnique({ where: { id: sourceTagId }, include: { articles: true } }),
      prisma.tag.findUnique({ where: { id: targetTagId }, include: { articles: true } })
    ]);

    if (!sourceTag || !targetTag) {
      throw new AppError('One or both specified tags do not exist', 404, 'TAG_NOT_FOUND');
    }

    const targetArticleIds = new Set(targetTag.articles.map(a => a.articleId));
    let transferredCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const articleLink of sourceTag.articles) {
        if (!targetArticleIds.has(articleLink.articleId)) {
          // Add connection to targetTag
          await tx.articleTag.create({
            data: {
              articleId: articleLink.articleId,
              tagId: targetTagId
            }
          });
          transferredCount++;
        }
      }

      // Remove source connections
      await tx.articleTag.deleteMany({ where: { tagId: sourceTagId } });

      // Delete source tag
      await tx.tag.delete({ where: { id: sourceTagId } });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'tag.merge',
          entityType: 'Tag',
          entityId: targetTagId,
          metadata: {
            mergedSource: { id: sourceTag.id, name: sourceTag.name, slug: sourceTag.slug },
            target: { id: targetTag.id, name: targetTag.name, slug: targetTag.slug },
            transferredArticles: transferredCount
          }
        }
      });
    });

    return {
      success: true,
      mergedInto: { id: targetTag.id, name: targetTag.name },
      deletedTag: { id: sourceTag.id, name: sourceTag.name },
      articlesReassigned: transferredCount
    };
  }
}
