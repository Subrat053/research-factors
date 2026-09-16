import { Router } from 'express';
import { prisma } from '../../config/db.js';
import { ArticleDTO } from '../articles/article.dto.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;
    if (!q || !q.trim()) {
      return res.json({ success: true, data: [] });
    }

    const term = q.trim();
    const articles = await prisma.article.findMany({
      where: {
        status: 'PUBLISHED',
        OR: [
          { title: { contains: term, mode: 'insensitive' } },
          { subtitle: { contains: term, mode: 'insensitive' } },
          { excerpt: { contains: term, mode: 'insensitive' } },
          { category: { name: { contains: term, mode: 'insensitive' } } },
          { tags: { some: { tag: { name: { contains: term, mode: 'insensitive' } } } } }
        ]
      },
      take: parseInt(limit, 10),
      orderBy: { publishedAt: 'desc' },
      include: {
        category: true,
        author: true,
        _count: { select: { comments: true } }
      }
    });

    res.json({
      success: true,
      data: articles.map(a => ArticleDTO.toPublicSummary(a))
    });
  } catch (err) {
    next(err);
  }
});

export const searchRoutes = router;
