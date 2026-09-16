import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ArticleDTO } from '../articles/article.dto.js';

export class BookmarkService {
  /**
   * Toggles bookmark state for an article by a user
   */
  static async toggleBookmark(articleId, userId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, status: true }
    });

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    const existing = await prisma.bookmark.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId
        }
      }
    });

    if (existing) {
      await prisma.bookmark.delete({
        where: {
          userId_articleId: {
            userId,
            articleId
          }
        }
      });
      return { bookmarked: false };
    } else {
      await prisma.bookmark.create({
        data: {
          userId,
          articleId
        }
      });
      return { bookmarked: true };
    }
  }

  /**
   * Retrieves paginated bookmarks saved by user
   */
  static async getUserBookmarks(userId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;

    const [bookmarks, total] = await Promise.all([
      prisma.bookmark.findMany({
        where: { userId },
        include: {
          article: {
            include: {
              category: true,
              author: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatarUrl: true
                }
              },
              tags: {
                include: { tag: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.bookmark.count({ where: { userId } })
    ]);

    const articles = bookmarks
      .filter(b => b.article && b.article.status === 'PUBLISHED')
      .map(b => ({
        ...ArticleDTO.toCardDTO(b.article),
        bookmarkedAt: b.createdAt
      }));

    return {
      articles,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Quick status check if user has bookmarked an article
   */
  static async isArticleBookmarked(articleId, userId) {
    if (!userId) return false;
    const count = await prisma.bookmark.count({
      where: {
        userId,
        articleId
      }
    });
    return count > 0;
  }
}
