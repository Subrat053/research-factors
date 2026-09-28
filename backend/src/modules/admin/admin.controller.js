import { AdminService } from './admin.service.js';
import { ArticleService } from '../articles/article.service.js';

export class AdminController {
  static async getStats(req, res, next) {
    try {
      const stats = await AdminService.getDashboardStats(req.user);
      res.status(200).json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  static async getReviewQueue(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;
      const status = req.query.status || undefined;

      const result = await AdminService.getReviewQueue({ page, limit, status });
      res.status(200).json({
        success: true,
        data: result.articles,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async reviewArticle(req, res, next) {
    try {
      const { id } = req.params;
      const { action, feedback, isFeatured } = req.body;
      const reviewerId = req.user.id;

      const updated = await AdminService.reviewArticle(id, reviewerId, { action, feedback, isFeatured });
      res.status(200).json({
        success: true,
        message: `Article successfully processed with action: ${action}`,
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async getModerationQueue(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 20;

      const result = await AdminService.getCommentModerationQueue({ page, limit });
      res.status(200).json({
        success: true,
        data: result.comments,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async moderateComment(req, res, next) {
    try {
      const { id } = req.params;
      const { action } = req.body;
      const moderatorId = req.user.id;

      const result = await AdminService.moderateComment(id, moderatorId, { action });
      res.status(200).json({
        success: true,
        message: `Comment moderation updated: ${action}`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAuditLogs(req, res, next) {
    try {
      const page = parseInt(req.query.page, 10) || 1;
      const limit = parseInt(req.query.limit, 10) || 50;

      const result = await AdminService.getAuditLogs({ page, limit });
      res.status(200).json({
        success: true,
        data: result.logs,
        logs: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitArticle(req, res, next) {
    try {
      const { id } = req.params;
      const authorId = req.user.id;

      const updated = await AdminService.submitForReview(id, authorId);
      res.status(200).json({
        success: true,
        message: 'Article successfully submitted for editorial review',
        data: updated
      });
    } catch (error) {
      next(error);
    }
  }

  static async listAllArticles(req, res, next) {
    try {
      const { search, status, authorId, categoryId, page, limit, sort } = req.query;
      const result = await AdminService.listAllArticles({ search, status, authorId, categoryId, page, limit, sort }, req.user);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async scheduleArticle(req, res, next) {
    try {
      const { id } = req.params;
      const { scheduledAt } = req.body;
      const result = await AdminService.scheduleArticle(id, req.user.id, { scheduledAt });
      res.status(200).json({
        success: true,
        message: 'Article successfully scheduled for publication',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async archiveArticle(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AdminService.archiveArticle(id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Article archived',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async publishArticle(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ArticleService.publishArticle(id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Article published live successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async forceDeleteArticle(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AdminService.forceDeleteArticle(id, req.user.id);
      res.status(200).json({
        success: true,
        message: 'Article permanently deleted',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateArticleStatus(req, res, next) {
    try {
      const { articleIds, action } = req.body;
      const result = await AdminService.bulkUpdateArticleStatus(articleIds, action, req.user.id);
      res.status(200).json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkDeleteArticles(req, res, next) {
    try {
      const { articleIds } = req.body;
      const result = await AdminService.bulkForceDeleteArticles(articleIds, req.user.id);
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
