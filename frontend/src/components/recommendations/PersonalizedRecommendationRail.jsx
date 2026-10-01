import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight, Sparkles } from 'lucide-react';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { resolveCategoryArt } from '../../utils/categoryTheme.js';
import { recommendationsApi } from '../../services/recommendations.api.js';

/**
 * Single Recommendation Card (Light Editorial Theme)
 * Displays:
 * - Cover Image with smooth zoom transition
 * - Category Name
 * - Article Title & Excerpt
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

  const categoryArt = article.category ? resolveCategoryArt(article.category) : null;
  const categorySlug = article.category?.slug || 'research';
  const articleUrl = `/${categorySlug}/${article.slug}`;

  return (
    <article className="group relative flex flex-col justify-between rounded-2xl bg-white border border-paper-border overflow-hidden shadow-xs hover:shadow-md hover:border-rfblue/50 transition-all duration-300">
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

      <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
        <div className="space-y-3">
          {/* Top Meta: Category Flaticon & Match Reason / Affinity Badge */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {article.category && (
              <Link
                to={`/categories/${categorySlug}`}
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-ink-muted hover:text-rfblue transition-colors"
              >
                {/* {categoryArt && (
                  <img
                    src={categoryArt}
                    alt=""
                    className="w-5 h-5 object-contain"
                    loading="lazy"
                  />
                )} */}
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
        </div>

        {/* Card Footer: Format Type & Reading Time */}
        <div className="pt-4 mt-4 border-t border-paper-border/80 flex items-center justify-between text-xs sm:text-sm text-ink-muted">
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
 * Renders all top scored recommendation items in a clean, unified 3-column responsive grid
 */
export function PersonalizedRecommendationRail({
  journeys,
  currentArticle = null,
  isLoading = false,
  className = ''
}) {
  if (isLoading) {
    return (
      <div className={`space-y-6 animate-pulse ${className}`}>
        <div className="space-y-2">
          <div className="h-6 w-56 bg-paper-border/60 rounded-md" />
          <div className="h-4 w-96 bg-paper-border/40 rounded-md" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white border border-paper-border rounded-2xl overflow-hidden flex flex-col">
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

  if (!journeys) return null;

  // Extract candidate items from journeys.recommendations or aggregate from clusters
  let items = [];
  if (Array.isArray(journeys.recommendations) && journeys.recommendations.length > 0) {
    items = journeys.recommendations;
  } else {
    // Fallback aggregation
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

  // Filter out the article currently being viewed
  if (currentArticle?.id) {
    items = items.filter((it) => it.article?.id !== currentArticle.id);
  }

  if (items.length === 0) return null;

  const categoryName = currentArticle?.category?.name;
  const subtitle = categoryName
    ? `Explore more of ${categoryName} that matches your interests.`
    : 'Recommended research based on your reading preferences and contextual affinity.';

  return (
    <aside
      aria-label="Recommended Research"
      className={`space-y-6 ${className}`}
    >
      {/* Unified Section Header */}
      <div className="space-y-1 pb-4 border-b border-paper-border">
        <div className="flex items-center gap-2">
          {/* <Sparkles className="w-5 h-5 text-rfblue" /> */}
          <h3 className="font-serif text-2xl sm:text-3xl font-bold text-ink-darkest tracking-tight">
            Recommended Articles
          </h3>
        </div>
        <p className="text-sm text-ink-muted">
          {subtitle}
        </p>
      </div>

      {/* Unified 3-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
