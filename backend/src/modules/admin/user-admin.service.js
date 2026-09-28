import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { prisma } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { emailService } from '../../email/EmailService.js';
import { UserDTO } from '../users/user.dto.js';
import { AuditEnricherService } from './audit-enricher.service.js';

export class UserAdminService {
  /**
   * Retrieves paginated user directory with role and status filtering
   */
  static async getUsers({ search = '', role = '', status = '', page = 1, limit = 20, sort = 'createdAt_desc' }) {
    const skip = (Math.max(1, parseInt(page, 10)) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const where = {};

    if (status && ['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
      where.status = status;
    }

    if (role) {
      where.roles = {
        some: {
          role: {
            name: role.toUpperCase()
          }
        }
      };
    }

    if (search && search.trim().length > 0) {
      const q = search.trim();
      where.OR = [
        { email: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } }
      ];
    }

    const orderBy = [];
    if (sort === 'createdAt_asc') {
      orderBy.push({ createdAt: 'asc' });
    } else if (sort === 'name_asc') {
      orderBy.push({ firstName: 'asc' });
    } else {
      orderBy.push({ createdAt: 'desc' });
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: {
          roles: { include: { role: true } },
          authorProfile: true,
          _count: {
            select: {
              articles: true,
              comments: true,
              bookmarks: true,
              commentReports: true
            }
          }
        },
        orderBy,
        skip,
        take
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(u => UserDTO.toAdmin(u)),
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Retrieves deep detail for a single user, including recent activity
   */
  static async getUserDetails(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        roles: { include: { role: true } },
        authorProfile: true,
        _count: {
          select: {
            articles: true,
            comments: true,
            bookmarks: true,
            commentReports: true
          }
        }
      }
    });

    if (!user) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // Fetch recent 5 articles and recent 5 comments
    const [recentArticles, recentComments, auditLogs] = await Promise.all([
      prisma.article.findMany({
        where: { authorId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, slug: true, status: true, viewCount: true, createdAt: true }
      }),
      prisma.comment.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { article: { select: { id: true, title: true, slug: true } } }
      }),
      prisma.auditLog.findMany({
        where: { entityType: 'User', entityId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { actor: { select: { firstName: true, lastName: true, email: true } } }
      })
    ]);

    const enrichedAuditHistory = await AuditEnricherService.enrichLogs(auditLogs);

    return {
      user: UserDTO.toAdmin(user),
      recentArticles,
      recentComments: recentComments.map(c => ({
        id: c.id,
        content: c.content.slice(0, 140),
        status: c.status,
        article: c.article,
        createdAt: c.createdAt
      })),
      auditHistory: enrichedAuditHistory
    };
  }

  /**
   * Updates user status (ACTIVE, SUSPENDED, DEACTIVATED) with anti-escalation safeguards
   */
  static async updateUserStatus(targetUserId, { status, reason = null }, actorUser) {
    if (!['ACTIVE', 'SUSPENDED', 'DEACTIVATED'].includes(status)) {
      throw new AppError('Invalid status. Allowed: ACTIVE, SUSPENDED, DEACTIVATED', 400, 'INVALID_STATUS');
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { roles: { include: { role: true } } }
    });

    if (!targetUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const targetRoleNames = targetUser.roles.map(r => r.role.name);
    const isTargetSuperAdmin = targetRoleNames.includes('SUPER_ADMIN');

    // 1. Anti-escalation check: Only Super Admin can modify a Super Admin
    if (isTargetSuperAdmin && !actorUser.isSuperAdmin) {
      throw new AppError('Access denied: Standard administrators cannot modify a Super Administrator account', 403, 'FORBIDDEN_MUTATE_SUPER_ADMIN');
    }

    // 2. Anti-lockout check: Cannot suspend or deactivate the last active Super Admin
    if (isTargetSuperAdmin && status !== 'ACTIVE') {
      const activeSuperAdmins = await prisma.user.count({
        where: {
          id: { not: targetUserId },
          status: 'ACTIVE',
          roles: {
            some: {
              role: { name: 'SUPER_ADMIN' }
            }
          }
        }
      });

      if (activeSuperAdmins === 0) {
        throw new AppError('Cannot suspend or deactivate the sole remaining Super Administrator on the platform', 400, 'LAST_SUPER_ADMIN_IMMUTABLE');
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id: targetUserId },
        data: { status },
        include: {
          roles: { include: { role: true } },
          authorProfile: true,
          _count: {
            select: { articles: true, comments: true, bookmarks: true, commentReports: true }
          }
        }
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actorUser.id,
          action: `user.${status.toLowerCase()}`,
          entityType: 'User',
          entityId: targetUserId,
          metadata: {
            previousStatus: targetUser.status,
            newStatus: status,
            reason: reason || 'Administrative status change'
          }
        }
      });

      // If suspended, notify the user
      if (status === 'SUSPENDED') {
        await tx.notification.create({
          data: {
            userId: targetUserId,
            type: 'ACCOUNT_SUSPENDED',
            title: 'Account Suspended',
            message: reason ? `Your account has been suspended: ${reason}` : 'Your account has been suspended by administration.'
          }
        });
      }

      return u;
    });

    return UserDTO.toAdmin(updated);
  }

  /**
   * Bulk updates user status with safeguards (excludes self, prevents non-super-admin modifying super admin)
   */
  static async bulkUpdateUserStatus(userIds, { status, reason = null }, actorUser) {
    if (!Array.isArray(userIds) || userIds.length === 0) {
      throw new AppError('userIds array is required and must not be empty', 400, 'INVALID_USER_IDS');
    }

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      throw new AppError('Invalid status. Allowed: ACTIVE, SUSPENDED', 400, 'INVALID_STATUS');
    }

    // Filter out actorUser.id to prevent accidental self-suspension
    const eligibleIds = userIds.filter(id => id !== actorUser.id);
    const skippedSelf = userIds.length > eligibleIds.length;

    if (eligibleIds.length === 0) {
      return { updatedCount: 0, skippedSelf: true, message: 'No eligible users to update (cannot change your own status)' };
    }

    // Retrieve target users to check Super Admin constraints
    const targetUsers = await prisma.user.findMany({
      where: { id: { in: eligibleIds } },
      include: { roles: { include: { role: true } } }
    });

    const isActorSuperAdmin = Boolean(actorUser.isSuperAdmin);

    // If actor is not Super Admin, prevent modifying any Super Admin
    const safeTargetIds = targetUsers
      .filter(u => {
        const isTargetSuperAdmin = u.roles.some(r => r.role.name === 'SUPER_ADMIN');
        return isActorSuperAdmin || !isTargetSuperAdmin;
      })
      .map(u => u.id);

    if (safeTargetIds.length === 0) {
      return { updatedCount: 0, skippedSelf, message: 'No authorized users to update' };
    }

    await prisma.$transaction(async (tx) => {
      await tx.user.updateMany({
        where: { id: { in: safeTargetIds } },
        data: { status }
      });

      await tx.auditLog.create({
        data: {
          actorId: actorUser.id,
          action: `user.bulk_${status.toLowerCase()}`,
          entityType: 'User',
          entityId: 'bulk',
          metadata: {
            targetCount: safeTargetIds.length,
            targetIds: safeTargetIds,
            newStatus: status,
            reason: reason || 'Administrative bulk status change'
          }
        }
      });

      if (status === 'SUSPENDED') {
        const notificationsData = safeTargetIds.map(userId => ({
          userId,
          type: 'ACCOUNT_SUSPENDED',
          title: 'Account Suspended',
          message: reason ? `Your account has been suspended: ${reason}` : 'Your account has been suspended by administration.'
        }));
        await tx.notification.createMany({ data: notificationsData });
      }
    });

    return {
      updatedCount: safeTargetIds.length,
      skippedSelf,
      message: `Successfully updated ${safeTargetIds.length} user(s) to ${status}`
    };
  }

  /**
   * Reassigns roles to a user with anti-escalation and anti-lockout safeguards
   */
  static async assignUserRoles(targetUserId, { roleNames }, actorUser) {
    if (!Array.isArray(roleNames) || roleNames.length === 0) {
      throw new AppError('At least one valid role name must be provided', 400, 'INVALID_ROLES');
    }

    const normalizedRoleNames = roleNames.map(r => r.toUpperCase());

    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { roles: { include: { role: true } } }
    });

    if (!targetUser) {
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    const currentRoleNames = targetUser.roles.map(r => r.role.name);
    const wasSuperAdmin = currentRoleNames.includes('SUPER_ADMIN');
    const willBeSuperAdmin = normalizedRoleNames.includes('SUPER_ADMIN');
    const wasAdmin = currentRoleNames.includes('ADMIN');
    const willBeAdmin = normalizedRoleNames.includes('ADMIN');

    // 1. Anti-escalation check: Only Super Admin can assign or revoke ADMIN / SUPER_ADMIN
    const touchedAdminTiers = wasSuperAdmin || willBeSuperAdmin || wasAdmin || willBeAdmin;
    if (touchedAdminTiers && !actorUser.isSuperAdmin) {
      throw new AppError('Access denied: Only Super Administrators can grant or revoke administrative roles', 403, 'FORBIDDEN_ELEVATE_ADMIN');
    }

    // 2. Anti-lockout check: Cannot remove SUPER_ADMIN from the last active Super Admin
    if (wasSuperAdmin && !willBeSuperAdmin) {
      const activeSuperAdmins = await prisma.user.count({
        where: {
          id: { not: targetUserId },
          status: 'ACTIVE',
          roles: {
            some: {
              role: { name: 'SUPER_ADMIN' }
            }
          }
        }
      });

      if (activeSuperAdmins === 0) {
        throw new AppError('Cannot demote the sole remaining Super Administrator on the platform', 400, 'LAST_SUPER_ADMIN_IMMUTABLE');
      }
    }

    // Fetch all requested roles from database
    const rolesInDb = await prisma.role.findMany({
      where: { name: { in: normalizedRoleNames } }
    });

    if (rolesInDb.length !== normalizedRoleNames.length) {
      throw new AppError('One or more specified role names do not exist in the catalog', 400, 'ROLE_NOT_FOUND');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Remove current role mappings
      await tx.userRole.deleteMany({
        where: { userId: targetUserId }
      });

      // Insert new role mappings
      await tx.userRole.createMany({
        data: rolesInDb.map(r => ({
          userId: targetUserId,
          roleId: r.id
        }))
      });

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actorUser.id,
          action: 'user.role_change',
          entityType: 'User',
          entityId: targetUserId,
          metadata: {
            previousRoles: currentRoleNames,
            newRoles: normalizedRoleNames
          }
        }
      });

      return tx.user.findUnique({
        where: { id: targetUserId },
        include: {
          roles: { include: { role: true } },
          authorProfile: true,
          _count: {
            select: { articles: true, comments: true, bookmarks: true, commentReports: true }
          }
        }
      });
    });

    return UserDTO.toAdmin(updated);
  }

  /**
   * Administratively creates a new user account with initial role assignment
   */
  static async createUser({ firstName, lastName, email, password, bio = null, roleNames, emailVerified = true }, actorUser) {
    if (!Array.isArray(roleNames) || roleNames.length === 0) {
      throw new AppError('At least one valid role name must be provided', 400, 'INVALID_ROLES');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existing) {
      throw new AppError('An account with this email address already exists', 409, 'EMAIL_ALREADY_EXISTS');
    }

    const normalizedRoleNames = roleNames.map(r => r.toUpperCase());

    // Anti-escalation check: Only Super Admin can assign ADMIN or SUPER_ADMIN
    const includesElevatedRoles = normalizedRoleNames.some(r => ['SUPER_ADMIN', 'ADMIN'].includes(r));
    if (includesElevatedRoles && !actorUser.isSuperAdmin) {
      throw new AppError('Access denied: Standard administrators cannot grant Administrator or Super Administrator roles', 403, 'FORBIDDEN_ELEVATED_ROLE_ASSIGNMENT');
    }

    const rolesInDb = await prisma.role.findMany({
      where: { name: { in: normalizedRoleNames } }
    });

    if (rolesInDb.length !== normalizedRoleNames.length) {
      throw new AppError('One or more specified role names do not exist in the catalog', 400, 'ROLE_NOT_FOUND');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Only Super Admin can pre-verify accounts; other staff with user.create cannot pre-verify
    const isVerified = actorUser.isSuperAdmin ? !!emailVerified : false;
    const emailVerifyToken = isVerified ? null : crypto.randomBytes(32).toString('hex');

    const newUser = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          bio: bio ? bio.trim() : null,
          status: 'ACTIVE',
          isEmailVerified: isVerified,
          emailVerifyToken
        }
      });

      // Assign roles
      await tx.userRole.createMany({
        data: rolesInDb.map(r => ({
          userId: created.id,
          roleId: r.id
        }))
      });

      // If user has AUTHOR role, automatically create approved author profile
      if (normalizedRoleNames.includes('AUTHOR')) {
        await tx.authorProfile.create({
          data: {
            userId: created.id,
            headline: bio ? bio.slice(0, 160) : '',
            biography: bio ? bio.trim() : '',
            isApproved: true
          }
        });
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actorId: actorUser.id,
          action: 'user.admin_created',
          entityType: 'User',
          entityId: created.id,
          metadata: {
            email: normalizedEmail,
            assignedRoles: normalizedRoleNames,
            isEmailVerified: isVerified,
            preVerifiedBySuperAdmin: actorUser.isSuperAdmin && isVerified
          }
        }
      });

      return tx.user.findUnique({
        where: { id: created.id },
        include: {
          roles: { include: { role: true } },
          authorProfile: true,
          _count: {
            select: { articles: true, comments: true, bookmarks: true, commentReports: true }
          }
        }
      });
    });

    // Send verification email if not pre-verified
    if (!isVerified && emailVerifyToken) {
      emailService.sendVerificationEmail(normalizedEmail, emailVerifyToken, firstName).catch(() => {});
    }

    return UserDTO.toAdmin(newUser);
  }
}
