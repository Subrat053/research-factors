import { prisma } from '../../config/db.js';
import { logger } from '../../utils/logger.js';
import { RECOMMENDATION_CONFIG } from './recommendation.config.js';

const EVENT_WEIGHTS = {
  INTEREST_SELECTED: 5.0,
  ARTICLE_COMPLETED: 3.0,
  ARTICLE_LIKE: 3.0,
  COMMENT_SUBMITTED: 2.5,
  RECOMMENDATION_CLICK: 2.0,
  ARTICLE_SCROLL_50: 1.5,
  COMMENT_REPLY: 1.5,
  CATEGORY_CLICK: 1.2,
  ARTICLE_VIEW: 0.8,
  SEARCH: 0.5,
  ARTICLE_DISLIKE: 0.0,
  ARTICLE_FEEDBACK_REMOVED: 0.0
};

export class EventService {
  /**
   * Helper to resolve canonical identity string
   * Authenticated user always takes precedence as usr:<id>
   * Anonymous visitor uses vis:<id>
   */
  static resolveCanonicalIdentity(visitorId, userId = null) {
    if (userId) return { canonicalId: `usr:${userId}`, isUser: true };
    if (visitorId) return { canonicalId: `vis:${visitorId}`, isUser: false };
    throw new Error('Identity required: either visitorId or userId must be provided');
  }

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
        visitorId: visitorId || 'anonymous-visitor',
        userId: userId || null,
        sessionId: sessionId || 'default-session',
        eventType,
        articleId: articleId || null,
        categoryId: resolvedCategoryId || null,
        tagId: tagId || null,
        metadata: metadata || null
      }
    });

    // 2. Incrementally update interest profile if category is resolved and event has weight
    if (resolvedCategoryId && EVENT_WEIGHTS[eventType] && EVENT_WEIGHTS[eventType] > 0) {
      const weight = EVENT_WEIGHTS[eventType];
      try {
        const vId = visitorId || `usr-fallback-${userId}`;
        await prisma.userInterestProfile.upsert({
          where: {
            visitorId_categoryId: {
              visitorId: vId,
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
            visitorId: vId,
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
   * Sets or toggles explicit article feedback (LIKE / DISLIKE / NONE)
   * Enforces one active state per (canonicalId, articleId)
   */
  static async setArticleFeedback({ visitorId, userId = null, sessionId = null, articleId, feedbackType }) {
    if (!['LIKE', 'DISLIKE'].includes(feedbackType)) {
      throw new Error("Invalid feedbackType: must be 'LIKE' or 'DISLIKE'");
    }

    const { canonicalId } = this.resolveCanonicalIdentity(visitorId, userId);

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: {
        category: { select: { id: true, parentId: true } },
        tags: { select: { tagId: true } }
      }
    });

    if (!article) {
      throw new Error('Article not found');
    }

    return prisma.$transaction(async (tx) => {
      const existing = await tx.articleFeedback.findUnique({
        where: {
          canonicalId_articleId: {
            canonicalId,
            articleId
          }
        }
      });

      // 1. If clicking the currently active feedback button, toggle it to NONE
      if (existing && existing.feedbackType === feedbackType) {
        await tx.articleFeedback.delete({
          where: { id: existing.id }
        });

        await tx.userEvent.create({
          data: {
            visitorId: visitorId || 'anonymous-visitor',
            userId: userId || null,
            sessionId: sessionId || 'default-session',
            eventType: 'ARTICLE_FEEDBACK_REMOVED',
            articleId,
            categoryId: article.categoryId,
            metadata: { previousFeedback: feedbackType }
          }
        });

        return { feedbackState: 'NONE' };
      }

      // 2. Upsert new active feedback state
      const feedback = await tx.articleFeedback.upsert({
        where: {
          canonicalId_articleId: {
            canonicalId,
            articleId
          }
        },
        update: {
          feedbackType,
          userId: userId || undefined,
          visitorId: visitorId || 'anonymous-visitor',
          updatedAt: new Date()
        },
        create: {
          canonicalId,
          visitorId: visitorId || 'anonymous-visitor',
          userId: userId || null,
          articleId,
          feedbackType
        }
      });

      // 3. Record historical event
      await tx.userEvent.create({
        data: {
          visitorId: visitorId || 'anonymous-visitor',
          userId: userId || null,
          sessionId: sessionId || 'default-session',
          eventType: feedbackType === 'LIKE' ? 'ARTICLE_LIKE' : 'ARTICLE_DISLIKE',
          articleId,
          categoryId: article.categoryId,
          metadata: { feedbackType }
        }
      });

      // 4. Update Category Interest Profile with proportional propagation
      const vId = visitorId || `usr-fallback-${userId}`;
      if (feedbackType === 'LIKE') {
        // Direct category boost
        await tx.userInterestProfile.upsert({
          where: {
            visitorId_categoryId: {
              visitorId: vId,
              categoryId: article.categoryId
            }
          },
          update: {
            score: { increment: 3.5 },
            interactionCount: { increment: 1 },
            lastInteractedAt: new Date(),
            userId: userId || undefined
          },
          create: {
            visitorId: vId,
            userId: userId || null,
            categoryId: article.categoryId,
            score: 3.5,
            interactionCount: 1,
            lastInteractedAt: new Date()
          }
        });

        // Parent category moderate boost if applicable
        if (article.category?.parentId) {
          await tx.userInterestProfile.upsert({
            where: {
              visitorId_categoryId: {
                visitorId: vId,
                categoryId: article.category.parentId
              }
            },
            update: {
              score: { increment: 1.5 },
              interactionCount: { increment: 1 },
              lastInteractedAt: new Date(),
              userId: userId || undefined
            },
            create: {
              visitorId: vId,
              userId: userId || null,
              categoryId: article.category.parentId,
              score: 1.5,
              interactionCount: 1,
              lastInteractedAt: new Date()
            }
          });
        }

        // Positive format type affinity boost
        await tx.userArticleTypePreference.upsert({
          where: {
            canonicalId_articleType: {
              canonicalId,
              articleType: article.type
            }
          },
          update: {
            positiveScore: { increment: 2.0 },
            interactionCount: { increment: 1 },
            lastInteractedAt: new Date(),
            userId: userId || undefined,
            visitorId: visitorId || undefined
          },
          create: {
            canonicalId,
            visitorId: visitorId || 'anonymous-visitor',
            userId: userId || null,
            articleType: article.type,
            positiveScore: 2.0,
            negativeScore: 0.0,
            interactionCount: 1,
            lastInteractedAt: new Date()
          }
        });
      } else if (feedbackType === 'DISLIKE') {
        // Conservative negative format affinity (does not erase type, accumulates evidence)
        await tx.userArticleTypePreference.upsert({
          where: {
            canonicalId_articleType: {
              canonicalId,
              articleType: article.type
            }
          },
          update: {
            negativeScore: { increment: 1.0 },
            interactionCount: { increment: 1 },
            lastInteractedAt: new Date(),
            userId: userId || undefined,
            visitorId: visitorId || undefined
          },
          create: {
            canonicalId,
            visitorId: visitorId || 'anonymous-visitor',
            userId: userId || null,
            articleType: article.type,
            positiveScore: 0.0,
            negativeScore: 1.0,
            interactionCount: 1,
            lastInteractedAt: new Date()
          }
        });
      }

      return { feedbackState: feedback.feedbackType };
    });
  }

  /**
   * Retrieves active feedback state for an article
   */
  static async getArticleFeedbackState({ visitorId, userId = null, articleId }) {
    if (!visitorId && !userId) return { feedbackState: 'NONE' };

    const { canonicalId } = this.resolveCanonicalIdentity(visitorId, userId);

    const feedback = await prisma.articleFeedback.findUnique({
      where: {
        canonicalId_articleId: {
          canonicalId,
          articleId
        }
      },
      select: { feedbackType: true }
    });

    return { feedbackState: feedback?.feedbackType || 'NONE' };
  }

  /**
   * Explicitly removes article feedback
   */
  static async removeArticleFeedback({ visitorId, userId = null, sessionId = null, articleId }) {
    const { canonicalId } = this.resolveCanonicalIdentity(visitorId, userId);

    const existing = await prisma.articleFeedback.findUnique({
      where: {
        canonicalId_articleId: {
          canonicalId,
          articleId
        }
      }
    });

    if (!existing) return { feedbackState: 'NONE' };

    await prisma.$transaction(async (tx) => {
      await tx.articleFeedback.delete({
        where: { id: existing.id }
      });

      await tx.userEvent.create({
        data: {
          visitorId: visitorId || 'anonymous-visitor',
          userId: userId || null,
          sessionId: sessionId || 'default-session',
          eventType: 'ARTICLE_FEEDBACK_REMOVED',
          articleId,
          metadata: { previousFeedback: existing.feedbackType }
        }
      });
    });

    return { feedbackState: 'NONE' };
  }

  /**
   * Retrieves active feedback maps for a user/visitor
   */
  static async getVisitorFeedbackMap(visitorId, userId = null) {
    const likedArticleIds = new Set();
    const dislikedArticleIds = new Set();
    const dislikedCategories = new Map();
    const dislikedTypes = new Map();
    const dislikedTagIds = new Set();

    if (!visitorId && !userId) {
      return { likedArticleIds, dislikedArticleIds, dislikedCategories, dislikedTypes, dislikedTagIds };
    }

    const { canonicalId } = this.resolveCanonicalIdentity(visitorId, userId);

    const feedbacks = await prisma.articleFeedback.findMany({
      where: {
        OR: [
          { canonicalId },
          ...(visitorId ? [{ visitorId }] : []),
          ...(userId ? [{ userId }] : [])
        ]
      },
      include: {
        article: {
          select: {
            id: true,
            categoryId: true,
            type: true,
            tags: { select: { tagId: true } }
          }
        }
      }
    });

    for (const f of feedbacks) {
      if (f.feedbackType === 'LIKE') {
        likedArticleIds.add(f.articleId);
      } else if (f.feedbackType === 'DISLIKE') {
        dislikedArticleIds.add(f.articleId);

        if (f.article) {
          // Track count of dislikes in category
          const catId = f.article.categoryId;
          dislikedCategories.set(catId, (dislikedCategories.get(catId) || 0) + 1);

          // Track count of dislikes for article type
          const aType = f.article.type;
          dislikedTypes.set(aType, (dislikedTypes.get(aType) || 0) + 1);

          // Track tags of disliked article
          if (Array.isArray(f.article.tags)) {
            for (const t of f.article.tags) {
              if (t.tagId) dislikedTagIds.add(t.tagId);
            }
          }
        }
      }
    }

    return { likedArticleIds, dislikedArticleIds, dislikedCategories, dislikedTypes, dislikedTagIds };
  }

  /**
   * Retrieves user article type preference map with time decay
   */
  static async getUserTypePreferenceMap(visitorId, userId = null) {
    const typeMap = new Map();
    if (!visitorId && !userId) return typeMap;

    const { canonicalId } = this.resolveCanonicalIdentity(visitorId, userId);

    const preferences = await prisma.userArticleTypePreference.findMany({
      where: {
        OR: [
          { canonicalId },
          ...(visitorId ? [{ visitorId }] : []),
          ...(userId ? [{ userId }] : [])
        ]
      }
    });

    for (const pref of preferences) {
      const daysSince = (Date.now() - new Date(pref.lastInteractedAt).getTime()) / (1000 * 60 * 60 * 24);
      const decay = Math.exp((-Math.LN2 / 30) * Math.max(0, daysSince));

      const decayedPositive = pref.positiveScore * decay;
      const decayedNegative = pref.negativeScore * decay;
      const netScore = decayedPositive - decayedNegative;

      // Sigmoid/linear normalized type affinity between 0.0 and 1.0
      // 0 net score -> 0.5 (neutral); positive net score -> up to 1.0; negative -> down to 0.0
      const normalizedAffinity = Math.max(0.0, Math.min(1.0, 0.5 + netScore * 0.1));

      typeMap.set(pref.articleType, {
        positiveScore: decayedPositive,
        negativeScore: decayedNegative,
        netScore,
        normalizedAffinity
      });
    }

    return typeMap;
  }

  /**
   * Records comment submission as a verified engagement signal
   */
  static async recordCommentEngagement({ articleId, userId, visitorId = null, isReply = false }) {
    if (!articleId) return;

    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: { id: true, categoryId: true, type: true }
      });

      if (!article) return;

      const eventType = isReply ? 'COMMENT_REPLY' : 'COMMENT_SUBMITTED';
      const weight = isReply
        ? RECOMMENDATION_CONFIG.thresholds.commentWeights.COMMENT_REPLY
        : RECOMMENDATION_CONFIG.thresholds.commentWeights.COMMENT_SUBMITTED;

      // 1. Record event
      await prisma.userEvent.create({
        data: {
          visitorId: visitorId || 'anonymous-visitor',
          userId: userId || null,
          sessionId: 'comment-session',
          eventType,
          articleId,
          categoryId: article.categoryId,
          metadata: { isReply }
        }
      });

      // 2. Proportional boost to category interest
      const vId = visitorId || `usr-fallback-${userId}`;
      await prisma.userInterestProfile.upsert({
        where: {
          visitorId_categoryId: {
            visitorId: vId,
            categoryId: article.categoryId
          }
        },
        update: {
          score: { increment: weight },
          interactionCount: { increment: 1 },
          lastInteractedAt: new Date(),
          userId: userId || undefined
        },
        create: {
          visitorId: vId,
          userId: userId || null,
          categoryId: article.categoryId,
          score: weight,
          interactionCount: 1,
          lastInteractedAt: new Date()
        }
      });

      // 3. Proportional boost to article type preference
      const { canonicalId } = this.resolveCanonicalIdentity(visitorId, userId);
      await prisma.userArticleTypePreference.upsert({
        where: {
          canonicalId_articleType: {
            canonicalId,
            articleType: article.type
          }
        },
        update: {
          positiveScore: { increment: 1.0 },
          interactionCount: { increment: 1 },
          lastInteractedAt: new Date(),
          userId: userId || undefined,
          visitorId: visitorId || undefined
        },
        create: {
          canonicalId,
          visitorId: visitorId || 'anonymous-visitor',
          userId: userId || null,
          articleType: article.type,
          positiveScore: 1.0,
          negativeScore: 0.0,
          interactionCount: 1,
          lastInteractedAt: new Date()
        }
      });
    } catch (err) {
      logger.error('Failed to record comment engagement for recommendations', { error: err.message });
    }
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
        const vId = visitorId || `usr-fallback-${userId}`;
        const profile = await tx.userInterestProfile.upsert({
          where: {
            visitorId_categoryId: {
              visitorId: vId,
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
            visitorId: vId,
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

  /**
   * Safely merges anonymous visitor data into an authenticated user account upon login/register
   */
  static async mergeVisitorToUser(visitorId, userId) {
    if (!visitorId || !userId) return;

    try {
      await prisma.$transaction(async (tx) => {
        // 1. Merge ArticleFeedback: reassign anonymous feedback to user if user hasn't already provided feedback
        const anonymousFeedbacks = await tx.articleFeedback.findMany({
          where: { visitorId, userId: null }
        });

        for (const af of anonymousFeedbacks) {
          const userCanonicalId = `usr:${userId}`;
          const existingUserFeedback = await tx.articleFeedback.findUnique({
            where: {
              canonicalId_articleId: {
                canonicalId: userCanonicalId,
                articleId: af.articleId
              }
            }
          });

          if (!existingUserFeedback) {
            await tx.articleFeedback.update({
              where: { id: af.id },
              data: {
                canonicalId: userCanonicalId,
                userId
              }
            });
          } else {
            // User already has an authenticated feedback on this article; remove anonymous duplicate
            await tx.articleFeedback.delete({ where: { id: af.id } });
          }
        }

        // 2. Merge UserArticleTypePreference
        const anonymousTypePrefs = await tx.userArticleTypePreference.findMany({
          where: { visitorId, userId: null }
        });

        for (const atp of anonymousTypePrefs) {
          const userCanonicalId = `usr:${userId}`;
          const existingUserTypePref = await tx.userArticleTypePreference.findUnique({
            where: {
              canonicalId_articleType: {
                canonicalId: userCanonicalId,
                articleType: atp.articleType
              }
            }
          });

          if (!existingUserTypePref) {
            await tx.userArticleTypePreference.update({
              where: { id: atp.id },
              data: {
                canonicalId: userCanonicalId,
                userId
              }
            });
          } else {
            await tx.userArticleTypePreference.update({
              where: { id: existingUserTypePref.id },
              data: {
                positiveScore: { increment: atp.positiveScore },
                negativeScore: { increment: atp.negativeScore },
                interactionCount: { increment: atp.interactionCount }
              }
            });
            await tx.userArticleTypePreference.delete({ where: { id: atp.id } });
          }
        }

        // 3. Associate anonymous historical events with user
        await tx.userEvent.updateMany({
          where: { visitorId, userId: null },
          data: { userId }
        });
      });
    } catch (err) {
      logger.error('Failed to merge visitor data to user', { error: err.message, visitorId, userId });
    }
  }
}
