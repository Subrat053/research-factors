import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.js';

const EVENT_WEIGHTS = {
  INTEREST_SELECTED: 5.0,
  ARTICLE_COMPLETED: 3.0,
  RECOMMENDATION_CLICK: 2.0,
  ARTICLE_SCROLL_50: 1.5,
  CATEGORY_CLICK: 1.2,
  ARTICLE_VIEW: 0.8,
  SEARCH: 0.5
};

export class EventService {
  /**
   * Records a user interaction event and updates interest profile
   */
  static async recordEvent(data) {
    const { visitorId, userId, sessionId, eventType, articleId, categoryId, tagId, metadata } = data;

    let resolvedCategoryId = categoryId;

    // If articleId is given but not categoryId, resolve category from article
    if (articleId && !resolvedCategoryId) {
      try {
        const article = await prisma.article.findUnique({
          where: { id: articleId },
          select: { categoryId: true }
        });
        if (article) {
          resolvedCategoryId = article.categoryId;
        }
      } catch (err) {
        logger.warn('Failed to resolve categoryId from article for event', { error: err.message });
      }
    }

    // 1. Create event entry
    const event = await prisma.userEvent.create({
      data: {
        visitorId,
        userId: userId || null,
        sessionId,
        eventType,
        articleId: articleId || null,
        categoryId: resolvedCategoryId || null,
        tagId: tagId || null,
        metadata: metadata || null
      }
    });

    // 2. Incrementally update interest profile if category is resolved
    if (resolvedCategoryId && EVENT_WEIGHTS[eventType]) {
      const weight = EVENT_WEIGHTS[eventType];
      try {
        await prisma.userInterestProfile.upsert({
          where: {
            visitorId_categoryId: {
              visitorId,
              categoryId: resolvedCategoryId
            }
          },
          update: {
            score: { increment: weight },
            interactionCount: { increment: 1 },
            lastInteractedAt: new Date(),
            userId: userId || undefined
          },
          create: {
            visitorId,
            userId: userId || null,
            categoryId: resolvedCategoryId,
            score: weight,
            interactionCount: 1,
            lastInteractedAt: new Date()
          }
        });
      } catch (upsertErr) {
        logger.error('Failed to update user interest profile', { error: upsertErr.message });
      }
    }

    return event;
  }

  /**
   * Sets explicit user interests from the discovery popup
   */
  static async setExplicitInterests({ visitorId, userId = null, categoryIds = [] }) {
    if (!visitorId && !userId) return [];

    const targetCategoryIds = Array.isArray(categoryIds) ? categoryIds : [];

    return prisma.$transaction(async (tx) => {
      const visitorFilter = [
        ...(visitorId ? [{ visitorId }] : []),
        ...(userId ? [{ userId }] : [])
      ];

      // 1. Delete interest profiles for any categories that are NOT in targetCategoryIds
      await tx.userInterestProfile.deleteMany({
        where: {
          OR: visitorFilter,
          ...(targetCategoryIds.length > 0 ? { categoryId: { notIn: targetCategoryIds } } : {})
        }
      });

      // 2. If target categories are selected, upsert each one with explicit interest weight
      const updatedProfiles = [];
      for (const catId of targetCategoryIds) {
        const profile = await tx.userInterestProfile.upsert({
          where: {
            visitorId_categoryId: {
              visitorId,
              categoryId: catId
            }
          },
          update: {
            score: EVENT_WEIGHTS.INTEREST_SELECTED,
            interactionCount: { increment: 1 },
            lastInteractedAt: new Date(),
            userId: userId || undefined
          },
          create: {
            visitorId,
            userId: userId || null,
            categoryId: catId,
            score: EVENT_WEIGHTS.INTEREST_SELECTED,
            interactionCount: 1,
            lastInteractedAt: new Date()
          }
        });
        updatedProfiles.push(profile);
      }

      return updatedProfiles;
    });
  }

  /**
   * Retrieves visitor's interest profile map
   */
  static async getVisitorInterestMap(visitorId, userId = null) {
    const interestMap = new Map();
    if (!visitorId && !userId) return interestMap;

    const profiles = await prisma.userInterestProfile.findMany({
      where: {
        OR: [
          ...(visitorId ? [{ visitorId }] : []),
          ...(userId ? [{ userId }] : [])
        ],
        category: {
          isActive: true
        }
      },
      select: {
        categoryId: true,
        score: true,
        lastInteractedAt: true
      }
    });

    for (const p of profiles) {
      // Apply slight decay based on days since last interaction (30-day half-life)
      const daysSince = (Date.now() - new Date(p.lastInteractedAt).getTime()) / (1000 * 60 * 60 * 24);
      const decayedScore = p.score * Math.exp((-Math.LN2 / 30) * Math.max(0, daysSince));
      const current = interestMap.get(p.categoryId) || 0;
      interestMap.set(p.categoryId, Math.max(current, decayedScore));
    }

    return interestMap;
  }

  /**
   * Retrieves visitor's history to avoid repetition
   */
  static async getVisitorHistory(visitorId, sessionId = null) {
    const viewedArticleIds = new Set();
    const sessionArticleIds = new Set();

    if (!visitorId) return { viewedArticleIds, sessionArticleIds };

    const events = await prisma.userEvent.findMany({
      where: {
        visitorId,
        articleId: { not: null },
        eventType: { in: ['ARTICLE_VIEW', 'ARTICLE_COMPLETED', 'ARTICLE_SCROLL_50'] }
      },
      select: {
        articleId: true,
        sessionId: true,
        eventType: true
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    for (const ev of events) {
      if (!ev.articleId) continue;
      if (ev.eventType === 'ARTICLE_COMPLETED') {
        viewedArticleIds.add(ev.articleId);
      }
      if (sessionId && ev.sessionId === sessionId) {
        sessionArticleIds.add(ev.articleId);
      }
    }

    return { viewedArticleIds, sessionArticleIds };
  }
}
