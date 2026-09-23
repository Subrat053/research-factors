import { apiClient } from './api.client.js';
import fallbackData from '../data/fallbackData.json';

/**
 * Checks if an error is due to network disconnection or unreachable backend.
 */
const isNetworkError = (err) => {
  return (
    !err?.response ||
    err?.code === 'NETWORK_ERROR' ||
    err?.code === 'ERR_NETWORK' ||
    err?.code === 'ECONNREFUSED' ||
    (typeof err?.message === 'string' &&
      (err.message.includes('Network Error') || err.message.includes('connect')))
  );
};

/**
 * Helper to gracefully fall back to local JSON data ONLY when the backend is offline.
 * Live dynamic responses from the backend always take 100% precedence when connected.
 */
async function withFallback(requestFn, fallbackFn) {
  try {
    return await requestFn();
  } catch (err) {
    if (isNetworkError(err)) {
      return {
        success: true,
        data: fallbackFn(),
        _isFallback: true
      };
    }
    throw err;
  }
}

export const commentsApi = {
  getComments: (articleId, params = {}) =>
    withFallback(
      () => apiClient.get(`/articles/${articleId}/comments`, { params }),
      () => fallbackData.comments
    ),

  createComment: (articleId, data) =>
    apiClient.post(`/articles/${articleId}/comments`, data),

  toggleLike: (commentId) =>
    apiClient.post(`/comments/${commentId}/like`),

  reportComment: (commentId, data) =>
    apiClient.post(`/comments/${commentId}/report`, data),

  deleteComment: (commentId) =>
    apiClient.delete(`/comments/${commentId}`)
};
