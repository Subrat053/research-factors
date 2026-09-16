import { SettingsAdminService } from './settings-admin.service.js';

export class SettingsAdminController {
  static async getAllSettings(req, res, next) {
    try {
      const result = await SettingsAdminService.getAllSettings();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getPublicSettings(req, res, next) {
    try {
      const result = await SettingsAdminService.getPublicSettings();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const result = await SettingsAdminService.updateSettings(req.body, req.user.id);
      res.json({
        success: true,
        message: 'System settings updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async testEmail(req, res, next) {
    try {
      const { recipientEmail } = req.body;
      const result = await SettingsAdminService.testEmailConfiguration({ recipientEmail }, req.user.id);
      res.json({
        success: true,
        message: `Test email dispatched to ${recipientEmail}`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getSystemHealth(req, res, next) {
    try {
      const result = await SettingsAdminService.getSystemHealth();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getRegistrationStatus(req, res, next) {
    try {
      const result = await SettingsAdminService.getRegistrationStatus();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRegistrationStatus(req, res, next) {
    try {
      const { allowRegistration } = req.body;
      const result = await SettingsAdminService.updateRegistrationStatus(allowRegistration, req.user.id);
      res.json({
        success: true,
        message: `Public registration successfully ${result.allowRegistration ? 'activated' : 'deactivated'}`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
