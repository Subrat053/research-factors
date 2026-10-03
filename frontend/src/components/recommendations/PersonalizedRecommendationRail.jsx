import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { recommendationsApi } from '../../services/recommendations.api.js';

/**
 * Single Recommendation Card (Light Editorial Theme)
 * Displays:
 * - Cover Image with smooth zoom transition
 * - Category Name & Match Percentage Badge
 * - Article Title & Excerpt
 * - Recommendation Reasoning
 * - Format Type & Reading Time
 */
function RecommendationCard({ item, currentArticle }) {
  const { article, matchPercentage, reason, intent } = item;
  if (!article) return null;

  const handleCardClick = () => {
    recommendationsApi.trackEvent({
      eventType: 'RECOMMENDATION_CLICK',
      articleId: article.id,
      categoryId: article.category?.id,
      metadata: {
        intent: intent || 'RECOMMENDED',
        matchPercentage,
        sourceArticleId: currentArticle?.id
      }
    });
  };

  const categorySlug = article.category?.slug || 'research';
  const articleUrl = `/${categorySlug}/${article.slug}`;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl bg-white border border-paper-border overflow-hidden shadow-xs hover:shadow-md hover:border-rfblue/50 transition-all duration-300 w-full sm:w-[calc(50%-12px)] lg:w-[calc((100%-48px)/3)] shrink-0">
      {/* Cover Image */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full overflow-hidden bg-slate-100 shrink-0">
        <Link
          to={articleUrl}
          onClick={handleCardClick}
          className="block w-full h-full"
          tabIndex={-1}
          aria-hidden="true"
        >
          {article.coverImageUrl ? (
            <img
              src={normalizeMediaUrl(article.coverImageUrl)}
              alt={article.coverImageAlt || article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-ink-light font-medium">
              Research Factors
            </div>
          )}
        </Link>
      </div>

      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1 space-y-4">
        <div className="space-y-3">
          {/* Top Meta: Category & Match Percentage Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {article.category && (
              <Link
                to={`/categories/${categorySlug}`}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-ink-muted hover:text-rfblue transition-colors"
              >
                <span className="truncate">{article.category.name}</span>
              </Link>
            )}
          </div>

          {/* Title */}
          <h4 className="text-base sm:text-lg font-bold text-ink-darkest leading-snug line-clamp-2 group-hover:text-rfblue transition-colors">
            <Link
              to={articleUrl}
              onClick={handleCardClick}
              className="focus:outline-hidden"
            >
              {article.title}
            </Link>
          </h4>

          {/* Excerpt */}
          {article.excerpt && (
            <p className="text-sm text-ink-muted line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          {/* Recommendation Reason Context */}
          {reason && (
            <p className="text-xs text-rfblue font-medium line-clamp-1">
              {reason}
            </p>
          )}
        </div>

        {/* Card Footer: Format Type & Reading Time */}
        <div className="pt-4 border-t border-paper-border/80 flex items-center justify-between text-xs sm:text-sm text-ink-muted">
          <div className="flex items-center gap-2">
            {article.type && (
              <span className="px-2.5 py-0.5 rounded-md bg-paper border border-paper-border font-semibold text-xs tracking-wider uppercase text-ink-muted">
                {article.type}
              </span>
            )}
            {article.readingTimeMin && (
              <span className="inline-flex items-center gap-1 text-xs">
                <Clock className="w-3.5 h-3.5 text-ink-light" />
                <span>{article.readingTimeMin} min read</span>
              </span>
            )}
          </div>

          <Link
            to={articleUrl}
            onClick={handleCardClick}
            className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-rfblue hover:text-rfblue-700 group-hover:translate-x-0.5 transition-transform"
            aria-label={`Read ${article.title}`}
          >
            <span>Read</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

/**
 * Unified Contextual Article Recommendations Rail
 * Renders recommendation items in a clean, single-row responsive slider with left/right navigation controls
 */
export function PersonalizedRecommendationRail({
  journeys,
  currentArticle = null,
  isLoading = false,
  className = ''
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Extract candidate items from journeys.recommendations or aggregate from clusters
  let items = [];
  if (journeys) {
    if (Array.isArray(journeys.recommendations) && journeys.recommendations.length > 0) {
      items = journeys.recommendations;
    } else {
      const seen = new Set();
      const clusters = [
        journeys.completeYourResearch?.items,
        journeys.deepTopicDive?.items,
        journeys.trendingInInterests?.items,
        journeys.discoverSomethingNew?.items
      ];
      for (const cluster of clusters) {
        if (Array.isArray(cluster)) {
          for (const it of cluster) {
            if (it?.article?.id && !seen.has(it.article.id)) {
              seen.add(it.article.id);
              items.push(it);
            }
          }
        }
      }
    }

    // Filter out current active article
    if (currentArticle?.id) {
      items = items.filter((it) => it.article?.id !== currentArticle.id);
    }
  }

  const checkScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 6);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollRef.current;
    if (!container) return;

    container.addEventListener('scroll', checkScroll, { passive: true });
    window.addEventListener('resize', checkScroll);

    // Initial check after paint/layout
    const timer = setTimeout(checkScroll, 100);

    return () => {
      container.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
      clearTimeout(timer);
    };
  }, [items, checkScroll]);

  const handleScroll = (direction) => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const firstCard = container.querySelector('article');
    // Scroll advance by 1 card plus gap or container visible width
    const cardStep = firstCard ? firstCard.offsetWidth + 24 : container.clientWidth * 0.8;
    const scrollAmount = direction === 'left' ? -cardStep : cardStep;
    container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="space-y-2">
          <div className="h-6 w-56 bg-paper-border/60 rounded-md" />
          <div className="h-4 w-96 bg-paper-border/40 rounded-md" />
        </div>
        <div className="flex gap-6 overflow-hidden py-1">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white border border-paper-border rounded-2xl overflow-hidden flex flex-col w-full sm:w-[calc(50%-12px)] lg:w-[calc((100%-48px)/3)] shrink-0"
            >
              <div className="aspect-[16/10] sm:aspect-[16/9] bg-paper-border/50 w-full" />
              <div className="p-5 sm:p-6 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-paper-border/60 rounded" />
                  <div className="h-6 w-5/6 bg-paper-border/50 rounded" />
                  <div className="h-4 w-full bg-paper-border/40 rounded" />
                </div>
                <div className="pt-4 mt-4 border-t border-paper-border/60 flex items-center justify-between">
                  <div className="h-4 w-20 bg-paper-border/40 rounded" />
                  <div className="h-4 w-12 bg-paper-border/40 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!journeys || items.length === 0) return null;

  const categoryName = currentArticle?.category?.name;
  const subtitle = categoryName
    ? `Explore more of ${categoryName} that matches your reading interests.`
    : 'Recommended research based on your reading preferences and contextual affinity.';

  return (
    <aside
      aria-label="Recommended Research"
      className={`space-y-6 ${className}`}
    >
      {/* Unified Section Header with Slider Navigation Controls */}
      <div className="flex items-center justify-between gap-4 pb-4 border-b border-paper-border">
        <div className="space-y-1">
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink-darkest tracking-tight">
            Recommended Articles
          </h3>
          <p className="text-sm text-ink-muted">
            {subtitle}
          </p>
        </div>

        {/* Left and Right Slide Controls (Shown when more than 3 items exist or scrolling is possible) */}
        {items.length > 3 && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleScroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous recommended articles"
              className={`p-2 sm:p-2.5 rounded-full border transition-all duration-200 ${
                canScrollLeft
                  ? 'bg-white border-paper-border text-ink-darkest hover:border-rfblue hover:text-rfblue hover:shadow-xs active:scale-95 cursor-pointer'
                  : 'bg-paper border-paper-border/50 text-ink-light cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              type="button"
              onClick={() => handleScroll('right')}
              disabled={!canScrollRight}
              aria-label="Next recommended articles"
              className={`p-2 sm:p-2.5 rounded-full border transition-all duration-200 ${
                canScrollRight
                  ? 'bg-white border-paper-border text-ink-darkest hover:border-rfblue hover:text-rfblue hover:shadow-xs active:scale-95 cursor-pointer'
                  : 'bg-paper border-paper-border/50 text-ink-light cursor-not-allowed opacity-40'
              }`}
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>

      {/* Single-Row Horizontal Scroll Track Slider */}
      <div
        ref={scrollRef}
        className="flex gap-6 overflow-x-auto no-scrollbar scroll-smooth py-1 -mx-1 px-1"
      >
        {items.map((item) => (
          <RecommendationCard
            key={item.article.id}
            item={item}
            currentArticle={currentArticle}
          />
        ))}
      </div>
    </aside>
  );
}
