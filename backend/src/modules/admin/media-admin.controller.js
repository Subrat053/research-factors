import { MediaAdminService } from './media-admin.service.js';

export class MediaAdminController {
  static async listMedia(req, res, next) {
    try {
      const { provider, mimeType, search, page, limit } = req.query;
      const result = await MediaAdminService.listMedia({ provider, mimeType, search, page, limit });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMedia(req, res, next) {
    try {
      const { id } = req.params;
      const result = await MediaAdminService.deleteMediaAsset(id, req.user.id);
      res.json({
        success: true,
        message: 'Media asset deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
