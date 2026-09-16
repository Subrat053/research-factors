import { AuthorAdminService } from './author-admin.service.js';

export class AuthorAdminController {
  static async listAuthors(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await AuthorAdminService.listAuthors({ search, page, limit });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPendingApplications(req, res, next) {
    try {
      const { page, limit } = req.query;
      const result = await AuthorAdminService.listPendingApplications({ page, limit });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async approveApplication(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AuthorAdminService.approveApplication(id, req.user.id);
      res.json({
        success: true,
        message: 'Author application approved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async rejectApplication(req, res, next) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const result = await AuthorAdminService.rejectApplication(id, req.user.id, { reason });
      res.json({
        success: true,
        message: 'Author application rejected',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateAuthorProfile(req, res, next) {
    try {
      const { id } = req.params;
      const result = await AuthorAdminService.updateAuthorProfile(id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Author profile updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
