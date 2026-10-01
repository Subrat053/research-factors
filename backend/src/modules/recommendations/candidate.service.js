import { prisma } from '../../config/db.js';

export class CandidateService {
  /**
   * Retrieves diverse candidate articles for recommendation scoring
   */
  static async getCandidates({
    currentArticleId = null,
    currentCategoryId = null,
    taxonomyContext = {},
    currentTagIds = [],
    interestCategoryIds = [],
    excludeArticleIds = [],
    limit = 36
  }) {
    const allExcludeIds = new Set(excludeArticleIds);
    if (currentArticleId) {
      allExcludeIds.add(currentArticleId);
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

    // Parallel multi-source candidate generation with dynamic taxonomy hierarchy
    const queries = [];

    // 1. Same exact category candidates (Highest priority pool)
    if (currentCategoryId) {
      queries.push(
        prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: currentCategoryId
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: 16
        })
      );
    }

    // 2. Parent category candidates (Fallback when in subcategory)
    if (parentCategoryId && parentCategoryId !== currentCategoryId) {
      queries.push(
        prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: parentCategoryId
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: 10
        })
      );
    }

    // 3. Sibling subcategory candidates (Fallback when in subcategory)
    if (siblingCategoryIds.length > 0) {
      queries.push(
        prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: { in: siblingCategoryIds }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: 12
        })
      );
    }

    // 4. Child subcategory candidates (Fallback when viewing parent category)
    if (childCategoryIds.length > 0) {
      queries.push(
        prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: { in: childCategoryIds }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: 14
        })
      );
    }

    // 5. Tag match candidates
    if (currentTagIds && currentTagIds.length > 0) {
      queries.push(
        prisma.article.findMany({
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
          take: 12
        })
      );
    }

    // 6. User interest profile categories
    if (interestCategoryIds && interestCategoryIds.length > 0) {
      queries.push(
        prisma.article.findMany({
          where: {
            ...baseWhere,
            categoryId: { in: interestCategoryIds }
          },
          include: includeRelations,
          orderBy: { publishedAt: 'desc' },
          take: 14
        })
      );
    }

    // 4. Trending & popular editorial fallback
    queries.push(
      prisma.article.findMany({
        where: baseWhere,
        include: includeRelations,
        orderBy: [
          { isFeatured: 'desc' },
          { viewCount: 'desc' },
          { publishedAt: 'desc' }
        ],
        take: 14
      })
    );

    const queryResults = await Promise.all(queries);

    // Deduplicate candidates by article id
    const candidateMap = new Map();
    for (const articleList of queryResults) {
      for (const article of articleList) {
        if (!candidateMap.has(article.id)) {
          candidateMap.set(article.id, article);
        }
      }
    }

    return Array.from(candidateMap.values()).slice(0, limit);
  }
}
