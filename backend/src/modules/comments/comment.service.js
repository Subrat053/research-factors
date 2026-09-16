import sanitizeHtml from 'sanitize-html';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

const SANITIZE_OPTIONS = {
  allowedTags: ['b', 'i', 'em', 'strong', 'a', 'code', 'p', 'br'],
  allowedAttributes: {
    a: ['href', 'target', 'rel']
  },
  transformTags: {
    a: (tagName, attribs) => ({
      tagName: 'a',
      attribs: {
        ...attribs,
        target: '_blank',
        rel: 'noopener noreferrer nofollow'
      }
    })
  }
};

export class CommentService {
  /**
   * Fetches published comments for an article with 1-level nested replies
   */
  static async getCommentsByArticle(articleId, { page = 1, limit = 50, currentUserId = null }) {
    const skip = (page - 1) * limit;

    const topLevelComments = await prisma.comment.findMany({
      where: {
        articleId,
        parentId: null,
        status: { in: ['VISIBLE', 'REPORTED'] }
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        },
        replies: {
          where: {
            status: { in: ['VISIBLE', 'REPORTED'] }
          },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                avatarUrl: true
              }
            },
            likes: currentUserId ? { where: { userId: currentUserId } } : false
          },
          orderBy: { createdAt: 'asc' }
        },
        likes: currentUserId ? { where: { userId: currentUserId } } : false
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    });

    const total = await prisma.comment.count({
      where: {
        articleId,
        parentId: null,
        status: { in: ['VISIBLE', 'REPORTED'] }
      }
    });

    const formattedComments = topLevelComments.map(comment => ({
      id: comment.id,
      content: comment.content,
      status: comment.status,
      likeCount: comment.likeCount,
      hasLiked: currentUserId ? comment.likes.length > 0 : false,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.user.id,
        name: `${comment.user.firstName} ${comment.user.lastName}`.trim(),
        avatarUrl: comment.user.avatarUrl
      },
      replies: comment.replies.map(reply => ({
        id: reply.id,
        parentId: reply.parentId,
        content: reply.content,
        status: reply.status,
        likeCount: reply.likeCount,
        hasLiked: currentUserId ? reply.likes.length > 0 : false,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
        author: {
          id: reply.user.id,
          name: `${reply.user.firstName} ${reply.user.lastName}`.trim(),
          avatarUrl: reply.user.avatarUrl
        }
      }))
    }));

    return {
      comments: formattedComments,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Creates a new comment or 1-level reply
   */
  static async createComment({ articleId, userId, parentId = null, content }) {
    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      throw new AppError('Comment content cannot be empty', 400, 'EMPTY_COMMENT');
    }

    const cleanContent = sanitizeHtml(content.trim(), SANITIZE_OPTIONS);
    if (!cleanContent || cleanContent.trim().length === 0) {
      throw new AppError('Comment content contains only disallowed or invalid markup', 400, 'INVALID_CONTENT');
    }

    const article = await prisma.article.findUnique({
      where: { id: articleId },
      select: { id: true, authorId: true, title: true, status: true }
    });

    if (!article) {
      throw new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND');
    }

    let depth = 0;
    let parentComment = null;

    if (parentId) {
      parentComment = await prisma.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        throw new AppError('Parent comment does not exist', 404, 'PARENT_COMMENT_NOT_FOUND');
      }

      // Hard depth cap <= 1 rule
      if (parentComment.depth >= 1) {
        throw new AppError(
          'Replies are limited to a maximum depth of 1 level (direct replies only)',
          400,
          'DEPTH_LIMIT_EXCEEDED'
        );
      }

      depth = 1;
    }

    const newComment = await prisma.comment.create({
      data: {
        articleId,
        userId,
        parentId: parentId || null,
        depth,
        content: cleanContent,
        status: 'VISIBLE'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true
          }
        }
      }
    });

    // Fire notification to parent author or article author
    try {
      const recipientId = parentComment ? parentComment.userId : article.authorId;
      if (recipientId && recipientId !== userId) {
        await prisma.notification.create({
          data: {
            userId: recipientId,
            type: parentComment ? 'COMMENT_REPLY' : 'ARTICLE_COMMENT',
            title: parentComment ? 'New reply to your comment' : 'New comment on your article',
            message: `${newComment.user.firstName} left a response: "${cleanContent.substring(0, 80)}..."`,
            entityId: articleId
          }
        });
      }
    } catch {
      // Non-blocking notification dispatch
    }

    return {
      id: newComment.id,
      parentId: newComment.parentId,
      content: newComment.content,
      status: newComment.status,
      likeCount: newComment.likeCount,
      hasLiked: false,
      createdAt: newComment.createdAt,
      author: {
        id: newComment.user.id,
        name: `${newComment.user.firstName} ${newComment.user.lastName}`.trim(),
        avatarUrl: newComment.user.avatarUrl
      },
      replies: []
    };
  }

  /**
   * Atomic toggle like with transaction
   */
  static async toggleLike(commentId, userId) {
    return prisma.$transaction(async (tx) => {
      const comment = await tx.comment.findUnique({
        where: { id: commentId },
        select: { id: true, likeCount: true }
      });

      if (!comment) {
        throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
      }

      const existingLike = await tx.commentLike.findUnique({
        where: {
          userId_commentId: {
            userId,
            commentId
          }
        }
      });

      if (existingLike) {
        await tx.commentLike.delete({
          where: {
            userId_commentId: {
              userId,
              commentId
            }
          }
        });

        const updated = await tx.comment.update({
          where: { id: commentId },
          data: {
            likeCount: { decrement: 1 }
          },
          select: { likeCount: true }
        });

        return { liked: false, likeCount: Math.max(0, updated.likeCount) };
      } else {
        await tx.commentLike.create({
          data: {
            userId,
            commentId
          }
        });

        const updated = await tx.comment.update({
          where: { id: commentId },
          data: {
            likeCount: { increment: 1 }
          },
          select: { likeCount: true }
        });

        return { liked: true, likeCount: updated.likeCount };
      }
    });
  }

  /**
   * Anti-abuse report flagging with auto-quarantine threshold (>= 3 flags -> REPORTED)
   */
  static async reportComment({ commentId, userId, reason, details = null }) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    // Upsert report to prevent duplicate reports from the same user
    await prisma.commentReport.upsert({
      where: {
        userId_commentId: {
          userId,
          commentId
        }
      },
      create: {
        userId,
        commentId,
        reason,
        details
      },
      update: {
        reason,
        details
      }
    });

    // Check report count threshold
    const reportCount = await prisma.commentReport.count({
      where: { commentId }
    });

    let currentStatus = comment.status;
    if (reportCount >= 3 && comment.status === 'VISIBLE') {
      await prisma.comment.update({
        where: { id: commentId },
        data: { status: 'REPORTED' }
      });
      currentStatus = 'REPORTED';
    }

    return {
      reported: true,
      reportCount,
      status: currentStatus
    };
  }

  /**
   * Soft or hard delete comment
   */
  static async deleteComment(commentId, userId, hasModeratorRights = false) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!comment) {
      throw new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND');
    }

    if (!hasModeratorRights && comment.userId !== userId) {
      throw new AppError('You do not have permission to delete this comment', 403, 'FORBIDDEN_COMMENT_DELETE');
    }

    await prisma.comment.delete({
      where: { id: commentId }
    });

    return true;
  }
}
