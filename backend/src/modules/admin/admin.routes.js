import { Router } from 'express';
import { AdminController } from './admin.controller.js';
import { UserAdminController } from './user-admin.controller.js';
import { AuthorAdminController } from './author-admin.controller.js';
import { RbacAdminController } from './rbac-admin.controller.js';
import { SettingsAdminController } from './settings-admin.controller.js';
import { TagAdminController } from './tag-admin.controller.js';
import { ReportAdminController } from './report-admin.controller.js';
import { CommentAdminController } from './comment-admin.controller.js';
import { ContactAdminController } from './contact-admin.controller.js';
import { MediaAdminController } from './media-admin.controller.js';
import { SeoController } from '../seo/seo.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requirePermission, requireAnyPermission, requireSuperAdmin } from '../../middleware/authorize.js';
import { validateRequest } from '../../middleware/validate.js';
import { createAdminUserSchema, toggleRegistrationSchema } from './user-admin.validator.js';

export const adminRoutes = Router();

// ================= PUBLIC PLATFORM SETTINGS =================
adminRoutes.get('/settings/public', SettingsAdminController.getPublicSettings);

// All routes below require authentication
adminRoutes.use(authenticate);

// ================= DASHBOARD & OVERVIEW =================
adminRoutes.get(
  '/stats',
  requireAnyPermission(
    'article.create',
    'article.update_own',
    'article.approve',
    'comment.moderate',
    'user.read_list',
    'author.approve',
    'category.manage',
    'tag.manage',
    'media.manage',
    'contact.manage',
    'audit.read',
    'role.manage',
    'setting.manage'
  ),
  AdminController.getStats
);

// ================= ARTICLES MANAGEMENT =================
adminRoutes.post(
  '/articles/bulk-status',
  requirePermission('article.publish'),
  AdminController.bulkUpdateArticleStatus
);

adminRoutes.post(
  '/articles/bulk-delete',
  requirePermission('article.delete_any'),
  AdminController.bulkDeleteArticles
);

adminRoutes.post(
  '/articles/:id/submit',
  requirePermission('article.submit'),
  AdminController.submitArticle
);

adminRoutes.get(
  '/articles',
  requireAnyPermission(
    'article.approve',
    'article.update_any',
    'article.create',
    'article.update_own'
  ),
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

adminRoutes.post(
  '/articles/:id/publish',
  requirePermission('article.publish'),
  AdminController.publishArticle
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

adminRoutes.patch(
  '/users/bulk-status',
  requirePermission('user.suspend'),
  UserAdminController.bulkUpdateUserStatus
);

adminRoutes.post(
  '/users',
  requirePermission('user.create'),
  validateRequest(createAdminUserSchema),
  UserAdminController.createUser
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
  '/comments',
  requirePermission('comment.moderate'),
  CommentAdminController.listComments
);

adminRoutes.get(
  '/comments/moderation-queue',
  requirePermission('comment.moderate'),
  AdminController.getModerationQueue
);

adminRoutes.get(
  '/comments/:id/reports',
  requirePermission('comment.moderate'),
  CommentAdminController.getCommentReports
);

adminRoutes.post(
  '/comments/:id/moderate',
  requirePermission('comment.moderate'),
  CommentAdminController.moderateComment
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
  requireAnyPermission('contact.manage', 'setting.manage'),
  ContactAdminController.listMessages
);

adminRoutes.patch(
  '/contact-messages/bulk',
  requireAnyPermission('contact.manage', 'setting.manage'),
  ContactAdminController.bulkUpdateMessages
);

adminRoutes.post(
  '/contact-messages/bulk-delete',
  requireAnyPermission('contact.manage', 'setting.manage'),
  ContactAdminController.bulkDeleteMessages
);

adminRoutes.patch(
  '/contact-messages/:id',
  requireAnyPermission('contact.manage', 'setting.manage'),
  ContactAdminController.updateMessage
);

adminRoutes.delete(
  '/contact-messages/:id',
  requireAnyPermission('contact.manage', 'setting.manage'),
  ContactAdminController.deleteMessage
);

// ================= MEDIA ASSETS MANAGEMENT =================
adminRoutes.get(
  '/media',
  requirePermission('media.manage'),
  MediaAdminController.listMedia
);

adminRoutes.get(
  '/media/:id/usages',
  requirePermission('media.manage'),
  MediaAdminController.getMediaUsages
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

// ================= REGISTRATION GOVERNANCE =================
adminRoutes.get(
  '/settings/registration-status',
  requireAnyPermission('user.read_list', 'user.create', 'setting.manage'),
  SettingsAdminController.getRegistrationStatus
);

adminRoutes.patch(
  '/settings/registration-status',
  requireAnyPermission('setting.manage', 'user.create'),
  validateRequest(toggleRegistrationSchema),
  SettingsAdminController.updateRegistrationStatus
);

// ================= SYSTEM CONFIGURATION & HEALTH =================
adminRoutes.get(
  '/settings',
  requireAnyPermission('system.settings', 'setting.manage'),
  SettingsAdminController.getAllSettings
);

adminRoutes.put(
  '/settings',
  requireAnyPermission('system.settings', 'setting.manage'),
  SettingsAdminController.updateSettings
);

adminRoutes.post(
  '/settings/test-email',
  requireAnyPermission('system.settings', 'setting.manage'),
  SettingsAdminController.testEmail
);

adminRoutes.get(
  '/settings/system-health',
  requireSuperAdmin,
  SettingsAdminController.getSystemHealth
);

// ================= SEARCH ENGINE OPTIMIZATION (SEO) GOVERNANCE =================
adminRoutes.get(
  '/seo/audit',
  requireAnyPermission('setting.manage', 'article.approve', 'article.create'),
  SeoController.getSeoAudit
);

adminRoutes.post(
  '/seo/regenerate',
  requireAnyPermission('setting.manage', 'article.create', 'article.update_own'),
  SeoController.regenerateSeo
);

adminRoutes.post(
  '/seo/migrate-missing',
  requireAnyPermission('setting.manage'),
  SeoController.migrateMissingSeo
);

adminRoutes.put(
  '/seo/:entityType/:entityId',
  requireAnyPermission('setting.manage', 'article.create', 'article.update_own'),
  SeoController.updateSeoMetadata
);


