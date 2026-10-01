import { useEffect, useRef, useState, useCallback } from 'react';
import { recommendationsApi } from '../services/recommendations.api.js';

/**
 * Hook to passively observe reading engagement:
 * - Records ARTICLE_VIEW on entry
 * - Records ARTICLE_SCROLL_50 when 50% depth is achieved
 * - Records ARTICLE_COMPLETED when 90% depth is reached
 * - Emits isEngaged when 30s dwell time OR 50% scroll is reached
 */
export function useReadingTracker({ articleId, categoryId, tags = [], dwellSeconds = 30 } = {}) {
  const [scrollPercent, setScrollPercent] = useState(0);
  const [isDwellReached, setIsDwellReached] = useState(false);
  const [isEngaged, setIsEngaged] = useState(false);

  const hasViewedRef = useRef(false);
  const hasScrolled50Ref = useRef(false);
  const hasCompletedRef = useRef(false);
  const dwellTimerRef = useRef(null);

  // 1. Initial View Event
  useEffect(() => {
    if (!articleId || hasViewedRef.current) return;
    hasViewedRef.current = true;

    recommendationsApi.trackEvent({
      eventType: 'ARTICLE_VIEW',
      articleId,
      categoryId
    });
  }, [articleId, categoryId]);

  // 2. Dwell Time Timer (30s default)
  useEffect(() => {
    if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);

    dwellTimerRef.current = setTimeout(() => {
      setIsDwellReached(true);
      setIsEngaged(true);
    }, dwellSeconds * 1000);

    return () => {
      if (dwellTimerRef.current) clearTimeout(dwellTimerRef.current);
    };
  }, [articleId, dwellSeconds]);

  // 3. Scroll Depth Observer
  const handleScroll = useCallback(() => {
    if (typeof window === 'undefined') return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (scrollHeight <= 0) return;

    const percent = Math.min(100, Math.round((scrollTop / scrollHeight) * 100));
    setScrollPercent(percent);

    // 50% Scroll Milestone
    if (percent >= 50) {
      setIsEngaged(true);
      if (!hasScrolled50Ref.current && articleId) {
        hasScrolled50Ref.current = true;
        recommendationsApi.trackEvent({
          eventType: 'ARTICLE_SCROLL_50',
          articleId,
          categoryId
        });
      }
    }

    // 90% Read Completion Milestone
    if (percent >= 90) {
      if (!hasCompletedRef.current && articleId) {
        hasCompletedRef.current = true;
        recommendationsApi.trackEvent({
          eventType: 'ARTICLE_COMPLETED',
          articleId,
          categoryId
        });
      }
    }
  }, [articleId, categoryId]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return {
    scrollPercent,
    isDwellReached,
    isEngaged
  };
}
