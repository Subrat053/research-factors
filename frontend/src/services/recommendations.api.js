import { apiClient } from './api.client.js';
import { getVisitorContext } from '../utils/visitor.js';

export const recommendationsApi = {
  /**
   * Tracks a reading or engagement event
   */
  async trackEvent({ eventType, articleId = null, categoryId = null, tagId = null, metadata = null }) {
    const { visitorId, sessionId } = getVisitorContext();
    try {
      return await apiClient.post('/recommendations/events', {
        visitorId,
        sessionId,
        eventType,
        articleId,
        categoryId,
        tagId,
        metadata
      });
    } catch (err) {
      // Non-blocking telemetry
      console.debug('Event tracking silent fallback', err);
      return null;
    }
  },

  /**
   * Saves reader explicit category interests
   */
  async setInterests(categoryIds = []) {
    const { visitorId } = getVisitorContext();
    return apiClient.post('/recommendations/interests', {
      visitorId,
      categoryIds
    });
  },

  /**
   * Fetches current visitor's interest profile
   */
  async getVisitorInterests() {
    const { visitorId } = getVisitorContext();
    return apiClient.get('/recommendations/interests', {
      params: { visitorId }
    });
  },

  /**
   * Removes a specific interest
   */
  async removeInterest(categoryId) {
    const { visitorId } = getVisitorContext();
    return apiClient.delete(`/recommendations/interests/${categoryId}`, {
      params: { visitorId }
    });
  },

  /**
   * Retrieves multi-intent recommendation journeys for an article
   */
  async getArticleRecommendations(articleId) {
    const { visitorId, sessionId } = getVisitorContext();
    return apiClient.get(`/recommendations/article/${articleId}`, {
      params: { visitorId, sessionId }
    });
  },

  /**
   * Retrieves personalized feed for home/browse
   */
  async getPersonalizedFeed(limit = 8) {
    const { visitorId, sessionId } = getVisitorContext();
    return apiClient.get('/recommendations/feed', {
      params: { visitorId, sessionId, limit }
    });
  },

  /**
   * Retrieves public recommendation configuration
   */
  async getConfig() {
    return apiClient.get('/recommendations/config');
  },

  /**
   * Updates recommendation configuration (Admin)
   */
  async updateConfig(config) {
    return apiClient.patch('/recommendations/config', config);
  }
};
