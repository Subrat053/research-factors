import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { ArticleDTO } from '../articles/article.dto.js';

export class AdminService {
  /**
   * Aggregates platform-wide dashboard metrics
   */
  static async getDashboardStats(actor) {
    const isStaff = actor?.isSuperAdmin || 
      actor?.permissions?.has('article.approve') || 
      actor?.permissions?.has('comment.moderate') || 
      actor?.permissions?.has('user.read_list');

    if (!isStaff && actor?.id) {
      // Author-centric dashboard stats
      const [articleCounts, totalArticles, myComments, recentArticles] = await Promise.all([
        prisma.article.groupBy({
          by: ['status'],
          where: { authorId: actor.id },
          _count: { id: true }
        }),
        prisma.article.count({ where: { authorId: actor.id } }),
        prisma.comment.count({ where: { article: { authorId: actor.id } } }),
        prisma.article.findMany({
          where: { authorId: actor.id },
          orderBy: { updatedAt: 'desc' },
          take: 6,
          include: {
            author: { select: { firstName: true, lastName: true, avatarUrl: true } },
            category: true
          }
        })
      ]);

      const statusMap = {};
      for (const row of articleCounts) {
        statusMap[row.status] = row._count.id;
      }

      const viewsAggregation = await prisma.article.aggregate({
        where: { authorId: actor.id },
        _sum: { viewCount: true }
      });

      return {
        isAuthorView: true,
        metrics: {
          totalArticles,
          publishedArticles: statusMap['PUBLISHED'] || 0,
          pendingReviewArticles: statusMap['PENDING_REVIEW'] || 0,
          draftArticles: statusMap['DRAFT'] || 0,
          rejectedArticles: statusMap['REJECTED'] || 0,
          archivedArticles: statusMap['ARCHIVED'] || 0,
          totalComments: myComments,
          totalViews: viewsAggregation._sum.viewCount || 0
        },
        recentActivity: recentArticles.map(a => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          status: a.status,
          rejectionReason: a.rejectionReason,
          author: `${a.author.firstName} ${a.author.lastName}`.trim(),
          category: a.category?.name || 'Uncategorized',
          updatedAt: a.updatedAt
        }))
      };
    }

    // 1. Group article status counts in a single query (Platform wide)
    const [articleCounts, totalArticles, totalComments, reportedComments] = await Promise.all([
      prisma.article.groupBy({
        by: ['status'],
        _count: { id: true }
      }),
      prisma.article.count(),
      prisma.comment.count(),
      prisma.comment.count({ where: { status: 'REPORTED' } })
    ]);

    const statusMap = {};
    for (const row of articleCounts) {
      statusMap[row.status] = row._count.id;
    }

    const publishedArticles = statusMap['PUBLISHED'] || 0;
    const pendingReviewArticles = statusMap['PENDING_REVIEW'] || 0;
    const draftArticles = statusMap['DRAFT'] || 0;
    const rejectedArticles = statusMap['REJECTED'] || 0;
    const archivedArticles = statusMap['ARCHIVED'] || 0;

    // 2. Fetch remaining entity counts
    const [totalUsers, totalAuthors, totalCategories, totalTags, unreadContactMessages] = await Promise.all([
      prisma.user.count(),
      prisma.authorProfile.count({ where: { isApproved: true } }),
      prisma.category.count(),
      prisma.tag.count(),
      prisma.contactMessage.count({ where: { isRead: false } })
    ]);

    // Recent 6 articles submitted or published
    const recentArticles = await prisma.article.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 6,
      include: {
        author: {
          select: { firstName: true, lastName: true, avatarUrl: true }
        },
        category: true
      }
    });

    return {
      isAuthorView: false,
      metrics: {
        totalArticles,
        publishedArticles,
        pendingReviewArticles,
        draftArticles,
        rejectedArticles,
        archivedArticles,
        totalComments,
        reportedComments,
        totalUsers,
        totalAuthors,
        totalCategories,
        totalTags,
        unreadContactMessages
      },
      recentActivity: recentArticles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        status: a.status,
        author: `${a.author.firstName} ${a.author.lastName}`.trim(),
        category: a.category?.name || 'Uncategorized',
        updatedAt: a.updatedAt
      }))
    };
  }

  /**
   * Retrieves paginated articles in review queue
   */
  static async getReviewQueue({ page = 1, limit = 20, status = 'PENDING_REVIEW' }) {
    const skip = (page - 1) * limit;

    const where = status ? { status } : {};

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true
            }
          },
          category: true,
          blocks: {
            orderBy: { position: 'asc' }
          },
          tags: {
            include: { tag: true }
          }
        },
        orderBy: { updatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.article.count({ where })
    ]);

    return {
      articles: articles.map(a => ArticleDTO.toPublicDetail(a)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Reviews article (Approve, Reject, or Direct Publish)
   */
  static async reviewArticle(articleId, reviewerId, { action, feedback = null, isFeatured = undefined }) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { author: true }
    });

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    let newStatus;
    let publishedAt = article.publishedAt;

    if (action === 'APPROVE') {
      newStatus = 'APPROVED';
    } else if (action === 'PUBLISH') {
      newStatus = 'PUBLISHED';
      publishedAt = new Date();
    } else if (action === 'REJECT') {
      newStatus = 'REJECTED';
    } else {
      throw new AppError('Invalid review action. Allowed: APPROVE, PUBLISH, REJECT', 400, 'INVALID_ACTION');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const updateData = {
        status: newStatus,
        publishedAt
      };
      if (typeof isFeatured === 'boolean') {
        updateData.isFeatured = isFeatured;
      }

      const art = await tx.article.update({
        where: { id: articleId },
        data: updateData,
        include: {
          author: true,
          category: true,
          blocks: true,
          tags: { include: { tag: true } }
        }
      });

      // Maintain slug history if publishing
      if (newStatus === 'PUBLISHED') {
        await tx.articleSlugHistory.upsert({
          where: { slug: art.slug },
          create: { slug: art.slug, articleId: art.id },
          update: {}
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: `article.${action.toLowerCase()}`,
          entityType: 'Article',
          entityId: articleId,
          metadata: {
            previousStatus: article.status,
            newStatus,
            feedback
          }
        }
      });

      // Dispatch notification to author
      await tx.notification.create({
        data: {
          userId: article.authorId,
          type: `ARTICLE_${action}`,
          title: `Article ${action === 'PUBLISH' ? 'Published' : action === 'APPROVE' ? 'Approved' : 'Returned with Feedback'}`,
          message: feedback || `Your submission "${article.title}" has been ${action.toLowerCase()}ed by the editorial team.`,
          entityId: articleId
        }
      });

      return art;
    });

    return ArticleDTO.toPublicDetail(updated);
  }

  /**
   * Comment Moderation Queue
   */
  static async getCommentModerationQueue({ page = 1, limit = 20 }) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: {
          OR: [
            { status: 'REPORTED' },
            { reports: { some: {} } }
          ]
        },
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
          },
          article: {
            select: { id: true, title: true, slug: true }
          },
          reports: {
            include: {
              user: {
                select: { id: true, firstName: true, lastName: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.comment.count({
        where: {
          OR: [
            { status: 'REPORTED' },
            { reports: { some: {} } }
          ]
        }
      })
    ]);

    const formatted = comments.map(c => ({
      id: c.id,
      content: c.content,
      status: c.status,
      likeCount: c.likeCount,
      reportCount: c.reports.length,
      createdAt: c.createdAt,
      author: {
        id: c.user.id,
        name: `${c.user.firstName} ${c.user.lastName}`.trim(),
        email: c.user.email,
        avatarUrl: c.user.avatarUrl
      },
      article: c.article,
      reports: c.reports.map(r => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        reporter: `${r.user.firstName} ${r.user.lastName}`.trim(),
        createdAt: r.createdAt
      }))
    }));

    return {
      comments: formatted,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Moderate Comment (Restore / Hide / Spam)
   */
  static async moderateComment(commentId, moderatorId, { action }) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    let status;
    if (action === 'APPROVE') {
      status = 'VISIBLE';
    } else if (action === 'REMOVE') {
      status = 'HIDDEN';
    } else if (action === 'SPAM') {
      status = 'HIDDEN';
    } else {
      throw new AppError('Invalid moderation action. Allowed: APPROVE, REMOVE, SPAM', 400, 'INVALID_ACTION');
    }

    await prisma.$transaction(async (tx) => {
      await tx.comment.update({
        where: { id: commentId },
        data: { status }
      });

      await tx.auditLog.create({
        data: {
          actorId: moderatorId,
          action: `comment.${action.toLowerCase()}`,
          entityType: 'Comment',
          entityId: commentId,
          metadata: { previousStatus: comment.status, newStatus: status }
        }
      });
    });

    return { id: commentId, status };
  }

  /**
   * Audit Logs
   */
  static async getAuditLogs({ page = 1, limit = 50 }) {
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        include: {
          actor: {
            select: { id: true, firstName: true, lastName: true, email: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.auditLog.count()
    ]);

    return {
      logs: logs.map(l => ({
        id: l.id,
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        metadata: l.metadata,
        createdAt: l.createdAt,
        actor: l.actor ? `${l.actor.firstName} ${l.actor.lastName}`.trim() : 'System'
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Submit Article For Review by Author
   */
  static async submitForReview(articleId, authorId) {
    const article = await prisma.article.findUnique({
      where: { id: articleId },
      include: { blocks: true }
    });

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    if (article.authorId !== authorId) {
      throw new AppError('You can only submit your own drafts for review', 403, 'FORBIDDEN_SUBMIT');
    }

    if (!['DRAFT', 'REJECTED'].includes(article.status)) {
      throw new AppError(`Cannot submit article currently in ${article.status} state`, 400, 'INVALID_STATUS');
    }

    if (!article.title || article.title.length < 5) {
      throw new AppError('Article title must be at least 5 characters before submitting', 400, 'INVALID_TITLE');
    }

    if (!article.blocks || article.blocks.length === 0) {
      throw new AppError('Article must have at least one content block before submitting', 400, 'NO_CONTENT_BLOCKS');
    }

    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { status: 'PENDING_REVIEW' },
      include: {
        author: true,
        category: true,
        blocks: true,
        tags: { include: { tag: true } }
      }
    });

    return ArticleDTO.toPublicDetail(updated);
  }

  static async listAllArticles({ search = '', status = '', authorId = '', categoryId = '', page = 1, limit = 20, sort = 'updatedAt_desc' }, actor) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};
    if (status) {
      where.status = status;
    }

    const canViewAny = actor?.isSuperAdmin || 
      actor?.permissions?.has('article.approve') || 
      actor?.permissions?.has('article.update_any');

    if (!canViewAny && actor?.id) {
      // Dynamic scope: non-editors automatically scoped to their own articles
      where.authorId = actor.id;
    } else if (authorId) {
      where.authorId = authorId;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }
    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { subtitle: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } }
      ];
    }

    const orderBy = [];
    if (sort === 'createdAt_desc') {
      orderBy.push({ createdAt: 'desc' });
    } else if (sort === 'views_desc') {
      orderBy.push({ viewCount: 'desc' });
    } else {
      orderBy.push({ updatedAt: 'desc' });
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          author: {
            select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true }
          },
          category: true,
          tags: { include: { tag: true } }
        },
        orderBy,
        skip,
        take
      }),
      prisma.article.count({ where })
    ]);

    return {
      articles: articles.map(a => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        subtitle: a.subtitle,
        excerpt: a.excerpt,
        status: a.status,
        type: a.type,
        readingTimeMin: a.readingTimeMin,
        viewCount: a.viewCount,
        publishedAt: a.publishedAt,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        rejectionReason: a.rejectionReason,
        isFeatured: a.isFeatured,
        coverImageUrl: a.coverImageUrl,
        author: {
          id: a.author.id,
          name: `${a.author.firstName} ${a.author.lastName}`.trim(),
          email: a.author.email,
          avatarUrl: a.author.avatarUrl
        },
        category: a.category ? { id: a.category.id, name: a.category.name, slug: a.category.slug } : null,
        tags: a.tags.map(t => ({ id: t.tag.id, name: t.tag.name, slug: t.tag.slug }))
      })),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Schedules article for future publication
   */
  static async scheduleArticle(articleId, reviewerId, { scheduledAt }) {
    if (!scheduledAt) {
      throw new AppError('Scheduled publication date/time is required', 400, 'SCHEDULE_DATE_REQUIRED');
    }

    const targetDate = new Date(scheduledAt);
    if (isNaN(targetDate.getTime()) || targetDate <= new Date()) {
      throw new AppError('Scheduled date must be a valid timestamp in the future', 400, 'INVALID_SCHEDULE_DATE');
    }

    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const art = await tx.article.update({
        where: { id: articleId },
        data: {
          status: 'APPROVED',
          publishedAt: targetDate
        }
      });

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'article.schedule',
          entityType: 'Article',
          entityId: articleId,
          metadata: { scheduledAt: targetDate.toISOString() }
        }
      });

      await tx.notification.create({
        data: {
          userId: article.authorId,
          type: 'ARTICLE_SCHEDULED',
          title: 'Article Scheduled for Publication',
          message: `Your article "${article.title}" is scheduled to go live on ${targetDate.toLocaleDateString()}.`
        }
      });

      return art;
    });

    return updated;
  }

  /**
   * Archives or unpublishes a live article
   */
  static async archiveArticle(articleId, reviewerId) {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const art = await tx.article.update({
        where: { id: articleId },
        data: { status: 'ARCHIVED' }
      });

      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: 'article.archive',
          entityType: 'Article',
          entityId: articleId,
          metadata: { previousStatus: article.status }
        }
      });

      return art;
    });

    return updated;
  }

  /**
   * Force deletes an article and its associated blocks, tags, bookmarks
   */
  static async forceDeleteArticle(articleId, actorId) {
    const article = await prisma.article.findUnique({ where: { id: articleId } });
    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      await tx.articleBlock.deleteMany({ where: { articleId } });
      await tx.articleTag.deleteMany({ where: { articleId } });
      await tx.bookmark.deleteMany({ where: { articleId } });
      await tx.comment.deleteMany({ where: { articleId } });
      await tx.articleSlugHistory.deleteMany({ where: { articleId } });
      await tx.article.delete({ where: { id: articleId } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'article.force_delete',
          entityType: 'Article',
          entityId: articleId,
          metadata: { title: article.title, slug: article.slug, authorId: article.authorId }
        }
      });
    });

    return { id: articleId, deleted: true };
  }

  /**
   * Bulk updates article status (publish or archive)
   */
  static async bulkUpdateArticleStatus(articleIds, action, reviewerId) {
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      throw new AppError('articleIds array is required and must not be empty', 400, 'INVALID_ARTICLE_IDS');
    }

    if (!['publish', 'archive'].includes(action)) {
      throw new AppError('Invalid bulk action. Allowed: publish, archive', 400, 'INVALID_ACTION');
    }

    const newStatus = action === 'publish' ? 'PUBLISHED' : 'ARCHIVED';

    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, slug: true, status: true }
    });

    if (articles.length === 0) {
      return { updatedCount: 0, message: 'No matching articles found' };
    }

    const foundIds = articles.map(a => a.id);

    await prisma.$transaction(async (tx) => {
      const updateData = { status: newStatus };
      if (action === 'publish') {
        updateData.publishedAt = new Date();
      }

      await tx.article.updateMany({
        where: { id: { in: foundIds } },
        data: updateData
      });

      // Upsert slug history if publishing
      if (action === 'publish') {
        for (const art of articles) {
          await tx.articleSlugHistory.upsert({
            where: { slug: art.slug },
            create: { slug: art.slug, articleId: art.id },
            update: {}
          });
        }
      }

      // Record bulk audit log
      await tx.auditLog.create({
        data: {
          actorId: reviewerId,
          action: `article.bulk_${action}`,
          entityType: 'Article',
          entityId: 'bulk',
          metadata: {
            articleIds: foundIds,
            count: foundIds.length,
            newStatus
          }
        }
      });
    }, { maxWait: 10000, timeout: 30000 });

    return {
      updatedCount: foundIds.length,
      message: `Successfully updated ${foundIds.length} article(s) to ${newStatus}`
    };
  }

  /**
   * Bulk force deletes articles and their child blocks, tags, bookmarks, comments
   */
  static async bulkForceDeleteArticles(articleIds, actorId) {
    if (!Array.isArray(articleIds) || articleIds.length === 0) {
      throw new AppError('articleIds array is required and must not be empty', 400, 'INVALID_ARTICLE_IDS');
    }

    const articles = await prisma.article.findMany({
      where: { id: { in: articleIds } },
      select: { id: true, title: true }
    });

    if (articles.length === 0) {
      return { deletedCount: 0, message: 'No matching articles found' };
    }

    const foundIds = articles.map(a => a.id);

    await prisma.$transaction(async (tx) => {
      await tx.articleBlock.deleteMany({ where: { articleId: { in: foundIds } } });
      await tx.articleTag.deleteMany({ where: { articleId: { in: foundIds } } });
      await tx.bookmark.deleteMany({ where: { articleId: { in: foundIds } } });
      await tx.comment.deleteMany({ where: { articleId: { in: foundIds } } });
      await tx.articleSlugHistory.deleteMany({ where: { articleId: { in: foundIds } } });
      await tx.article.deleteMany({ where: { id: { in: foundIds } } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'article.bulk_force_delete',
          entityType: 'Article',
          entityId: 'bulk',
          metadata: {
            articleIds: foundIds,
            count: foundIds.length,
            titles: articles.map(a => a.title)
          }
        }
      });
    });

    return {
      deletedCount: foundIds.length,
      message: `Successfully deleted ${foundIds.length} article(s) permanently`
    };
  }
}
