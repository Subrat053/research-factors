import { CommentService } from './comment.service.js';

export class CommentController {
  static async getByArticle(req, res, next) {
    try {
      const { articleId } = req.params;
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;
      const currentUserId = req.user?.id || null;

      const result = await CommentService.getCommentsByArticle(articleId, { page, limit, currentUserId });

      res.status(200).json({
        success: true,
        data: result.comments,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req, res, next) {
    try {
      const { articleId } = req.params;
      const { content, parentId } = req.body;
      const userId = req.user.id;

      const comment = await CommentService.createComment({
        articleId,
        userId,
        parentId,
        content
      });

      res.status(201).json({
        success: true,
        message: 'Comment posted successfully',
        data: comment
      });
    } catch (error) {
      next(error);
    }
  }

  static async toggleLike(req, res, next) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;

      const result = await CommentService.toggleLike(commentId, userId);

      res.status(200).json({
        success: true,
        message: result.liked ? 'Comment liked' : 'Comment like removed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async report(req, res, next) {
    try {
      const { commentId } = req.params;
      const { reason, details } = req.body;
      const userId = req.user.id;

      const result = await CommentService.reportComment({
        commentId,
        userId,
        reason: reason || 'OTHER',
        details
      });

      res.status(200).json({
        success: true,
        message: 'Report submitted for editorial review',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { commentId } = req.params;
      const userId = req.user.id;
      const hasModeratorRights = req.user.permissions?.includes('comment.moderate') || false;

      await CommentService.deleteComment(commentId, userId, hasModeratorRights);

      res.status(200).json({
        success: true,
        message: 'Comment deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
