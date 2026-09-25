import { apiClient } from './api.client.js';

export const seoApi = {
  /**
   * Resolves final SEO metadata for any public entity
   * @param {Object} params - { type: 'ARTICLE'|'CATEGORY'|'PAGE'|'SITE', id: string }
   */
  resolveSeo: (params) =>
    apiClient.get('/seo/resolve', { params }),

  /**
   * Retrieves operational SEO audit dashboard metrics
   */
  getSeoAudit: () =>
    apiClient.get('/admin/seo/audit'),

  /**
   * Updates custom SEO metadata and robots directives for an entity
   */
  updateSeoMetadata: (entityType, entityId, data) =>
    apiClient.put(`/admin/seo/${entityType}/${entityId}`, data),

  /**
   * Regenerates algorithmic SEO values without overwriting custom overrides
   */
  regenerateSeo: (entityType, entityId) =>
    apiClient.post('/admin/seo/regenerate', { entityType, entityId }),

  /**
   * Triggers batch generation for existing legacy catalog items missing metadata
   */
  migrateMissingSeo: () =>
    apiClient.post('/admin/seo/migrate-missing')
};
