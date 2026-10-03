import { prisma } from '../../config/db.js';
import { CandidateService } from './candidate.service.js';
import { ScoringService } from './scoring.service.js';
import { DiversityService } from './diversity.service.js';
import { EventService } from './event.service.js';
import { RecommendationDTO } from './recommendation.dto.js';
import { RECOMMENDATION_CONFIG } from './recommendation.config.js';
import { AppError } from '../../middleware/errorHandler.js';

export class RecommendationService {
  /**
   * Retrieves recommendation configuration
   */
  static async getConfig() {
    try {
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'recommendation_settings' }
      });
      return setting?.value ? { ...RECOMMENDATION_CONFIG, ...setting.value } : RECOMMENDATION_CONFIG;
    } catch {
      return RECOMMENDATION_CONFIG;
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
   * Sets or toggles user feedback on an article (LIKE / DISLIKE / NONE)
   */
  static async setArticleFeedback({ visitorId, userId = null, sessionId = null, articleId, feedbackType }) {
    return EventService.setArticleFeedback({
      visitorId,
      userId,
      sessionId,
      articleId,
      feedbackType
    });
  }

  /**
   * Retrieves active feedback state for an article
   */
  static async getArticleFeedbackState({ visitorId, userId = null, articleId }) {
    return EventService.getArticleFeedbackState({
      visitorId,
      userId,
      articleId
    });
  }

  /**
   * Removes active feedback for an article
   */
  static async removeArticleFeedback({ visitorId, userId = null, sessionId = null, articleId }) {
    return EventService.removeArticleFeedback({
      visitorId,
      userId,
      sessionId,
      articleId
    });
  }

  /**
   * Synchronizes anonymous visitor data to an authenticated user
   */
  static async syncVisitorToUser(visitorId, userId) {
    if (!visitorId || !userId) return;
    return EventService.mergeVisitorToUser(visitorId, userId);
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

    // Parallel multi-dimensional context resolution
    const [
      interestProfileMap,
      typePreferenceMap,
      feedbackMap,
      currentFeedbackState,
      { viewedArticleIds, sessionArticleIds },
      config
    ] = await Promise.all([
      EventService.getVisitorInterestMap(visitorId, userId),
      EventService.getUserTypePreferenceMap(visitorId, userId),
      EventService.getVisitorFeedbackMap(visitorId, userId),
      EventService.getArticleFeedbackState({ visitorId, userId, articleId }),
      EventService.getVisitorHistory(visitorId, sessionId),
      this.getConfig()
    ]);

    const interestCategoryIds = Array.from(interestProfileMap.keys());

    // Extract user preferred article types for candidate generation
    const preferredArticleTypes = Array.from(typePreferenceMap.entries())
      .filter(([_, pref]) => pref.netScore > 0)
      .sort((a, b) => b[1].netScore - a[1].netScore)
      .map(([type]) => type);

    // Pull candidate pool with dynamic category hierarchy and hard dislike suppression
    const candidates = await CandidateService.getCandidates({
      currentArticleId: articleId,
      currentCategoryId: currentArticle.categoryId,
      taxonomyContext,
      currentTagIds,
      interestCategoryIds,
      preferredArticleTypes,
      dislikedArticleIds: Array.from(feedbackMap.dislikedArticleIds),
      excludeArticleIds: Array.from(viewedArticleIds),
      limit: config.thresholds?.candidatePoolSizes?.totalPreScoreCap || 100
    });

    // Score candidates across all 10 normalized dimensions
    const scoredCandidates = ScoringService.scoreCandidates(candidates, {
      currentArticle,
      taxonomyContext,
      interestProfileMap,
      typePreferenceMap,
      feedbackMap,
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

    // Top recommendations: exact subcategory -> domain family -> diverse high-scoring items
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

    // 1. Complete Your Research: cross-format complementary articles with topical alignment
    for (const item of scoredCandidates) {
      if (completeYourResearch.length >= 3) break;
      if (allocatedIds.has(item.candidate.id)) continue;

      const isDiffType = item.candidate.type !== currentArticle.type;
      const isTopicallyRelated =
        item.candidate.categoryId === currentArticle.categoryId ||
        item.candidate.categoryId === parentCategoryId ||
        siblingCategoryIds.includes(item.candidate.categoryId) ||
        item.candidate.tags?.some((t) => currentTagIds.includes(t.tagId));

      if (isDiffType && isTopicallyRelated && item.score >= 0.25) {
        completeYourResearch.push(item);
        allocatedIds.add(item.candidate.id);
      }
    }

    // 2. Deep Topic Dive: same category or matching tag deepening topical coverage
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
      const matchesPreferredType = preferredArticleTypes.includes(item.candidate.type);
      if (matchesInterest || matchesPreferredType || item.candidate.isFeatured || (item.candidate.viewCount || 0) > 10) {
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

    // Backfill any empty clusters from remaining high-scoring candidates
    const remaining = scoredCandidates.filter((i) => !allocatedIds.has(i.candidate.id));
    let remIdx = 0;
    while (completeYourResearch.length < 2 && remIdx < remaining.length) {
      completeYourResearch.push(remaining[remIdx++]);
    }
    while (deepTopicDive.length < 2 && remIdx < remaining.length) {
      deepTopicDive.push(remaining[remIdx++]);
    }

    return RecommendationDTO.toArticleJourneys({
      articleFeedbackState: currentFeedbackState.feedbackState,
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
    const [
      interestProfileMap,
      typePreferenceMap,
      feedbackMap,
      { viewedArticleIds, sessionArticleIds },
      config
    ] = await Promise.all([
      EventService.getVisitorInterestMap(visitorId, userId),
      EventService.getUserTypePreferenceMap(visitorId, userId),
      EventService.getVisitorFeedbackMap(visitorId, userId),
      EventService.getVisitorHistory(visitorId, sessionId),
      this.getConfig()
    ]);

    const interestCategoryIds = Array.from(interestProfileMap.keys());
    const preferredArticleTypes = Array.from(typePreferenceMap.entries())
      .filter(([_, pref]) => pref.netScore > 0)
      .map(([type]) => type);

    const candidates = await CandidateService.getCandidates({
      interestCategoryIds,
      preferredArticleTypes,
      dislikedArticleIds: Array.from(feedbackMap.dislikedArticleIds),
      excludeArticleIds: Array.from(viewedArticleIds),
      limit: 60
    });

    const scoredCandidates = ScoringService.scoreCandidates(candidates, {
      currentArticle: null,
      interestProfileMap,
      typePreferenceMap,
      feedbackMap,
      viewedArticleIds,
      sessionArticleIds,
      weights: config.weights
    });

    const diverseRecommendations = DiversityService.applyDiversity(scoredCandidates, {
      maxPerCategory: config.thresholds?.diversity?.maxPerCategory || 2,
      maxPerType: config.thresholds?.diversity?.maxPerType || 2,
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
