import { apiClient } from './api.client.js';

export const commentsApi = {
  getComments: (articleId, params = {}) =>
    apiClient.get(`/articles/${articleId}/comments`, { params }),

  createComment: (articleId, data) =>
    apiClient.post(`/articles/${articleId}/comments`, data),

  toggleLike: (commentId) =>
    apiClient.post(`/comments/${commentId}/like`),

  reportComment: (commentId, data) =>
    apiClient.post(`/comments/${commentId}/report`, data),

  deleteComment: (commentId) =>
    apiClient.delete(`/comments/${commentId}`)
};
