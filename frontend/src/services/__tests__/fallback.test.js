import { describe, it, expect, vi, beforeEach } from 'vitest';
import fallbackData from '../../data/fallbackData.json';
import { articlesApi } from '../articles.api.js';
import { commentsApi } from '../comments.api.js';
import { apiClient } from '../api.client.js';

describe('Offline Fallback Data & Even-Count Verification', () => {
  it('should verify all collections in fallbackData.json have strictly even lengths', () => {
    expect(fallbackData.categories.length % 2).toBe(0);
    expect(fallbackData.articles.length % 2).toBe(0);
    expect(fallbackData.trendingArticles.length % 2).toBe(0);
    expect(fallbackData.comments.length % 2).toBe(0);
    expect(fallbackData.testimonials.length % 2).toBe(0);
    expect(Object.keys(fallbackData.siteStats).length % 2).toBe(0);
  });

  it('should contain expected counts: 6 categories, 18 articles, 6 trending, 4 comments, 4 testimonials, 4 stats', () => {
    expect(fallbackData.categories.length).toBe(6);
    expect(fallbackData.articles.length).toBe(18);
    expect(fallbackData.trendingArticles.length).toBe(6);
    expect(fallbackData.comments.length).toBe(4);
    expect(fallbackData.testimonials.length).toBe(4);
    expect(Object.keys(fallbackData.siteStats).length).toBe(4);
  });

  it('should have at least 3 fallback articles for every category', () => {
    fallbackData.categories.forEach((cat) => {
      const matching = fallbackData.articles.filter((a) => a.category.slug === cat.slug);
      expect(matching.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Service Fallback Interception on Network Failure', () => {
    beforeEach(() => {
      vi.restoreAllMocks();
    });

    it('should serve fallback articles with pagination on network failure', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'Network Error'
      });

      const res = await articlesApi.getArticles({ page: 1, limit: 4 });
      expect(res.success).toBe(true);
      expect(res._isFallback).toBe(true);
      expect(res.data.items.length).toBe(4);
      expect(res.data.pagination.total).toBe(18);
    });

    it('should serve 6 trending articles on network failure', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'Network Error'
      });

      const res = await articlesApi.getTrending();
      expect(res.success).toBe(true);
      expect(res._isFallback).toBe(true);
      expect(res.data.length).toBe(6);
    });

    it('should serve 6 categories on network failure', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'Network Error'
      });

      const res = await articlesApi.getCategories();
      expect(res.success).toBe(true);
      expect(res._isFallback).toBe(true);
      expect(res.data.length).toBe(6);
    });

    it('should serve fallback comments on network failure', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce({
        code: 'NETWORK_ERROR',
        message: 'Network Error'
      });

      const res = await commentsApi.getComments('art-fb-01');
      expect(res.success).toBe(true);
      expect(res._isFallback).toBe(true);
      expect(res.data.length).toBe(4);
    });

    it('should return live dynamic backend data when backend call succeeds', async () => {
      const dynamicPayload = {
        success: true,
        data: [{ id: 'live-1', title: 'Live Dynamic Article' }]
      };
      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(dynamicPayload);

      const res = await articlesApi.getArticles();
      expect(res).toEqual(dynamicPayload);
      expect(res._isFallback).toBeUndefined();
    });
  });
});
