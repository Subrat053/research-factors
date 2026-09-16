import { apiClient } from './api.client.js';

export const articlesApi = {
  getArticles: (params = {}) => apiClient.get('/articles', { params }),
  getFeaturedArticle: () => apiClient.get('/articles/featured'),
  getTrending: () => apiClient.get('/articles/trending'),
  getArticleBySlug: (slug) => apiClient.get(`/articles/${slug}`),
  getCategories: () => apiClient.get('/categories'),
  getCategoryBySlug: (slug) => apiClient.get(`/categories/${slug}`),
  search: (q) => apiClient.get('/search', { params: { q } }),

  // Author endpoints
  getMyArticles: () => apiClient.get('/articles/author/me'),
  getDraft: (id) => apiClient.get(`/articles/${id}/draft`),
  createDraft: (data) => apiClient.post('/articles', data),
  updateDraft: (id, data) => apiClient.patch(`/articles/${id}/draft`, data),
  submitForReview: (id) => apiClient.post(`/articles/${id}/submit`),

  // Editorial endpoints
  approveArticle: (id) => apiClient.post(`/articles/${id}/approve`),
  rejectArticle: (id, reason) => apiClient.post(`/articles/${id}/reject`, { reason }),
  publishArticle: (id) => apiClient.post(`/articles/${id}/publish`)
};
