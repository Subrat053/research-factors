import { prisma } from '../../config/db.js';

// In-memory cache structures to minimize database roundtrips
let trendingCache = { data: null, expiresAt: 0 };
const recommendationsCache = new Map();
const queryCache = new Map();
const searchClicksMap = new Map();

const CACHE_TTL_TRENDING_MS = 10 * 60 * 1000; // 10 minutes
const CACHE_TTL_RECS_MS = 10 * 60 * 1000;      // 10 minutes
const CACHE_TTL_QUERY_MS = 60 * 1000;          // 60 seconds
const MAX_QUERY_CACHE_SIZE = 100;

export class SearchService {
  /**
   * Search published articles by query with optional type and category filters
   */
  static async searchArticles(query, { type, category, limit = 10 } = {}) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const term = query.trim();
    const cacheKey = `${term.toLowerCase()}_${type || 'any'}_${category || 'any'}_${limit}`;
    const cached = queryCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const where = {
      status: 'PUBLISHED',
      OR: [
        { title: { contains: term, mode: 'insensitive' } },
        { subtitle: { contains: term, mode: 'insensitive' } },
        { excerpt: { contains: term, mode: 'insensitive' } },
        { category: { name: { contains: term, mode: 'insensitive' } } },
        { tags: { some: { tag: { name: { contains: term, mode: 'insensitive' } } } } }
      ]
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = {
        OR: [
          { slug: category },
          { name: { contains: category, mode: 'insensitive' } }
        ]
      };
    }

    const articles = await prisma.article.findMany({
      where,
      take: Math.min(Math.max(1, limit), 50),
      orderBy: [
        { isFeatured: 'desc' },
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: {
        category: true,
        author: true,
        _count: { select: { comments: { where: { status: 'VISIBLE' } } } }
      }
    });

    // Prune LRU query cache if size exceeds limit
    if (queryCache.size >= MAX_QUERY_CACHE_SIZE) {
      const firstKey = queryCache.keys().next().value;
      queryCache.delete(firstKey);
    }

    queryCache.set(cacheKey, {
      data: articles,
      expiresAt: Date.now() + CACHE_TTL_QUERY_MS
    });

    return articles;
  }

  /**
   * Get trending articles (most read and searched)
   * Served from in-memory cache to reduce database load to near-zero.
   */
  static async getTrendingArticles(limit = 6) {
    if (trendingCache.data && Date.now() < trendingCache.expiresAt) {
      return trendingCache.data.slice(0, limit);
    }

    // Query published articles ordered by view count and publication date
    const articles = await prisma.article.findMany({
      where: { status: 'PUBLISHED' },
      take: limit * 2,
      orderBy: [
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: {
        category: true,
        author: true,
        _count: { select: { comments: { where: { status: 'VISIBLE' } } } }
      }
    });

    // Combine view counts with in-memory search clicks for a rich engagement score
    const scoredArticles = articles.map(art => {
      const clicks = searchClicksMap.get(art.id) || 0;
      const score = (art.viewCount || 0) + (clicks * 3);
      return { article: art, score };
    });

    scoredArticles.sort((a, b) => b.score - a.score);
    const topArticles = scoredArticles.slice(0, limit).map(item => item.article);

    trendingCache = {
      data: topArticles,
      expiresAt: Date.now() + CACHE_TTL_TRENDING_MS
    };

    return topArticles;
  }

  /**
   * Get recommended research articles tailored to a specific searched article type or category
   * In-memory cached per type/category combination.
   */
  static async getRecommendedArticles({ type, category, limit = 4 } = {}) {
    const cacheKey = `${type || 'DEFAULT'}_${category || 'ANY'}_${limit}`;
    const cached = recommendationsCache.get(cacheKey);

    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    const where = {
      status: 'PUBLISHED'
    };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = {
        OR: [
          { slug: category },
          { name: { contains: category, mode: 'insensitive' } }
        ]
      };
    }

    let articles = await prisma.article.findMany({
      where,
      take: Math.min(Math.max(1, limit), 20),
      orderBy: [
        { isFeatured: 'desc' },
        { viewCount: 'desc' },
        { publishedAt: 'desc' }
      ],
      include: {
        category: true,
        author: true,
        _count: { select: { comments: { where: { status: 'VISIBLE' } } } }
      }
    });

    // If specific type had fewer than requested limit, backfill with top research/analysis
    if (articles.length < limit && type) {
      const existingIds = articles.map(a => a.id);
      const backfill = await prisma.article.findMany({
        where: {
          status: 'PUBLISHED',
          id: { notIn: existingIds }
        },
        take: limit - articles.length,
        orderBy: [
          { isFeatured: 'desc' },
          { viewCount: 'desc' },
          { publishedAt: 'desc' }
        ],
        include: {
          category: true,
          author: true,
          _count: { select: { comments: { where: { status: 'VISIBLE' } } } }
        }
      });
      articles = [...articles, ...backfill];
    }

    recommendationsCache.set(cacheKey, {
      data: articles,
      expiresAt: Date.now() + CACHE_TTL_RECS_MS
    });

    return articles;
  }

  /**
   * Record a search result click to enhance trending calculation and increment engagement
   * Non-blocking and lightweight.
   */
  static async recordSearchClick(articleId, term) {
    if (!articleId) return;

    // Increment in-memory click frequency counter
    const current = searchClicksMap.get(articleId) || 0;
    searchClicksMap.set(articleId, current + 1);

    // Increment viewCount asynchronously in database (non-blocking)
    prisma.article.update({
      where: { id: articleId },
      data: { viewCount: { increment: 1 } }
    }).catch(() => {
      // Fire-and-forget: ignore async DB error
    });

    return { success: true };
  }
}
