import { apiClient } from './api.client.js';
import { getVisitorContext } from '../utils/visitor.js';
import fallbackData from '../data/fallbackData.json';

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
   * Sets or toggles explicit article feedback (LIKE / DISLIKE / NONE)
   */
  async setArticleFeedback({ articleId, feedbackType }) {
    const { visitorId, sessionId } = getVisitorContext();
    try {
      return await apiClient.post('/recommendations/feedback', {
        visitorId,
        sessionId,
        articleId,
        feedbackType
      });
    } catch (err) {
      if (isNetworkError(err)) {
        return { success: true, data: { feedbackType }, _isFallback: true };
      }
      throw err;
    }
  },

  /**
   * Retrieves active feedback state for an article
   */
  async getArticleFeedback(articleId) {
    const { visitorId } = getVisitorContext();
    try {
      return await apiClient.get(`/recommendations/feedback/${articleId}`, {
        params: { visitorId }
      });
    } catch (err) {
      if (isNetworkError(err)) {
        return { success: true, data: { feedbackType: 'NONE' }, _isFallback: true };
      }
      throw err;
    }
  },

  /**
   * Removes explicit feedback for an article
   */
  async removeArticleFeedback(articleId) {
    const { visitorId, sessionId } = getVisitorContext();
    try {
      return await apiClient.delete(`/recommendations/feedback/${articleId}`, {
        params: { visitorId, sessionId }
      });
    } catch (err) {
      if (isNetworkError(err)) {
        return { success: true, data: { feedbackType: 'NONE' }, _isFallback: true };
      }
      throw err;
    }
  },

  /**
   * Synchronizes anonymous visitor data to an authenticated user
   */
  async syncVisitor() {
    const { visitorId } = getVisitorContext();
    try {
      return await apiClient.post('/recommendations/sync-visitor', { visitorId });
    } catch (err) {
      console.debug('Visitor sync fallback', err);
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
    try {
      return await apiClient.get('/recommendations/interests', {
        params: { visitorId }
      });
    } catch (err) {
      if (isNetworkError(err)) {
        return { success: true, data: [], _isFallback: true };
      }
      throw err;
    }
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
    try {
      return await apiClient.get(`/recommendations/article/${articleId}`, {
        params: { visitorId, sessionId }
      });
    } catch (err) {
      if (isNetworkError(err)) {
        const otherArticles = (fallbackData?.articles || []).filter((a) => a.id !== articleId);
        const recs = otherArticles.slice(0, 4).map((art) => ({
          article: art,
          matchPercentage: 86,
          reason: `Featured research in ${art.category?.name || 'Research Factors'}`,
          intent: 'RECOMMENDED'
        }));
        return {
          success: true,
          data: {
            recommendations: recs,
            completeYourResearch: { items: recs.slice(0, 2) },
            deepTopicDive: { items: recs.slice(2, 4) }
          },
          _isFallback: true
        };
      }
      throw err;
    }
  },

  /**
   * Retrieves personalized feed for home/browse
   */
  async getPersonalizedFeed(limit = 8) {
    const { visitorId, sessionId } = getVisitorContext();
    try {
      return await apiClient.get('/recommendations/feed', {
        params: { visitorId, sessionId, limit }
      });
    } catch (err) {
      if (isNetworkError(err)) {
        const recs = (fallbackData?.articles || []).slice(0, limit).map((art) => ({
          article: art,
          matchPercentage: 88,
          reason: `Popular in ${art.category?.name || 'Research Factors'}`,
          intent: 'RECOMMENDED'
        }));
        return {
          success: true,
          data: {
            topInterests: [],
            recommendations: recs
          },
          _isFallback: true
        };
      }
      throw err;
    }
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
