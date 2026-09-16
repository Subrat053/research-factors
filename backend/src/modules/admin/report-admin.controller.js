import { ReportAdminService } from './report-admin.service.js';

export class ReportAdminController {
  static async listReports(req, res, next) {
    try {
      const { reason, page, limit } = req.query;
      const result = await ReportAdminService.listReports({ reason, page, limit });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async resolveReport(req, res, next) {
    try {
      const { id } = req.params;
      const { action, notes } = req.body;
      const result = await ReportAdminService.resolveReport(id, { action, notes }, req.user.id);
      res.json({
        success: true,
        message: 'Report resolved successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
