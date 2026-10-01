import React, { useMemo } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '../../services/articles.api.js';
import { seoApi } from '../../services/seo.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { CardSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import {
  Hash,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  X,
  BookOpen,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const ARTICLE_TYPES = [
  { label: 'All Formats', value: '' },
  { label: 'Research', value: 'RESEARCH' },
  { label: 'Analysis', value: 'ANALYSIS' },
  { label: 'Review', value: 'REVIEW' },
  { label: 'Comparison', value: 'COMPARISON' },
  { label: 'Guide', value: 'GUIDE' }
];

export default function TagPage() {
  const { tagSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';

  // 1. Fetch Tag Metadata
  const {
    data: tagData,
    isLoading: isTagLoading
  } = useQuery({
    queryKey: ['tag', tagSlug],
    queryFn: () => articlesApi.getTagBySlug(tagSlug),
    enabled: Boolean(tagSlug),
    staleTime: 1000 * 60 * 5
  });

  // 2. Fetch Tag-Specific Articles
  const {
    data: articlesData,
    isLoading: isArticlesLoading
  } = useQuery({
    queryKey: ['articles', { tag: tagSlug, page, type, sort, search }],
    queryFn: () =>
      articlesApi.getArticles({
        tag: tagSlug,
        page,
        type,
        sort,
        search,
        limit: 12
      }),
    enabled: Boolean(tagSlug),
    staleTime: 1000 * 60 * 2
  });

  // 3. Fetch Popular / Sibling Tags for Cross-Discovery
  const { data: allTagsData } = useQuery({
    queryKey: ['tags', { limit: 16 }],
    queryFn: () => articlesApi.getTags({ limit: 16 }),
    staleTime: 1000 * 60 * 10
  });

  // 4. Fetch Resolved SEO for Tag
  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'tag', tagSlug],
    queryFn: () => seoApi.resolveSeo({ type: 'TAG', id: tagSlug }),
    enabled: Boolean(tagSlug),
    staleTime: 1000 * 60 * 10
  });
  const tagSeo = seoResponse?.data || null;

  const tag = tagData?.data;
  const articles = articlesData?.data?.items || [];
  const pagination = articlesData?.data?.pagination || { page: 1, totalPages: 1, totalItems: articles.length };
  const allTags = allTagsData?.data || [];

  const tagName = tag?.name || tagSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Filter sibling tags excluding current
  const siblingTags = useMemo(() => {
    return allTags.filter((t) => t.slug !== tagSlug && (t.articlesCount || 0) > 0);
  }, [allTags, tagSlug]);

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
    if (key === 'page') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = Boolean(type || search || sort !== 'latest');

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      <SeoHead
        title={tagSeo?.title || `#${tagName} — Research & Publications | Research Factors`}
        description={
          tagSeo?.description ||
          `Explore peer-reviewed publications, in-depth analyses, and benchmarks tagged with #${tagName} on Research Factors.`
        }
        canonicalUrl={tagSeo?.canonicalUrl || `https://researchfactors.com/tag/${tagSlug}`}
        type="website"
      />

      <Header />

      <main className="flex-1 pb-20">
        {/* Editorial Tag Hero Section */}
        <section className="bg-paper-card border-b border-paper-border pt-8 pb-12 sm:pt-12 sm:pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light mb-6">
              <Link to="/" className="hover:text-rfblue transition-colors">
                Home
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <Link to="/research" className="hover:text-rfblue transition-colors">
                Research
              </Link>
              <ChevronRight className="w-3.5 h-3.5 shrink-0" />
              <span className="font-semibold text-ink-darkest truncate">
                {tagName}
              </span>
            </nav>

            <div className="space-y-4 max-w-3xl">
              {/* Tag Pill Badge */}
              {/* <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rfblue-50 text-rfblue border border-rfblue-100 text-xs font-bold tracking-wide uppercase">
                <Hash className="w-3.5 h-3.5" />
                <span>Topic Tag</span>
              </div> */}

              {/* Main Headline */}
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold text-ink-darkest tracking-tight leading-tight">
                {tagName}
              </h1>

              {/* Publication Count & Description */}
              <p className="text-base sm:text-lg text-ink-muted leading-relaxed">
                Explore all published articles tagged with {tagName}
              </p>
            </div>
          </div>
        </section>

        {/* Content & Filter Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-10">
          {/* Filter Bar */}
          <div className="bg-white border border-paper-border rounded-2xl p-4 sm:p-5 shadow-xs mb-8 space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Format Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
                {ARTICLE_TYPES.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => updateParam('type', fmt.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      type === fmt.value
                        ? 'bg-ink-darkest text-white shadow-2xs'
                        : 'bg-paper text-ink-muted hover:text-ink-darkest hover:bg-paper-border/60'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-3">
                {/* Search Input */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 text-ink-light absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => updateParam('search', e.target.value)}
                    placeholder={`Search within #${tagName}...`}
                    className="w-full pl-9 pr-8 py-1.5 text-xs sm:text-sm rounded-xl bg-paper border border-paper-border focus:border-rfblue focus:outline-hidden text-ink-darkest placeholder:text-ink-light"
                  />
                  {search && (
                    <button
                      onClick={() => updateParam('search', '')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-darkest"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Sort Dropdown */}
                <select
                  value={sort}
                  onChange={(e) => updateParam('sort', e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-paper border border-paper-border text-xs sm:text-sm font-medium text-ink-darkest focus:border-rfblue focus:outline-hidden cursor-pointer"
                  aria-label="Sort publications"
                >
                  <option value="latest">Latest</option>
                  <option value="popular">Most Popular</option>
                </select>
              </div>
            </div>

            {/* Active Filter Indicators */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between pt-3 border-t border-paper-border/60 text-xs text-ink-muted">
                <span className="flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Filtered results</span>
                </span>
                <button
                  onClick={clearAllFilters}
                  className="text-rfblue hover:text-rfblue-700 font-semibold cursor-pointer"
                >
                  Reset all filters
                </button>
              </div>
            )}
          </div>

          {/* Articles Listing Grid */}
          {isArticlesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : articles.length === 0 ? (
            <div className="py-16">
              <EmptyState
                icon={Hash}
                title={`No publications found for ${tagName}`}
                description={
                  hasActiveFilters
                    ? 'No articles match your current filter criteria. Try adjusting your format filter or clearing the search keyword.'
                    : `There are currently no active publications associated with ${tagName}. Check back soon for new research.`
                }
                action={
                  hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rfblue bg-rfblue-50 border border-rfblue-200 hover:bg-rfblue-100 transition-colors cursor-pointer"
                    >
                      Clear Filters
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => navigate('/research')}
                      className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rfblue bg-rfblue-50 border border-rfblue-200 hover:bg-rfblue-100 transition-colors cursor-pointer"
                    >
                      Browse All Research
                    </button>
                  )
                }
              />
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Pagination Controls */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-paper-border pt-6">
                  <button
                    onClick={() => updateParam('page', String(page - 1))}
                    disabled={page <= 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-paper-border text-ink-darkest disabled:opacity-40 disabled:pointer-events-none hover:bg-paper transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs sm:text-sm text-ink-muted font-medium">
                    Page {page} of {pagination.totalPages}
                  </span>

                  <button
                    onClick={() => updateParam('page', String(page + 1))}
                    disabled={page >= pagination.totalPages}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-white border border-paper-border text-ink-darkest disabled:opacity-40 disabled:pointer-events-none hover:bg-paper transition-colors cursor-pointer"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Sibling / Related Active Tags Strip */}
          {siblingTags.length > 0 && (
            <div className="mt-16 pt-10 border-t border-paper-border space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rfblue" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-ink-darkest">
                  Explore Related Topics
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {siblingTags.map((sTag) => (
                  <Link
                    key={sTag.id || sTag.slug}
                    to={`/tag/${sTag.slug}`}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-rfblue-50 text-ink-muted hover:text-rfblue border border-paper-border hover:border-rfblue-200 transition-colors shadow-2xs"
                  >
                    <Hash className="w-3 h-3 text-ink-light" />
                    <span>{sTag.name}</span>
                    {sTag.articlesCount > 0 && (
                      <span className="text-[10px] text-ink-light">({sTag.articlesCount})</span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
