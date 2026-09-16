import { UserAdminService } from './user-admin.service.js';

export class UserAdminController {
  static async getUsers(req, res, next) {
    try {
      const { search, role, status, page, limit, sort } = req.query;
      const result = await UserAdminService.getUsers({ search, role, status, page, limit, sort });
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async getUserDetails(req, res, next) {
    try {
      const { id } = req.params;
      const result = await UserAdminService.getUserDetails(id);
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUserStatus(req, res, next) {
    try {
      const { id } = req.params;
      const { status, reason } = req.body;
      const result = await UserAdminService.updateUserStatus(id, { status, reason }, req.user);
      res.json({
        success: true,
        message: `User status successfully updated to ${status}`,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async assignUserRoles(req, res, next) {
    try {
      const { id } = req.params;
      const { roleNames } = req.body;
      const result = await UserAdminService.assignUserRoles(id, { roleNames }, req.user);
      res.json({
        success: true,
        message: 'User roles updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async createUser(req, res, next) {
    try {
      const { firstName, lastName, email, password, bio, roleNames, emailVerified } = req.body;
      const result = await UserAdminService.createUser(
        { firstName, lastName, email, password, bio, roleNames, emailVerified },
        req.user
      );
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
