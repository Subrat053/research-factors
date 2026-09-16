import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { UserAdminController } from './user-admin.controller.js';
import { AuthorAdminController } from './author-admin.controller.js';
import { RbacAdminController } from './rbac-admin.controller.js';
import { SettingsAdminController } from './settings-admin.controller.js';
import { TagAdminController } from './tag-admin.controller.js';
import { ReportAdminController } from './report-admin.controller.js';
import { ContactAdminController } from './contact-admin.controller.js';
import { MediaAdminController } from './media-admin.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission, requireSuperAdmin } from '../../middleware/authorize.js';

export const adminRoutes = Router();

// ================= PUBLIC PLATFORM SETTINGS =================
adminRoutes.get('/settings/public', SettingsAdminController.getPublicSettings);

// All routes below require authentication
adminRoutes.use(authenticate);

// ================= DASHBOARD & OVERVIEW =================
adminRoutes.get(
  '/stats',
  requirePermission('article.approve'),
  AdminController.getStats
);

// ================= ARTICLES MANAGEMENT =================
adminRoutes.post(
  '/articles/:id/submit',
  requirePermission('article.submit'),
  AdminController.submitArticle
);

adminRoutes.get(
  '/articles',
  requirePermission('article.approve'),
  AdminController.listAllArticles
);

adminRoutes.get(
  '/articles/review-queue',
  requirePermission('article.approve'),
  AdminController.getReviewQueue
);

adminRoutes.post(
  '/articles/:id/review',
  requirePermission('article.approve'),
  AdminController.reviewArticle
);

adminRoutes.post(
  '/articles/:id/schedule',
  requirePermission('article.schedule'),
  AdminController.scheduleArticle
);

adminRoutes.post(
  '/articles/:id/archive',
  requirePermission('article.publish'),
  AdminController.archiveArticle
);

adminRoutes.delete(
  '/articles/:id',
  requirePermission('article.delete_any'),
  AdminController.forceDeleteArticle
);

// ================= USERS MANAGEMENT =================
adminRoutes.get(
  '/users',
  requirePermission('user.read_list'),
  UserAdminController.getUsers
);

adminRoutes.get(
  '/users/:id',
  requirePermission('user.read_list'),
  UserAdminController.getUserDetails
);

adminRoutes.patch(
  '/users/:id/status',
  requirePermission('user.suspend'),
  UserAdminController.updateUserStatus
);

adminRoutes.patch(
  '/users/:id/role',
  requirePermission('role.assign'),
  UserAdminController.assignUserRoles
);

// ================= AUTHORS MANAGEMENT =================
adminRoutes.get(
  '/authors',
  requirePermission('user.read_list'),
  AuthorAdminController.listAuthors
);

adminRoutes.get(
  '/authors/applications',
  requirePermission('author.approve'),
  AuthorAdminController.listPendingApplications
);

adminRoutes.post(
  '/authors/:id/approve',
  requirePermission('author.approve'),
  AuthorAdminController.approveApplication
);

adminRoutes.post(
  '/authors/:id/reject',
  requirePermission('author.approve'),
  AuthorAdminController.rejectApplication
);

adminRoutes.patch(
  '/authors/:id',
  requirePermission('author.approve'),
  AuthorAdminController.updateAuthorProfile
);

// ================= ROLES & PERMISSIONS (SUPER ADMIN EXCLUSIVE) =================
adminRoutes.get(
  '/roles',
  requireSuperAdmin,
  RbacAdminController.listRoles
);

adminRoutes.post(
  '/roles',
  requireSuperAdmin,
  RbacAdminController.createRole
);

adminRoutes.put(
  '/roles/:id',
  requireSuperAdmin,
  RbacAdminController.updateRole
);

adminRoutes.delete(
  '/roles/:id',
  requireSuperAdmin,
  RbacAdminController.deleteRole
);

adminRoutes.put(
  '/roles/:id/permissions',
  requireSuperAdmin,
  RbacAdminController.updateRolePermissions
);

adminRoutes.get(
  '/permissions',
  requireSuperAdmin,
  RbacAdminController.listPermissions
);

// ================= TAGS MANAGEMENT & MERGE =================
adminRoutes.get(
  '/tags',
  requirePermission('tag.manage'),
  TagAdminController.listTags
);

adminRoutes.post(
  '/tags',
  requirePermission('tag.manage'),
  TagAdminController.createTag
);

adminRoutes.put(
  '/tags/:id',
  requirePermission('tag.manage'),
  TagAdminController.updateTag
);

adminRoutes.delete(
  '/tags/:id',
  requirePermission('tag.manage'),
  TagAdminController.deleteTag
);

adminRoutes.post(
  '/tags/merge',
  requirePermission('tag.manage'),
  TagAdminController.mergeTags
);

// ================= COMMENTS & REPORTS MODERATION =================
adminRoutes.get(
  '/comments/moderation-queue',
  requirePermission('comment.moderate'),
  AdminController.getModerationQueue
);

adminRoutes.post(
  '/comments/:id/moderate',
  requirePermission('comment.moderate'),
  AdminController.moderateComment
);

adminRoutes.get(
  '/reports',
  requirePermission('comment.moderate'),
  ReportAdminController.listReports
);

adminRoutes.post(
  '/reports/:id/resolve',
  requirePermission('comment.moderate'),
  ReportAdminController.resolveReport
);

// ================= CONTACT INQUIRIES =================
adminRoutes.get(
  '/contact-messages',
  requirePermission('contact.manage'),
  ContactAdminController.listMessages
);

adminRoutes.patch(
  '/contact-messages/:id',
  requirePermission('contact.manage'),
  ContactAdminController.updateMessage
);

adminRoutes.delete(
  '/contact-messages/:id',
  requirePermission('contact.manage'),
  ContactAdminController.deleteMessage
);

// ================= MEDIA ASSETS MANAGEMENT =================
adminRoutes.get(
  '/media',
  requirePermission('media.manage'),
  MediaAdminController.listMedia
);

adminRoutes.delete(
  '/media/:id',
  requirePermission('media.delete_any'),
  MediaAdminController.deleteMedia
);

// ================= AUDIT LOGS =================
adminRoutes.get(
  '/audit-logs',
  requirePermission('audit.read'),
  AdminController.getAuditLogs
);

// ================= SYSTEM CONFIGURATION & HEALTH (SUPER ADMIN EXCLUSIVE) =================
adminRoutes.get(
  '/settings',
  requireSuperAdmin,
  SettingsAdminController.getAllSettings
);

adminRoutes.put(
  '/settings',
  requireSuperAdmin,
  SettingsAdminController.updateSettings
);

adminRoutes.post(
  '/settings/test-email',
  requireSuperAdmin,
  SettingsAdminController.testEmail
);

adminRoutes.get(
  '/settings/system-health',
  requireSuperAdmin,
  SettingsAdminController.getSystemHealth
);
