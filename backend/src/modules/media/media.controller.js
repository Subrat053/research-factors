import { MediaService } from './media.service.js';

export class MediaController {
  static async upload(req, res, next) {
    try {
      const media = await MediaService.uploadMedia(req.file, req.user.id, {
        altText: req.body.altText,
        caption: req.body.caption,
        source: req.body.source,
        license: req.body.license
      });

      res.status(201).json({
        success: true,
        message: 'Media asset uploaded and processed successfully',
        data: media
      });
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      const { id } = req.params;
      const hasAdminRights = req.user.permissions?.includes('media.manage') || false;
      await MediaService.deleteMedia(id, req.user.id, hasAdminRights);

      res.status(200).json({
        success: true,
        message: 'Media asset deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}
