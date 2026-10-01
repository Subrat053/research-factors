import React, { useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../../services/articles.api.js';
import { seoApi } from '../../services/seo.api.js';
import { normalizeMediaUrl, LOGO_URL } from '../../services/media.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { CardSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import {
  Compass,
  ChevronRight,
  ChevronLeft,
  Search,
  SlidersHorizontal,
  X,
  FileText,
  Sparkles,
  BookOpen,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export default function CategoryPage() {
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Search and Filter Params
  const page = parseInt(searchParams.get('page') || '1', 10);
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';
  const tag = searchParams.get('tag') || '';

  // 1. Fetch Dynamic Category Metadata (with Admin SEO overrides)
  const {
    data: categoryData,
    isLoading: isCategoryLoading,
    isError: isCategoryError
  } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => articlesApi.getCategoryBySlug(categorySlug),
    staleTime: 1000 * 60 * 5
  });

  // 2. Fetch Category-Specific Articles
  const {
    data: articlesData,
    isLoading: isArticlesLoading
  } = useQuery({
    queryKey: ['articles', { category: categorySlug, page, type, sort, search, tag }],
    queryFn: () =>
      articlesApi.getArticles({
        category: categorySlug,
        page,
        type,
        sort,
        search,
        tag,
        limit: 12
      }),
    staleTime: 1000 * 60 * 2
  });

  // 3. Fetch All Sibling Categories for Cross-Discovery
  const { data: allCategoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 1000 * 60 * 10
  });

  // 4. Fetch Resolved Category SEO
  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'category', categorySlug],
    queryFn: () => seoApi.resolveSeo({ type: 'CATEGORY', id: categorySlug }),
    enabled: Boolean(categorySlug),
    staleTime: 1000 * 60 * 10
  });
  const categorySeo = seoResponse?.data || null;

  const category = categoryData?.data;
  const articles = articlesData?.data?.items || [];
  const pagination = articlesData?.data?.pagination || { page: 1, totalPages: 1, totalItems: articles.length };
  const allCategories = allCategoriesData?.data || [];

  // Active tags extracted from current articles for quick pill filtering
  const availableTags = useMemo(() => {
    const map = new Map();
    articles.forEach((a) => {
      (a.tags || []).forEach((t) => {
        const name = typeof t === 'string' ? t.replace(/^#+/, '') : t.name;
        const slug = typeof t === 'string' ? t.toLowerCase().replace(/[^a-z0-9]+/g, '-') : t.slug;
        if (name && slug && !map.has(slug)) {
          map.set(slug, { name, slug });
        }
      });
    });
    return Array.from(map.values());
  }, [articles]);

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

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasActiveFilters = Boolean(search || type || tag || (sort && sort !== 'latest'));

  // ================= DYNAMIC SEO ENGINE =================
  // Combines Admin-Managed overrides with high-authority automatic generation
  const categoryName = category?.name || categorySlug?.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Research';
  const autoSeoTitle = `${categoryName} Research, Analysis & Comparative Studies — Research Factors`;
  const autoSeoDescription =
    category?.description ||
    `Explore peer-reviewed empirical research, comparative benchmarks, and authoritative analyses in ${categoryName} at Research Factors.`;
  const autoSeoKeywords = `${categoryName}, ${categoryName} research, comparative studies, technical analysis, peer-reviewed, benchmarks, research factors`;

  const finalTitle = category?.seoTitle?.trim() || autoSeoTitle;
  const finalDescription = category?.seoDescription?.trim() || autoSeoDescription;
  const finalKeywords = category?.seoKeywords?.trim() || autoSeoKeywords;
  const finalCanonical =
    category?.canonicalUrl?.trim() ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/categories/${categorySlug}`
      : `https://researchfactors.com/categories/${categorySlug}`);
  const finalOgImage = category?.imageUrl ? normalizeMediaUrl(category.imageUrl) : LOGO_URL;

  // Schema.org JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        '@id': `${finalCanonical}#webpage`,
        url: finalCanonical,
        name: finalTitle,
        description: finalDescription,
        isPartOf: {
          '@type': 'WebSite',
          name: 'Research Factors',
          url: typeof window !== 'undefined' ? window.location.origin : 'https://researchfactors.com'
        }
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: typeof window !== 'undefined' ? `${window.location.origin}/` : 'https://researchfactors.com/'
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: 'Research',
            item: typeof window !== 'undefined' ? `${window.location.origin}/research` : 'https://researchfactors.com/research'
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: categoryName,
            item: finalCanonical
          }
        ]
      }
    ]
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      {/* Dynamic Production SEO & Schema.org JSON-LD Graph */}
      <SeoHead
        seo={categorySeo}
        title={finalTitle}
        description={finalDescription}
        canonicalUrl={finalCanonical}
        openGraph={{
          title: finalTitle,
          description: finalDescription,
          url: finalCanonical,
          image: finalOgImage,
          type: 'website'
        }}
        jsonLd={categorySeo?.schema?.jsonLd || jsonLd}
      />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 w-full">
        {/* 1. Breadcrumb Navigation */}
        <nav aria-label="Breadcrumbs" className="flex items-center space-x-2 text-sm text-ink-light mb-6 sm:mb-8 flex-wrap">
          <Link to="/" className="hover:text-rfblue transition-colors">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <Link to="/research" className="hover:text-rfblue transition-colors">
            Categories
          </Link>
          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
          <span className="text-ink-darkest font-semibold truncate">
            {categoryName}
          </span>
        </nav>

        {/* 2. Hero Header Banner */}
        <div className="bg-white rounded-3xl border border-paper-border p-6 sm:p-10 lg:p-8 mb-8 sm:mb-10 shadow-xs relative overflow-hidden">
          {/* Subtle Ambient Decorative Gradient Accent */}
          <div
            className="absolute top-0 right-0 w-96 h-96 bg-rfblue-50/50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"
            aria-hidden="true"
          />

          <div className="max-w-4xl relative z-10">
            {/* Category Field Pill Badge */}
            {/* <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rfblue-50 text-rfblue mb-4 border border-rfblue-100">
              <Compass className="w-3.5 h-3.5" />
              <span>Research Field</span>
            </div> */}

            {/* H1 Heading */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ink-darkest tracking-tight">
              {categoryName} Articles
            </h1>

            {/* Editorial Description */}
            <p className="mt-3 sm:mt-4 text-sm sm:text-base lg:text-lg text-ink-muted leading-relaxed font-normal">
              {category?.description ||
                'Authoritative peer-reviewed publications, technical comparisons, benchmarks, and informed analysis.'}
            </p>

            {/* Meta Metric Chips */}
            <div className="hidden md:d-block mt-6 pt-6 border-t border-paper-border/80 flex flex-wrap items-center gap-4 sm:gap-6 text-xs text-ink-light">
              <div className="flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-rfblue" />
                <span className="font-semibold text-ink-darkest">
                  {category?._count?.articles ?? pagination.totalItems ?? articles.length}
                </span>
                <span>Published Papers</span>
              </div>
              <span className="text-paper-border hidden sm:inline">•</span>
              <div className="flex items-center space-x-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Peer-reviewed empirical studies</span>
              </div>
              <span className="text-paper-border hidden sm:inline">•</span>
              <div className="flex items-center space-x-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Open Reference Library</span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. In-Category Filter & Search Toolbar */}
        <div className="bg-white rounded-2xl border border-paper-border p-4 sm:p-5 mb-8 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-3 sm:gap-4 justify-between items-stretch md:items-center">
            {/* In-Category Search Input */}
            <div className="relative w-full md:w-80 lg:w-96">
              <Search className="w-4 h-4 text-ink-light absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                placeholder={`Search within ${categoryName}...`}
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-paper-border bg-paper focus:bg-white focus:outline-none focus:ring-2 focus:ring-rfblue text-ink transition-all"
              />
              {search && (
                <button
                  onClick={() => updateParam('search', '')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink p-0.5"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 sm:gap-3 w-full md:w-auto">
              {/* Format Filter */}
              <select
                value={type}
                onChange={(e) => updateParam('type', e.target.value)}
                className="w-full sm:w-auto text-xs sm:text-sm font-semibold px-3 py-2.5 rounded-xl border border-paper-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rfblue shadow-2xs cursor-pointer"
                aria-label="Filter by article format"
              >
                <option value="">All Formats</option>
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
                aria-label="Sort articles"
              >
                <option value="latest">Latest Published</option>
                <option value="popular">Most Popular</option>
                <option value="title">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Tag Filter Chips (if tags are available in this category) */}
          {availableTags.length > 0 && (
            <div className="pt-3 border-t border-paper-border/70 flex items-center gap-2 flex-wrap text-xs">
              <span className="text-ink-light font-semibold uppercase tracking-wider text-[11px] mr-1">
                Topics:
              </span>
              {availableTags.slice(0, 8).map((t) => {
                const isActive = tag === t.slug;
                return (
                  <button
                    key={t.slug}
                    onClick={() => updateParam('tag', isActive ? '' : t.slug)}
                    className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${isActive
                        ? 'bg-rfblue text-white font-medium'
                        : 'bg-paper text-ink-muted hover:text-ink hover:bg-slate-200/60 border border-paper-border'
                      }`}
                  >
                    {t.name}
                  </button>
                );
              })}
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center text-xs font-semibold text-rfred hover:text-rfred-600 transition-colors ml-auto cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset Filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. Articles Feed */}
        {isArticlesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : articles.length > 0 ? (
          <div className="space-y-10">
            {/* Articles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="standard" />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2 pt-6">
                <button
                  onClick={() => updateParam('page', Math.max(1, page - 1).toString())}
                  disabled={page <= 1}
                  className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-paper-border bg-white text-ink hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam('page', p.toString())}
                      className={`w-9 h-9 rounded-xl text-xs sm:text-sm font-semibold transition-colors ${p === page
                          ? 'bg-rfblue text-white shadow-xs'
                          : 'border border-paper-border bg-white text-ink hover:bg-paper shadow-2xs'
                        }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => updateParam('page', Math.min(pagination.totalPages, page + 1).toString())}
                  disabled={page >= pagination.totalPages}
                  className="inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold border border-paper-border bg-white text-ink hover:bg-paper disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs transition-colors"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-paper-border p-12 text-center shadow-xs">
            <EmptyState
              title={`No articles found in ${categoryName}`}
              description={
                hasActiveFilters
                  ? 'No publications match your current filters. Try resetting your search or format selections.'
                  : 'Our editors and fellows are currently reviewing manuscripts for this category.'
              }
            />
            {hasActiveFilters && (
              <div className="mt-4">
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-rfblue bg-rfblue-50 border border-rfblue-200 hover:bg-rfblue-100 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear All Filters</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. Explore Related Research Fields (Cross-Navigation) */}
        {allCategories.length > 1 && (
          <div className="mt-14 sm:mt-16 pt-10 border-t border-paper-border">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest">
                Explore Other Research Domains
              </h3>
              <Link
                to="/research"
                className="text-xs lg:text-sm font-semibold text-rfblue hover:underline inline-flex items-center"
              >
                All Categories <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {allCategories
                .filter((c) => c.slug !== categorySlug && c.isActive !== false)
                .slice(0, 8)
                .map((c) => (
                  <Link
                    key={c.id || c.slug}
                    to={`/categories/${c.slug}`}
                    className="inline-flex items-center px-3.5 py-1.5 rounded-xl border border-paper-border bg-white hover:bg-paper hover:border-rfblue-300 text-xs lg:text-sm font-medium text-ink transition-colors shadow-2xs"
                  >
                    <span>{c.name}</span>
                    {c._count?.articles !== undefined && (
                      <span className="ml-1.5 text-[10px] lg:text-xs text-ink-light font-mono">
                        ({c._count.articles})
                      </span>
                    )}
                  </Link>
                ))}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
