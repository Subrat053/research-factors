import { prisma } from '../../config/db.js';
import { RECOMMENDATION_CONFIG } from './recommendation.config.js';

export class CandidateService {
  /**
   * Retrieves diverse candidate articles across 8 candidate pools for recommendation scoring
   */
  static async getCandidates({
    currentArticleId = null,
    currentCategoryId = null,
    taxonomyContext = {},
    currentTagIds = [],
    interestCategoryIds = [],
    preferredArticleTypes = [],
    dislikedArticleIds = [],
    excludeArticleIds = [],
    limit = 80
  }) {
    const allExcludeIds = new Set(excludeArticleIds);
    if (currentArticleId) {
      allExcludeIds.add(currentArticleId);
    }
    // Hard suppression: explicitly disliked articles must NEVER be recommended
    if (Array.isArray(dislikedArticleIds)) {
      for (const id of dislikedArticleIds) {
        allExcludeIds.add(id);
      }
    }

    const parentCategoryId = taxonomyContext.parentCategoryId || null;
    const siblingCategoryIds = Array.isArray(taxonomyContext.siblingCategoryIds) ? taxonomyContext.siblingCategoryIds : [];
    const childCategoryIds = Array.isArray(taxonomyContext.childCategoryIds) ? taxonomyContext.childCategoryIds : [];

    const baseWhere = {
      status: 'PUBLISHED',
      publishedAt: { lte: new Date() },
      id: { notIn: Array.from(allExcludeIds) },
      category: {
        isActive: true
      },
      author: {
        status: 'ACTIVE'
      }
    };

    const includeRelations = {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          bio: true,
          createdAt: true
        }
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          imageUrl: true,
          parentId: true,
          parent: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      }
    };

    const poolSizes = RECOMMENDATION_CONFIG.thresholds.candidatePoolSizes;
    const namedQueries = [];

    // 1. Same exact category candidates (Highest topical cohesion pool)
    if (currentCategoryId) {
      namedQueries.push({
        source: 'same_category',
        query: prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: currentCategoryId
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: poolSizes.exactCategory || 20
        })
      });
    }

    // 2. Parent category candidates (Broader domain fallback)
    if (parentCategoryId && parentCategoryId !== currentCategoryId) {
      namedQueries.push({
        source: 'parent_category',
        query: prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: parentCategoryId
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: poolSizes.parentCategory || 12
        })
      });
    }

    // 3. Sibling subcategory candidates (Related domain disciplines)
    if (siblingCategoryIds.length > 0) {
      namedQueries.push({
        source: 'sibling_category',
        query: prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: { in: siblingCategoryIds }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: poolSizes.siblingCategory || 16
        })
      });
    }

    // 4. Child subcategory candidates (Domain specializations)
    if (childCategoryIds.length > 0) {
      namedQueries.push({
        source: 'child_category',
        query: prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: { in: childCategoryIds }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: poolSizes.childCategory || 16
        })
      });
    }

    // 5. Tag match candidates (Cross-category semantic convergence)
    if (currentTagIds && currentTagIds.length > 0) {
      namedQueries.push({
        source: 'matching_tags',
        query: prisma.article.findMany({
          where: {
            ...baseWhere,
            tags: {
              some: {
                tagId: { in: currentTagIds }
              }
            }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: poolSizes.tagMatch || 16
        })
      });
    }

    // 6. User interest profile categories (Learned reader affinity)
    if (interestCategoryIds && interestCategoryIds.length > 0) {
      namedQueries.push({
        source: 'user_interest',
        query: prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: { in: interestCategoryIds }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: poolSizes.userInterests || 16
        })
      });
    }

    // 7. Preferred article types pool (User format affinity)
    if (preferredArticleTypes && preferredArticleTypes.length > 0) {
      namedQueries.push({
        source: 'article_type_affinity',
        query: prisma.article.findMany({
          where: {
            ...baseWhere,
            type: { in: preferredArticleTypes }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: poolSizes.typeAffinity || 16
        })
      });
    }

    // 8. Trending & popular editorial fallback (Freshness & community velocity)
    namedQueries.push({
      source: 'trending_editorial',
      query: prisma.article.findMany({
        where: baseWhere,
        include: includeRelations,
        orderBy: [
          { isFeatured: 'desc' },
          { viewCount: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: poolSizes.trendingFallback || 16
      })
    });

    const queryResults = await Promise.all(namedQueries.map((nq) => nq.query));

    // Deduplicate candidates while merging selection sources
    const candidateMap = new Map();
    queryResults.forEach((articleList, index) => {
      const sourceName = namedQueries[index].source;
      for (const article of articleList) {
        if (!candidateMap.has(article.id)) {
          article.sources = new Set([sourceName]);
          candidateMap.set(article.id, article);
        } else {
          candidateMap.get(article.id).sources.add(sourceName);
        }
      }
    });

    // Convert candidate sources from Set to Array for downstream consumption
    for (const cand of candidateMap.values()) {
      cand.sources = Array.from(cand.sources);
    }

    return Array.from(candidateMap.values()).slice(0, Math.min(limit, poolSizes.totalPreScoreCap || 100));
  }
}
