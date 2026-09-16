import { TagAdminService } from './tag-admin.service.js';

export class TagAdminController {
  static async listTags(req, res, next) {
    try {
      const { search, page, limit } = req.query;
      const result = await TagAdminService.listTags({ search, page, limit });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async createTag(req, res, next) {
    try {
      const result = await TagAdminService.createTag(req.body);
      res.status(201).json({
        success: true,
        message: 'Tag created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTag(req, res, next) {
    try {
      const { id } = req.params;
      const result = await TagAdminService.updateTag(id, req.body);
      res.json({
        success: true,
        message: 'Tag updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTag(req, res, next) {
    try {
      const { id } = req.params;
      const result = await TagAdminService.deleteTag(id, req.user.id);
      res.json({
        success: true,
        message: 'Tag deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async mergeTags(req, res, next) {
    try {
      const { sourceTagId, targetTagId } = req.body;
      const result = await TagAdminService.mergeTags({ sourceTagId, targetTagId }, req.user.id);
      res.json({
        success: true,
        message: 'Tags merged successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
