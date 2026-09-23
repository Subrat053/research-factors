import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class TagController {
  /**
   * Public & Author tag search/listing with article counts
   */
  static async getTags(req, res, next) {
    try {
      const { search = '', limit = 50 } = req.query;
      const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 50));

      const where = {};
      if (search && search.trim().length > 0) {
        const q = search.trim().replace(/^#/, '');
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q.toLowerCase().replace(/[^a-z0-9]+/g, '-'), mode: 'insensitive' } }
        ];
      }

      const tags = await prisma.tag.findMany({
        where,
        take,
        orderBy: { name: 'asc' },
        include: {
          _count: {
            select: { articles: { where: { article: { status: 'PUBLISHED' } } } }
          }
        }
      });

      res.json({
        success: true,
        data: tags.map(t => ({
          id: t.id,
          name: t.name,
          slug: t.slug,
          articlesCount: t._count.articles,
          _count: { articles: t._count.articles }
        }))
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetch single tag by slug
   */
  static async getTagBySlug(req, res, next) {
    try {
      const { slug } = req.params;
      const tag = await prisma.tag.findUnique({
        where: { slug },
        include: {
          _count: {
            select: { articles: { where: { article: { status: 'PUBLISHED' } } } }
          }
        }
      });

      if (!tag) {
        throw new AppError('Tag not found', 404, 'TAG_NOT_FOUND');
      }

      res.json({
        success: true,
        data: {
          id: tag.id,
          name: tag.name,
          slug: tag.slug,
          articlesCount: tag._count.articles,
          _count: { articles: tag._count.articles }
        }
      });
    } catch (err) {
      next(err);
    }
  }
}
