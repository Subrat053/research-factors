import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class RbacAdminService {
  /**
   * Lists all roles with assigned user counts and associated permissions
   */
  static async listRoles() {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true
          }
        },
        _count: {
          select: { users: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return roles.map(r => ({
      id: r.id,
      name: r.name,
      description: r.description,
      isSystem: r.isSystem,
      userCount: r._count.users,
      permissions: r.permissions.map(rp => ({
        id: rp.permission.id,
        action: rp.permission.action,
        module: rp.permission.module,
        description: rp.permission.description
      })),
      createdAt: r.createdAt,
      updatedAt: r.updatedAt
    }));
  }

  /**
   * Retrieves all permissions grouped by module
   */
  static async listPermissions() {
    const permissions = await prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { action: 'asc' }]
    });

    const grouped = {};
    for (const p of permissions) {
      if (!grouped[p.module]) {
        grouped[p.module] = [];
      }
      grouped[p.module].push({
        id: p.id,
        action: p.action,
        module: p.module,
        description: p.description
      });
    }

    return {
      all: permissions,
      grouped
    };
  }

  /**
   * Creates a new custom (non-system) role
   */
  static async createRole({ name, description, permissionActions = [] }, actorId) {
    if (!name || name.trim().length < 2) {
      throw new AppError('Role name must be at least 2 characters long', 400, 'INVALID_ROLE_NAME');
    }

    const normalizedName = name.trim().toUpperCase().replace(/\s+/g, '_');

    const existing = await prisma.role.findUnique({
      where: { name: normalizedName }
    });

    if (existing) {
      throw new AppError(`A role with name '${normalizedName}' already exists`, 409, 'ROLE_ALREADY_EXISTS');
    }

    const created = await prisma.$transaction(async (tx) => {
      const role = await tx.role.create({
        data: {
          name: normalizedName,
          description: description?.trim() || null,
          isSystem: false
        }
      });

      if (permissionActions.length > 0) {
        const perms = await tx.permission.findMany({
          where: { action: { in: permissionActions } }
        });

        if (perms.length > 0) {
          await tx.rolePermission.createMany({
            data: perms.map(p => ({
              roleId: role.id,
              permissionId: p.id
            }))
          });
        }
      }

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'role.create',
          entityType: 'Role',
          entityId: role.id,
          metadata: { name: normalizedName, permissionActions }
        }
      });

      return tx.role.findUnique({
        where: { id: role.id },
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } }
        }
      });
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      isSystem: created.isSystem,
      userCount: created._count.users,
      permissions: created.permissions.map(rp => rp.permission)
    };
  }

  /**
   * Updates an existing role (system roles cannot be renamed)
   */
  static async updateRole(roleId, { name, description }, actorId) {
    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    const updateData = {};
    if (description !== undefined) {
      updateData.description = description;
    }

    if (name && name.trim() !== role.name) {
      if (role.isSystem) {
        throw new AppError('System roles (SUPER_ADMIN, ADMIN, etc.) cannot be renamed', 400, 'SYSTEM_ROLE_CANNOT_BE_RENAMED');
      }
      updateData.name = name.trim().toUpperCase().replace(/\s+/g, '_');
    }

    const updated = await prisma.$transaction(async (tx) => {
      const r = await tx.role.update({
        where: { id: roleId },
        data: updateData
      });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'role.update',
          entityType: 'Role',
          entityId: roleId,
          metadata: { previous: role, updated: updateData }
        }
      });

      return r;
    });

    return updated;
  }

  /**
   * Deletes a custom role (system roles protected; role with assigned users protected)
   */
  static async deleteRole(roleId, actorId) {
    const role = await prisma.role.findUnique({
      where: { id: roleId },
      include: { _count: { select: { users: true } } }
    });

    if (!role) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    if (role.isSystem) {
      throw new AppError('Protected system roles cannot be deleted', 400, 'SYSTEM_ROLE_IMMUTABLE');
    }

    if (role._count.users > 0) {
      throw new AppError(`Cannot delete role '${role.name}' because ${role._count.users} user(s) currently hold this role. Reassign them first.`, 400, 'ROLE_HAS_ASSIGNED_USERS');
    }

    await prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId } });
      await tx.role.delete({ where: { id: roleId } });

      await tx.auditLog.create({
        data: {
          actorId,
          action: 'role.delete',
          entityType: 'Role',
          entityId: roleId,
          metadata: { name: role.name }
        }
      });
    });

    return { id: roleId, deleted: true };
  }

  /**
   * Replaces the permission assignments for a role
   */
  static async updateRolePermissions(roleId, { permissionActions }, actorId) {
    if (!Array.isArray(permissionActions)) {
      throw new AppError('permissionActions must be an array of permission strings', 400, 'INVALID_PERMISSIONS');
    }

    const role = await prisma.role.findUnique({ where: { id: roleId } });
    if (!role) {
      throw new AppError('Role not found', 404, 'ROLE_NOT_FOUND');
    }

    // Safeguard: For SUPER_ADMIN role, ensure core safety permissions are not stripped
    if (role.name === 'SUPER_ADMIN') {
      const mandatorySuperAdminPerms = ['system.settings', 'role.manage', 'admin.manage', 'user.read_list'];
      const missing = mandatorySuperAdminPerms.filter(p => !permissionActions.includes(p));
      if (missing.length > 0) {
        throw new AppError(`Cannot revoke core permissions [${missing.join(', ')}] from SUPER_ADMIN role`, 400, 'CANNOT_STRIP_SUPER_ADMIN_CORE_PERMS');
      }
    }

    const matchedPermissions = await prisma.permission.findMany({
      where: { action: { in: permissionActions } }
    });

    await prisma.$transaction(async (tx) => {
      // Clear existing mappings
      await tx.rolePermission.deleteMany({ where: { roleId } });

      // Create new mappings
      if (matchedPermissions.length > 0) {
        await tx.rolePermission.createMany({
          data: matchedPermissions.map(p => ({
            roleId,
            permissionId: p.id
          }))
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId,
          action: 'role.permissions_updated',
          entityType: 'Role',
          entityId: roleId,
          metadata: {
            roleName: role.name,
            totalPermissions: matchedPermissions.length,
            permissionActions
          }
        }
      });
    });

    return {
      roleId,
      roleName: role.name,
      assignedCount: matchedPermissions.length,
      permissions: matchedPermissions.map(p => p.action)
    };
  }
}
