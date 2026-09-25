import { ContactAdminService } from './contact-admin.service.js';

export class ContactAdminController {
  static async listMessages(req, res, next) {
    try {
      const { status, search, page, limit, type } = req.query;
      const result = await ContactAdminService.listMessages({ status, search, page, limit, type });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateMessage(req, res, next) {
    try {
      const { id } = req.params;
      const { isRead, isResolved } = req.body;
      const result = await ContactAdminService.updateMessage(id, { isRead, isResolved }, req.user.id);
      res.json({
        success: true,
        message: 'Message status updated',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteMessage(req, res, next) {
    try {
      const { id } = req.params;
      const result = await ContactAdminService.deleteMessage(id, req.user.id);
      res.json({
        success: true,
        message: 'Message deleted',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkUpdateMessages(req, res, next) {
    try {
      const { messageIds, data } = req.body;
      const result = await ContactAdminService.bulkUpdateMessages(messageIds, data, req.user.id);
      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async bulkDeleteMessages(req, res, next) {
    try {
      const { messageIds } = req.body;
      const result = await ContactAdminService.bulkDeleteMessages(messageIds, req.user.id);
      res.json({
        success: true,
        message: result.message,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
