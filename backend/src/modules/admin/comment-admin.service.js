import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class CommentAdminService {
  /**
   * Retrieves paginated list of all comments across all articles with filtering,
   * search, live status counts, and safe DTO serialization.
   */
  static async listAllComments({
    status = 'ALL',
    search = '',
    articleId = '',
    page = 1,
    limit = 20,
    sort = 'newest'
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const take = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * take;

    const where = {};

    // Status filter
    if (status && status !== 'ALL') {
      const validStatuses = ['VISIBLE', 'REPORTED', 'HIDDEN', 'DELETED', 'PENDING'];
      if (validStatuses.includes(status.toUpperCase())) {
        where.status = status.toUpperCase();
      }
    }

    // Article filter
    if (articleId && articleId.trim()) {
      where.articleId = articleId.trim();
    }

    // Search query across comment text, author name/email, and article title
    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { content: { contains: q, mode: 'insensitive' } },
        { user: { firstName: { contains: q, mode: 'insensitive' } } },
        { user: { lastName: { contains: q, mode: 'insensitive' } } },
        { user: { email: { contains: q, mode: 'insensitive' } } },
        { article: { title: { contains: q, mode: 'insensitive' } } }
      ];
    }

    // Sort order
    let orderBy = { createdAt: 'desc' };
    if (sort === 'oldest') {
      orderBy = { createdAt: 'asc' };
    } else if (sort === 'most_liked') {
      orderBy = { likeCount: 'desc' };
    } else if (sort === 'most_reported') {
      orderBy = { reports: { _count: 'desc' } };
    }

    // Parallel fetch: comments, filtered count, and global status counts for tabs
    const [comments, totalFiltered, totalAll, statusGroupCounts] = await Promise.all([
      prisma.comment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              avatarUrl: true,
              status: true
            }
          },
          article: {
            select: {
              id: true,
              title: true,
              slug: true
            }
          },
          reports: {
            select: {
              id: true,
              reason: true
            }
          },
          _count: {
            select: {
              replies: true,
              reports: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.comment.count({ where }),
      prisma.comment.count(),
      prisma.comment.groupBy({
        by: ['status'],
        _count: { id: true }
      })
    ]);

    // Build dictionary of status counts
    const statusCounts = {
      ALL: totalAll,
      VISIBLE: 0,
      REPORTED: 0,
      HIDDEN: 0,
      DELETED: 0,
      PENDING: 0
    };

    for (const group of statusGroupCounts) {
      if (statusCounts[group.status] !== undefined) {
        statusCounts[group.status] = group._count.id;
      }
    }

    // Safe DTO serialization
    const formatted = comments.map(c => ({
      id: c.id,
      parentId: c.parentId,
      depth: c.depth,
      content: c.content,
      status: c.status,
      likeCount: c.likeCount,
      replyCount: c._count.replies,
      reportCount: c._count.reports,
      reportReasons: Array.from(new Set(c.reports.map(r => r.reason))),
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      author: c.user ? {
        id: c.user.id,
        name: `${c.user.firstName} ${c.user.lastName}`.trim(),
        email: c.user.email,
        avatarUrl: c.user.avatarUrl,
        status: c.user.status
      } : {
        id: null,
        name: 'Deleted User',
        email: null,
        avatarUrl: null,
        status: 'DEACTIVATED'
      },
      article: c.article ? {
        id: c.article.id,
        title: c.article.title,
        slug: c.article.slug
      } : null
    }));

    return {
      comments: formatted,
      statusCounts,
      pagination: {
        total: totalFiltered,
        page: pageNum,
        limit: take,
        totalPages: Math.ceil(totalFiltered / take) || 1
      }
    };
  }

  /**
   * Retrieves granular reports submitted against a specific comment.
   */
  static async getCommentReports(commentId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            status: true
          }
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true
          }
        },
        reports: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatarUrl: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    return {
      comment: {
        id: comment.id,
        content: comment.content,
        status: comment.status,
        createdAt: comment.createdAt,
        author: comment.user ? {
          id: comment.user.id,
          name: `${comment.user.firstName} ${comment.user.lastName}`.trim(),
          email: comment.user.email,
          avatarUrl: comment.user.avatarUrl,
          status: comment.user.status
        } : null,
        article: comment.article
      },
      reports: comment.reports.map(r => ({
        id: r.id,
        reason: r.reason,
        details: r.details,
        createdAt: r.createdAt,
        reporter: r.user ? {
          id: r.user.id,
          name: `${r.user.firstName} ${r.user.lastName}`.trim(),
          email: r.user.email,
          avatarUrl: r.user.avatarUrl
        } : {
          id: null,
          name: 'Anonymous Reporter',
          email: null,
          avatarUrl: null
        }
      }))
    };
  }

  /**
   * Executes a moderation action on a comment (Approve, Hide, Delete),
   * cleans associated report queues, and records an immutable AuditLog.
   */
  static async moderateComment(commentId, { action, reason = null }, moderatorId) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    const actionUpper = (action || '').toUpperCase();
    let targetStatus;

    if (actionUpper === 'APPROVE' || actionUpper === 'RESTORE') {
      targetStatus = 'VISIBLE';
    } else if (actionUpper === 'HIDE' || actionUpper === 'REMOVE') {
      targetStatus = 'HIDDEN';
    } else if (actionUpper === 'DELETE' || actionUpper === 'SPAM') {
      targetStatus = 'DELETED';
    } else {
      throw new AppError(
        'Invalid moderation action. Allowed actions: APPROVE, RESTORE, HIDE, REMOVE, DELETE, SPAM',
        400,
        'INVALID_MODERATION_ACTION'
      );
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update comment status
      await tx.comment.update({
        where: { id: commentId },
        data: { status: targetStatus }
      });

      // 2. Resolve/clear associated reports for this comment
      await tx.commentReport.deleteMany({
        where: { commentId }
      });

      // 3. Record Audit Log entry
      await tx.auditLog.create({
        data: {
          actorId: moderatorId,
          action: `comment.${targetStatus.toLowerCase()}`,
          entityType: 'Comment',
          entityId: commentId,
          metadata: {
            action: actionUpper,
            reason: reason || null,
            previousStatus: comment.status,
            newStatus: targetStatus,
            articleId: comment.articleId,
            authorId: comment.userId
          }
        }
      });
    });

    return {
      id: commentId,
      status: targetStatus,
      message: `Comment status updated to ${targetStatus}`
    };
  }
}
