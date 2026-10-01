import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '../../services/articles.api.js';
import { recommendationsApi } from '../../services/recommendations.api.js';
import { seoApi } from '../../services/seo.api.js';
import { resolveCategoryArt } from '../../utils/categoryTheme.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { CardSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal, X, Hash, Bookmark } from 'lucide-react';

export default function ResearchListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const category = searchParams.get('category') || '';
  const tag = searchParams.get('tag') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';

  // Canonical redirect for legacy /research?tag=:tagSlug to dedicated /tag/:tagSlug
  React.useEffect(() => {
    if (tag) {
      navigate(`/tag/${tag}`, { replace: true });
    }
  }, [tag, navigate]);

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles', { page, category, tag, type, sort, search }],
    queryFn: () => articlesApi.getArticles({ page, category, tag, type, sort, search })
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories()
  });

  // Fetch visitor saved interests to power personal recommendation filters
  const { data: interestsData } = useQuery({
    queryKey: ['visitor-interests'],
    queryFn: () => recommendationsApi.getVisitorInterests(),
    staleTime: 1000 * 60 * 5
  });

  // Fetch Resolved Archive SEO
  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'research'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'research' }),
    staleTime: 1000 * 60 * 10
  });
  const pageSeo = seoResponse?.data || null;

  const articles = articlesData?.data?.items || [];
  const pagination = articlesData?.data?.pagination || { page: 1, totalPages: 1 };
  const categories = categoriesData?.data || [];
  const rawSavedInterests = interestsData?.data || [];
  const savedInterests = rawSavedInterests.filter((item) => {
    const cat = item.category;
    if (!cat || cat.isActive === false) return false;
    return categories.some((c) => (c.id === cat.id || c.slug === cat.slug) && c.isActive !== false);
  });

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1'); // Reset to page 1 on filter changes, but NOT when navigating pages!
    }
    setSearchParams(newParams);
    if (key === 'page') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isSearchState = Boolean(search || page > 1);
  const robotsDirective = isSearchState ? 'noindex, follow' : (pageSeo?.robots || 'index, follow');
  const cleanCanonical = typeof window !== 'undefined' ? `${window.location.origin}/research` : 'https://researchfactors.com/research';

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SeoHead
        seo={pageSeo}
        title={type ? `${type} Publications & Research | Research Factors` : 'Research Archive & Library | Research Factors'}
        description="Browse the complete index of peer-reviewed research publications, analytical reviews, and systematic comparisons."
        canonicalUrl={cleanCanonical}
        robots={robotsDirective}
      />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-12 w-full">
        {/* Page Heading */}
        <div className="border-b border-paper-border pb-4 mb-4">
          <h1 className="text-ink-darkest font-semibold">
            Our Research
          </h1>
          <p className="mt-2 text-lead max-w-3xl">
            Explore peer-reviewed publications, technical benchmarks, and cross-disciplinary analyses.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-paper-border p-3 mb-10 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-72 lg:w-80">
              <Search className="w-4 h-4 text-ink-light absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm rounded-xl border border-paper-border bg-paper focus:bg-white focus:outline-none focus:ring-2 focus:ring-rfblue text-ink transition-all"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => updateParam('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink p-0.5"
                  title="Clear search"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdowns: Topic/Category, Format, and Sort */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full md:w-auto">
              {/* Dynamic Category/Topic Selector */}
              <select
                value={category}
                onChange={(e) => updateParam('category', e.target.value)}
                className="w-full sm:w-auto text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-paper-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rfblue shadow-2xs cursor-pointer"
                aria-label="Filter by Topic"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Article Type Selector */}
              <select
                value={type}
                onChange={(e) => updateParam('type', e.target.value)}
                className="w-full sm:w-auto text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-paper-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rfblue shadow-2xs cursor-pointer"
                aria-label="Filter by Format"
              >
                <option value="">All Types</option>
                <option value="RESEARCH">Research</option>
                <option value="REVIEW">Review</option>
                <option value="COMPARISON">Comparison</option>
                <option value="ANALYSIS">Analysis</option>
                <option value="GUIDE">Guide</option>
                <option value="OPINION">Opinion</option>
              </select>

              {/* Sort Selector */}
              <select
                value={sort}
                onChange={(e) => updateParam('sort', e.target.value)}
                className="w-full sm:w-auto text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-paper-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rfblue shadow-2xs cursor-pointer"
                aria-label="Sort by"
              >
                <option value="latest">Latest Published</option>
                <option value="popular">Most Viewed</option>
                <option value="discussed">Most Discussed</option>
              </select>
            </div>
          </div>

          {/* Active Filter Indicators (Category, Format & Tag) */}
          {(category || tag || type) && (
            <div className="flex items-center gap-2.5 pt-3 border-t border-paper-border/60 flex-wrap">
              <span className="text-xs text-ink-muted font-medium">Filtered By:</span>
              {category && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rfblue-50 text-rfblue border border-rfblue-200">
                  <span>Topic: {categories.find((c) => c.slug === category)?.name || category}</span>
                  <button
                    type="button"
                    onClick={() => updateParam('category', '')}
                    className="ml-1 text-rfblue/60 hover:text-rfblue focus:outline-none transition-colors"
                    title="Remove topic filter"
                    aria-label="Remove topic filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {type && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rfblue-50 text-rfblue border border-rfblue-200">
                  <Bookmark className="w-3 h-3 text-rfblue" />
                  <span>Type: {type}</span>
                  <button
                    type="button"
                    onClick={() => updateParam('type', '')}
                    className="ml-1 text-rfblue/60 hover:text-rfblue focus:outline-none transition-colors"
                    title="Remove format filter"
                    aria-label="Remove format filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              {tag && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                  <Hash className="w-3 h-3 text-brand-500" />
                  <span>{tag.replace(/-/g, '_')}</span>
                  <button
                    type="button"
                    onClick={() => updateParam('tag', '')}
                    className="ml-1 text-brand-400 hover:text-brand-700 focus:outline-none transition-colors"
                    title="Remove tag filter"
                    aria-label="Remove tag filter"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.delete('category');
                  newParams.delete('tag');
                  newParams.delete('type');
                  newParams.set('page', '1');
                  setSearchParams(newParams);
                }}
                className="text-xs font-medium text-ink-light hover:text-rfblue underline ml-1 transition-colors"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Results Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No matching research articles"
            description="Try changing your filters or searching for alternative keywords."
          />
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-14 pt-8 border-t border-paper-border flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              type="button"
              disabled={page <= 1 || !pagination.hasPrevPage}
              onClick={() => updateParam('page', Math.max(1, page - 1).toString())}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-paper-border text-xs font-semibold text-ink-muted bg-white hover:bg-paper-warm disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full py-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => updateParam('page', p.toString())}
                  className={`w-9 h-9 rounded-xl text-xs font-bold transition-all ${
                    p === page
                      ? 'bg-rfblue text-white shadow-2xs'
                      : 'text-ink-muted hover:text-ink hover:bg-white border border-transparent hover:border-paper-border'
                  }`}
                  aria-label={`Go to page ${p}`}
                  aria-current={p === page ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
            </div>

            <button
              type="button"
              disabled={page >= pagination.totalPages || !pagination.hasNextPage}
              onClick={() => updateParam('page', Math.min(pagination.totalPages, page + 1).toString())}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-paper-border text-xs font-semibold text-ink-muted bg-white hover:bg-paper-warm disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-2xs"
            >
              <span>Next Page</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
