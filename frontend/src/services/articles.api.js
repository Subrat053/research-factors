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

export const articlesApi = {
  getArticles: (params = {}) =>
    withFallback(
      () => apiClient.get('/articles', { params }),
      () => {
        let filtered = [...fallbackData.articles];

        if (params.category) {
          filtered = filtered.filter(
            (a) =>
              a.category?.slug === params.category ||
              a.category?.name?.toLowerCase() === params.category.toLowerCase()
          );
        }

        if (params.type) {
          filtered = filtered.filter((a) => a.type === params.type);
        }

        if (params.search && params.search.trim()) {
          const q = params.search.trim().toLowerCase();
          filtered = filtered.filter(
            (a) =>
              a.title?.toLowerCase().includes(q) ||
              a.subtitle?.toLowerCase().includes(q) ||
              a.excerpt?.toLowerCase().includes(q)
          );
        }

        if (params.sort === 'views' || params.sort === 'popular') {
          filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        } else {
          filtered.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        }

        const page = Math.max(1, parseInt(params.page, 10) || 1);
        const limit = Math.max(1, parseInt(params.limit, 10) || 8);
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const skip = (page - 1) * limit;
        const items = filtered.slice(skip, skip + limit);

        return {
          items,
          pagination: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        };
      }
    ),

  getFeaturedArticle: () =>
    withFallback(
      () => apiClient.get('/articles/featured'),
      () => fallbackData.articles.find((a) => a.isFeatured) || fallbackData.articles[0]
    ),

  getTrending: () =>
    withFallback(
      () => apiClient.get('/articles/trending'),
      () => fallbackData.trendingArticles
    ),

  getArticleBySlug: (slug) =>
    withFallback(
      () => apiClient.get(`/articles/${slug}`),
      () => {
        const found = fallbackData.articles.find((a) => a.slug === slug);
        return found || fallbackData.articles[0];
      }
    ),

  getCategories: () =>
    withFallback(
      () => apiClient.get('/categories'),
      () => fallbackData.categories
    ),

  getCategoryBySlug: (slug) =>
    withFallback(
      () => apiClient.get(`/categories/${slug}`),
      () => {
        return (
          fallbackData.categories.find((c) => c.slug === slug) ||
          fallbackData.categories[0]
        );
      }
    ),

  getTags: (params = {}) =>
    withFallback(
      () => apiClient.get('/tags', { params }),
      () => {
        const tagMap = new Map();
        fallbackData.articles.forEach((a) => {
          (a.tags || []).forEach((t) => {
            tagMap.set(t.slug, t);
          });
        });
        return Array.from(tagMap.values());
      }
    ),

  getTagBySlug: (slug) =>
    withFallback(
      () => apiClient.get(`/tags/${slug}`),
      () => ({
        id: `tag-${slug}`,
        name: slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        slug
      })
    ),

  search: (q, params = {}, options = {}) =>
    withFallback(
      () => apiClient.get('/search', { params: { q, ...params }, signal: options.signal }),
      () => {
        const query = (q || '').trim().toLowerCase();
        let filtered = fallbackData.articles.filter(
          (a) =>
            a.title?.toLowerCase().includes(query) ||
            a.subtitle?.toLowerCase().includes(query) ||
            a.excerpt?.toLowerCase().includes(query)
        );
        if (params.type) {
          filtered = filtered.filter((a) => a.type === params.type);
        }
        return filtered;
      }
    ),

  getSearchTrending: (params = {}) =>
    withFallback(
      () => apiClient.get('/search/trending', { params }),
      () => fallbackData.trendingArticles || fallbackData.articles.slice(0, 6)
    ),

  getSearchRecommendations: (params = {}) =>
    withFallback(
      () => apiClient.get('/search/recommendations', { params }),
      () => {
        let recs = [...fallbackData.articles];
        if (params.type) {
          const matched = recs.filter((a) => a.type === params.type);
          if (matched.length > 0) return matched.slice(0, params.limit || 4);
        }
        return recs.slice(0, params.limit || 4);
      }
    ),

  trackSearchClick: (articleId, term) => {
    return apiClient.post('/search/click', { articleId, term }).catch(() => {});
  },

  // Author endpoints (strictly live, require active authentication)
  getMyArticles: () => apiClient.get('/articles/author/me'),
  getDraft: (id) => apiClient.get(`/articles/${id}/draft`),
  createDraft: (data) => apiClient.post('/articles', data),
  updateDraft: (id, data) => apiClient.patch(`/articles/${id}/draft`, data),
  submitForReview: (id) => apiClient.post(`/articles/${id}/submit`),

  // Editorial endpoints (strictly live, require active authentication)
  approveArticle: (id) => apiClient.post(`/articles/${id}/approve`),
  rejectArticle: (id, reason) => apiClient.post(`/articles/${id}/reject`, { reason }),
  publishArticle: (id) => apiClient.post(`/articles/${id}/publish`)
};

export const searchApi = {
  search: articlesApi.search,
  getTrending: articlesApi.getSearchTrending,
  getRecommendations: articlesApi.getSearchRecommendations,
  trackClick: articlesApi.trackSearchClick
};
