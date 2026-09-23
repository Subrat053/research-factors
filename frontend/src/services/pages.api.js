import { useQuery } from '@tanstack/react-query';
import { apiClient } from './api.client.js';
import pagesContent from '../data/pagesContent.json';

/**
 * Checks if an error is due to network disconnection or missing route.
 */
const isNetworkOrNotFound = (err) => {
  return (
    !err?.response ||
    err?.status === 404 ||
    err?.code === 'NETWORK_ERROR' ||
    err?.code === 'ERR_NETWORK' ||
    err?.code === 'ECONNREFUSED' ||
    (typeof err?.message === 'string' &&
      (err.message.includes('Network Error') || err.message.includes('connect')))
  );
};

export const pagesApi = {
  /**
   * Fetches page content dynamically with offline JSON fallback.
   * Future-proofed for Admin CMS integration.
   */
  getPageContent: async (slug) => {
    try {
      const res = await apiClient.get(`/pages/${slug}`);
      return res;
    } catch (err) {
      if (isNetworkOrNotFound(err)) {
        const fallback = pagesContent[slug] || null;
        if (fallback) {
          return {
            success: true,
            data: fallback,
            _isFallback: true
          };
        }
      }
      throw err;
    }
  }
};

/**
 * React hook for consuming structured page content with TanStack Query caching.
 * Seamlessly provides fallback content offline, and dynamic DB content when online.
 */
export function usePageContent(slug) {
  return useQuery({
    queryKey: ['page-content', slug],
    queryFn: () => pagesApi.getPageContent(slug),
    select: (res) => res?.data || pagesContent[slug] || null,
    staleTime: 1000 * 60 * 15 // 15 min cache
  });
}
