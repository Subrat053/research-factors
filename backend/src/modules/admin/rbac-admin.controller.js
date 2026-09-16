import { RbacAdminService } from './rbac-admin.service.js';

export class RbacAdminController {
  static async listRoles(req, res, next) {
    try {
      const result = await RbacAdminService.listRoles();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async listPermissions(req, res, next) {
    try {
      const result = await RbacAdminService.listPermissions();
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async createRole(req, res, next) {
    try {
      const result = await RbacAdminService.createRole(req.body, req.user.id);
      res.status(201).json({
        success: true,
        message: 'Role created successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRole(req, res, next) {
    try {
      const { id } = req.params;
      const result = await RbacAdminService.updateRole(id, req.body, req.user.id);
      res.json({
        success: true,
        message: 'Role updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteRole(req, res, next) {
    try {
      const { id } = req.params;
      const result = await RbacAdminService.deleteRole(id, req.user.id);
      res.json({
        success: true,
        message: 'Role deleted successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateRolePermissions(req, res, next) {
    try {
      const { id } = req.params;
      const { permissionActions } = req.body;
      const result = await RbacAdminService.updateRolePermissions(id, { permissionActions }, req.user.id);
      res.json({
        success: true,
        message: 'Role permissions updated successfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}
