import { apiClient } from './api.client.js';

export const bookmarksApi = {
  toggleBookmark: (articleId) =>
    apiClient.post('/bookmarks/toggle', { articleId }),

  getBookmarks: (params = {}) =>
    apiClient.get('/bookmarks', { params }),

  checkStatus: (articleId) =>
    apiClient.get(`/bookmarks/check/${articleId}`)
};
