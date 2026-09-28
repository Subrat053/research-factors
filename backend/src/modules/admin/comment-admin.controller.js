import { CommentAdminService } from './comment-admin.service.js';

export class CommentAdminController {
  /**
   * GET /api/v1/admin/comments
   * Retrieves paginated comments across all articles with filtering, search, and status counts.
   */
  static async listComments(req, res, next) {
    try {
      const { status, search, articleId, page, limit, sort } = req.query;
      const result = await CommentAdminService.listAllComments({
        status,
        search,
        articleId,
        page,
        limit,
        sort
      });

      res.status(200).json({
        success: true,
        data: result.comments,
        statusCounts: result.statusCounts,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/admin/comments/:id/reports
   * Retrieves granular reports filed against a specific comment.
   */
  static async getCommentReports(req, res, next) {
    try {
      const { id } = req.params;
      const result = await CommentAdminService.getCommentReports(id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/admin/comments/:id/moderate
   * Moderates a comment (APPROVE, HIDE, DELETE) and records an audit log.
   */
  static async moderateComment(req, res, next) {
    try {
      const { id } = req.params;
      const { action, reason } = req.body;
      const moderatorId = req.user.id;

      const result = await CommentAdminService.moderateComment(
        id,
        { action, reason },
        moderatorId
      );

      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
