import { prisma } from '../config/db.js';
import { AppError } from './errorHandler.js';

/**
 * Ensures an author can only modify their own article draft unless they have override permissions
 */
export const requireArticleOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new AppError('Article ID parameter is required', 400, 'PARAM_REQUIRED'));
    }

    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        author: true
      }
    });

    if (!article) {
      return next(new AppError('Article not found', 404, 'ARTICLE_NOT_FOUND'));
    }

    const isOwner = article.authorId === req.user.id;
    const canOverride = req.user.isSuperAdmin || req.user.permissions?.has('article.update_any');

    if (!isOwner && !canOverride) {
      return next(new AppError('Access denied: You do not own this article', 403, 'FORBIDDEN_OWNERSHIP'));
    }

    req.article = article;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Ensures a user can only delete or update their own comment unless they are a moderator
 */
export const requireCommentOwnership = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!id) {
      return next(new AppError('Comment ID parameter is required', 400, 'PARAM_REQUIRED'));
    }

    const comment = await prisma.comment.findUnique({
      where: { id }
    });

    if (!comment) {
      return next(new AppError('Comment not found', 404, 'COMMENT_NOT_FOUND'));
    }

    const isOwner = comment.userId === req.user.id;
    const canModerate = req.user.isSuperAdmin || req.user.permissions?.has('comment.moderate');

    if (!isOwner && !canModerate) {
      return next(new AppError('Access denied: You do not own this comment', 403, 'FORBIDDEN_OWNERSHIP'));
    }

    req.comment = comment;
    next();
  } catch (error) {
    next(error);
  }
};
