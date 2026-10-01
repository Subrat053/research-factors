import { prisma } from '../../config/db.js';
import { CandidateService } from './candidate.service.js';
import { ScoringService } from './scoring.service.js';
import { DiversityService } from './diversity.service.js';
import { EventService } from './event.service.js';
import { RecommendationDTO } from './recommendation.dto.js';
import { AppError } from '../../middleware/errorHandler.js';

export const DEFAULT_RECOMMENDATION_CONFIG = {
  popupEnabled: true,
  dwellTimeSeconds: 30,
  scrollThresholdPercent: 50,
  cooldownDays: 7,
  maxCategoryPills: 8,
  weights: {
    interest: 0.30,
    tag: 0.25,
    category: 0.20,
    complementarity: 0.15,
    recency: 0.10
  }
};

export class RecommendationService {
  /**
   * Retrieves recommendation configuration
   */
  static async getConfig() {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'recommendation_settings' }
      });
      return setting?.value ? { ...DEFAULT_RECOMMENDATION_CONFIG, ...setting.value } : DEFAULT_RECOMMENDATION_CONFIG;
    } catch {
      return DEFAULT_RECOMMENDATION_CONFIG;
    }
  }

  /**
   * Updates recommendation configuration (Admin)
   */
  static async updateConfig(newConfig) {
    const updated = await prisma.systemSetting.upsert({
      where: { key: 'recommendation_settings' },
      update: {
        value: newConfig,
        updatedAt: new Date()
      },
      create: {
        key: 'recommendation_settings',
        value: newConfig
      }
    });
    return updated.value;
  }

  /**
   * Generates multi-intent recommendation journeys for an article detail page
   */
  static async getArticleRecommendations(articleId, { visitorId, userId = null, sessionId = null } = {}) {
    const currentArticle = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        category: {
          include: {
            parent: true,
            children: { where: { isActive: true } }
          }
        },
        tags: { include: { tag: true } }
      }
    });

    if (!currentArticle || (currentArticle.category && !currentArticle.category.isActive)) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    const currentCategory = currentArticle.category;
    const isSubcategory = Boolean(currentCategory?.parentId);
    const parentCategoryId = currentCategory?.parentId || null;

    // Dynamically query active sibling categories if this is a subcategory
    let siblingCategoryIds = [];
    if (isSubcategory && parentCategoryId) {
      const siblings = await prisma.category.findMany({
        where: {
          parentId: parentCategoryId,
          id: { not: currentCategory.id },
          isActive: true
        },
        select: { id: true }
      });
      siblingCategoryIds = siblings.map((s) => s.id);
    }

    // Dynamically extract child categories if this is a parent category
    const childCategoryIds = (!isSubcategory && currentCategory?.children)
      ? currentCategory.children.map((c) => c.id)
      : [];

    const taxonomyContext = {
      currentCategoryId: currentArticle.categoryId,
      parentCategoryId,
      siblingCategoryIds,
      childCategoryIds
    };

    const currentTagIds = currentArticle.tags.map((t) => t.tagId);
    const [interestProfileMap, { viewedArticleIds, sessionArticleIds }, config] = await Promise.all([
      EventService.getVisitorInterestMap(visitorId, userId),
      EventService.getVisitorHistory(visitorId, sessionId),
      this.getConfig()
    ]);

    const interestCategoryIds = Array.from(interestProfileMap.keys());

    // Pull candidate pool with dynamic category hierarchy
    const candidates = await CandidateService.getCandidates({
      currentArticleId: articleId,
      currentCategoryId: currentArticle.categoryId,
      taxonomyContext,
      currentTagIds,
      interestCategoryIds,
      excludeArticleIds: Array.from(viewedArticleIds),
      limit: 36
    });

    // Score candidates with dynamic hierarchical affinity
    const scoredCandidates = ScoringService.scoreCandidates(candidates, {
      currentArticle,
      taxonomyContext,
      interestProfileMap,
      viewedArticleIds,
      sessionArticleIds,
      weights: config.weights
    });

    // Tiered recommendation assembly guaranteeing subcategory priority
    const exactSubcategoryItems = [];
    const domainFamilyItems = [];
    const otherItems = [];

    for (const item of scoredCandidates) {
      const candCatId = item.candidate.categoryId;
      if (candCatId === currentCategory.id) {
        exactSubcategoryItems.push(item);
      } else if (
        (parentCategoryId && candCatId === parentCategoryId) ||
        siblingCategoryIds.includes(candCatId) ||
        childCategoryIds.includes(candCatId)
      ) {
        domainFamilyItems.push(item);
      } else {
        otherItems.push(item);
      }
    }

    // Top recommendations:
    // 1. All available from exact subcategory
    // 2. Supplement from domain family (parent and sibling subcategories) if subcategory has < 6
    // 3. Supplement from other high-scoring candidates if domain family has < 6
    const topRecommendations = [
      ...exactSubcategoryItems,
      ...domainFamilyItems,
      ...otherItems
    ].slice(0, 6);

    // Cluster candidates into multi-intent journeys
    const completeYourResearch = [];
    const deepTopicDive = [];
    const trendingInInterests = [];
    const discoverSomethingNew = [];

    const allocatedIds = new Set();

    // 1. Complete Your Research: cross-format complementary articles
    for (const item of scoredCandidates) {
      if (completeYourResearch.length >= 3) break;
      if (item.candidate.type !== currentArticle.type) {
        completeYourResearch.push(item);
        allocatedIds.add(item.candidate.id);
      }
    }

    // 2. Deep Topic Dive: same category or matching tag
    for (const item of scoredCandidates) {
      if (deepTopicDive.length >= 3) break;
      if (allocatedIds.has(item.candidate.id)) continue;

      const sameCat = item.candidate.categoryId === currentArticle.categoryId;
      const tagMatch = item.candidate.tags?.some((t) => currentTagIds.includes(t.tagId));
      if (sameCat || tagMatch) {
        deepTopicDive.push(item);
        allocatedIds.add(item.candidate.id);
      }
    }

    // 3. Trending in Your Interests: matches visitor affinities with high views
    for (const item of scoredCandidates) {
      if (trendingInInterests.length >= 3) break;
      if (allocatedIds.has(item.candidate.id)) continue;

      const matchesInterest = interestCategoryIds.includes(item.candidate.categoryId);
      if (matchesInterest || item.candidate.isFeatured || (item.candidate.viewCount || 0) > 10) {
        trendingInInterests.push(item);
        allocatedIds.add(item.candidate.id);
      }
    }

    // 4. Discover Something New: anti-echo chamber category diversity
    for (const item of scoredCandidates) {
      if (discoverSomethingNew.length >= 2) break;
      if (allocatedIds.has(item.candidate.id)) continue;

      if (item.candidate.categoryId !== currentArticle.categoryId) {
        discoverSomethingNew.push(item);
        allocatedIds.add(item.candidate.id);
      }
    }

    // Backfill any empty clusters from remaining candidates to ensure rich content
    const remaining = scoredCandidates.filter((i) => !allocatedIds.has(i.candidate.id));
    let remIdx = 0;
    while (completeYourResearch.length < 2 && remIdx < remaining.length) {
      completeYourResearch.push(remaining[remIdx++]);
    }
    while (deepTopicDive.length < 2 && remIdx < remaining.length) {
      deepTopicDive.push(remaining[remIdx++]);
    }

    return RecommendationDTO.toArticleJourneys({
      recommendations: topRecommendations,
      completeYourResearch,
      deepTopicDive,
      trendingInInterests,
      discoverSomethingNew
    });
  }

  /**
   * Generates a personalized feed for home/browse pages
   */
  static async getPersonalizedFeed({ visitorId, userId = null, sessionId = null, limit = 8 } = {}) {
    const [interestProfileMap, { viewedArticleIds, sessionArticleIds }, config] = await Promise.all([
      EventService.getVisitorInterestMap(visitorId, userId),
      EventService.getVisitorHistory(visitorId, sessionId),
      this.getConfig()
    ]);

    const interestCategoryIds = Array.from(interestProfileMap.keys());

    const candidates = await CandidateService.getCandidates({
      interestCategoryIds,
      excludeArticleIds: Array.from(viewedArticleIds),
      limit: 30
    });

    const scoredCandidates = ScoringService.scoreCandidates(candidates, {
      currentArticle: null,
      interestProfileMap,
      viewedArticleIds,
      sessionArticleIds,
      weights: config.weights
    });

    const diverseRecommendations = DiversityService.applyDiversity(scoredCandidates, {
      maxPerCategory: 2,
      maxPerType: 2,
      limit
    });

    // Fetch top interest names (active categories only)
    let topInterests = [];
    if (interestCategoryIds.length > 0) {
      const cats = await prisma.category.findMany({
        where: {
          id: { in: interestCategoryIds },
          isActive: true
        },
        select: { id: true, name: true, slug: true, isActive: true }
      });
      topInterests = cats.map((c) => ({
        ...c,
        score: interestProfileMap.get(c.id) || 0
      })).sort((a, b) => b.score - a.score);
    }

    return RecommendationDTO.toFeedResponse({
      items: diverseRecommendations,
      topInterests
    });
  }

  /**
   * Gets visitor explicit/aggregated interests
   */
  static async getVisitorInterests(visitorId, userId = null) {
    if (!visitorId && !userId) return [];

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
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            imageUrl: true,
            description: true,
            isActive: true
          }
        }
      },
      orderBy: { score: 'desc' }
    });

    return profiles.map((p) => ({
      categoryId: p.categoryId,
      category: p.category,
      score: p.score,
      interactionCount: p.interactionCount,
      lastInteractedAt: p.lastInteractedAt
    }));
  }

  /**
   * Removes a specific interest for a visitor
   */
  static async removeInterest(visitorId, categoryId, userId = null) {
    return prisma.userInterestProfile.deleteMany({
      where: {
        categoryId,
        OR: [
          ...(visitorId ? [{ visitorId }] : []),
          ...(userId ? [{ userId }] : [])
        ]
      }
    });
  }
}
