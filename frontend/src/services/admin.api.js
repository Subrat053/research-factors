import { apiClient } from './api.client.js';

export const adminApi = {
  // Dashboard Metrics
  getStats: () =>
    apiClient.get('/admin/stats'),

  // Articles & Editorial
  listArticles: (params = {}) =>
    apiClient.get('/admin/articles', { params }),

  getReviewQueue: (params = {}) =>
    apiClient.get('/admin/articles/review-queue', { params }),

  reviewArticle: (id, data) =>
    apiClient.post(`/admin/articles/${id}/review`, data),

  scheduleArticle: (id, data) =>
    apiClient.post(`/admin/articles/${id}/schedule`, data),

  publishArticle: (id) =>
    apiClient.post(`/admin/articles/${id}/publish`),

  archiveArticle: (id) =>
    apiClient.post(`/admin/articles/${id}/archive`),

  forceDeleteArticle: (id) =>
    apiClient.delete(`/admin/articles/${id}`),

  bulkUpdateArticleStatus: (data) =>
    apiClient.post('/admin/articles/bulk-status', data),

  bulkDeleteArticles: (data) =>
    apiClient.post('/admin/articles/bulk-delete', data),

  // Users Directory & Status
  getUsers: (params = {}) =>
    apiClient.get('/admin/users', { params }),

  getUserDetails: (id) =>
    apiClient.get(`/admin/users/${id}`),

  updateUserStatus: (id, data) =>
    apiClient.patch(`/admin/users/${id}/status`, data),

  bulkUpdateUserStatus: (data) =>
    apiClient.patch('/admin/users/bulk-status', data),

  assignUserRoles: (id, data) =>
    apiClient.patch(`/admin/users/${id}/role`, data),

  createUser: (data) =>
    apiClient.post('/admin/users', data),

  getRegistrationStatus: () =>
    apiClient.get('/admin/settings/registration-status'),

  updateRegistrationStatus: (data) =>
    apiClient.patch('/admin/settings/registration-status', data),

  // Authors & Applications
  listAuthors: (params = {}) =>
    apiClient.get('/admin/authors', { params }),

  listAuthorApplications: (params = {}) =>
    apiClient.get('/admin/authors/applications', { params }),

  approveAuthorApplication: (id) =>
    apiClient.post(`/admin/authors/${id}/approve`),

  rejectAuthorApplication: (id, data) =>
    apiClient.post(`/admin/authors/${id}/reject`, data),

  updateAuthorProfile: (id, data) =>
    apiClient.patch(`/admin/authors/${id}`, data),

  // Roles & Permissions (Super Admin)
  listRoles: () =>
    apiClient.get('/admin/roles'),

  createRole: (data) =>
    apiClient.post('/admin/roles', data),

  updateRole: (id, data) =>
    apiClient.put(`/admin/roles/${id}`, data),

  deleteRole: (id) =>
    apiClient.delete(`/admin/roles/${id}`),

  listPermissions: () =>
    apiClient.get('/admin/permissions'),

  updateRolePermissions: (id, data) =>
    apiClient.put(`/admin/roles/${id}/permissions`, data),

  // Taxonomy & Tags
  listTags: (params = {}) =>
    apiClient.get('/admin/tags', { params }),

  createTag: (data) =>
    apiClient.post('/admin/tags', data),

  updateTag: (id, data) =>
    apiClient.put(`/admin/tags/${id}`, data),

  deleteTag: (id) =>
    apiClient.delete(`/admin/tags/${id}`),

  mergeTags: (data) =>
    apiClient.post('/admin/tags/merge', data),

  // Categories
  getAllCategories: () =>
    apiClient.get('/categories/all'),

  createCategory: (data) =>
    apiClient.post('/categories', data),

  mergeCategories: (data) =>
    apiClient.post('/categories/merge', data),

  updateCategory: (id, data) =>
    apiClient.put(`/categories/${id}`, data),

  deleteCategory: (id) =>
    apiClient.delete(`/categories/${id}`),

  // Moderation & Reports
  listComments: (params = {}) =>
    apiClient.get('/admin/comments', { params }),

  getCommentReports: (id) =>
    apiClient.get(`/admin/comments/${id}/reports`),

  getModerationQueue: (params = {}) =>
    apiClient.get('/admin/comments/moderation-queue', { params }),

  moderateComment: (id, data) =>
    apiClient.post(`/admin/comments/${id}/moderate`, data),

  listReports: (params = {}) =>
    apiClient.get('/admin/reports', { params }),

  resolveReport: (id, data) =>
    apiClient.post(`/admin/reports/${id}/resolve`, data),

  // Contact Inquiries
  listContactMessages: (params = {}) =>
    apiClient.get('/admin/contact-messages', { params }),

  updateContactMessage: (id, data) =>
    apiClient.patch(`/admin/contact-messages/${id}`, data),

  deleteContactMessage: (id) =>
    apiClient.delete(`/admin/contact-messages/${id}`),

  bulkUpdateContactMessages: (data) =>
    apiClient.patch('/admin/contact-messages/bulk', data),

  bulkDeleteContactMessages: (data) =>
    apiClient.post('/admin/contact-messages/bulk-delete', data),

  // Media Management
  listMedia: (params = {}) =>
    apiClient.get('/admin/media', { params }),

  getMediaUsages: (id) =>
    apiClient.get(`/admin/media/${id}/usages`),

  deleteMediaAsset: (id) =>
    apiClient.delete(`/admin/media/${id}`),

  // Audit Logs
  getAuditLogs: (params = {}) =>
    apiClient.get('/admin/audit-logs', { params }),

  // System Settings & Health (Super Admin)
  getSettings: () =>
    apiClient.get('/admin/settings'),

  updateSettings: (data) =>
    apiClient.put('/admin/settings', data),

  testEmail: (data) =>
    apiClient.post('/admin/settings/test-email', data),

  getSystemHealth: () =>
    apiClient.get('/admin/settings/system-health')
};
