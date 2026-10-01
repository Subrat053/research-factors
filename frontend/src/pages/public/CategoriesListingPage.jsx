import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Compass,
  Search,
  X,
  Layers,
  ArrowRight,
  BookOpen,
  Sparkles,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { articlesApi } from '../../services/articles.api.js';
import { seoApi } from '../../services/seo.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { CategoryCard } from '../../components/category/CategoryCard.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';

function CategoryCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-paper-border p-5 h-[235px] flex flex-col justify-between animate-pulse">
      <div>
        <div className="float-right ml-4 mb-2 w-24 h-24 rounded-xl bg-slate-100" />
        <div className="h-6 w-3/5 bg-slate-200 rounded-md mb-3" />
        <div className="space-y-2">
          <div className="h-3 w-4/5 bg-slate-100 rounded" />
          <div className="h-3 w-3/4 bg-slate-100 rounded" />
          <div className="h-3 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
      <div className="pt-3 border-t border-paper-border/60 flex items-center justify-between">
        <div className="h-3.5 w-16 bg-slate-100 rounded" />
        <div className="w-7 h-7 rounded-full bg-slate-100" />
      </div>
    </div>
  );
}

export default function CategoriesListingPage() {
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Fetch Resolved SEO
  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'categories'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'categories' }),
    staleTime: 1000 * 60 * 15
  });
  const pageSeo = seoResponse?.data || null;

  // 2. Fetch Active Categories
  const {
    data: categoriesData,
    isLoading,
    isError,
    refetch
  } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 1000 * 60 * 5
  });

  const categories = useMemo(() => {
    return Array.isArray(categoriesData?.data)
      ? categoriesData.data
      : Array.isArray(categoriesData)
      ? categoriesData
      : [];
  }, [categoriesData]);

  // 3. Filter Categories by live search input
  const filteredCategories = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((cat) => {
      const name = (cat.name || '').toLowerCase();
      const desc = (cat.desc || cat.description || '').toLowerCase();
      const slug = (cat.slug || '').toLowerCase();
      return name.includes(query) || desc.includes(query) || slug.includes(query);
    });
  }, [categories, searchQuery]);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <SeoHead
        seo={pageSeo}
        fallback={{
          title: 'All Research Categories & Disciplines | Research Factors',
          description:
            'Explore empirical research, peer-reviewed analysis, and authoritative findings across all academic, scientific, and industry disciplines on Research Factors.',
          type: 'website'
        }}
      />

      <Header />

      <main className="flex-1 pb-16 lg:pb-24">
        {/* ==================================================
            A. DIRECTORY HERO & BREADCRUMBS
            ================================================== */}
        <section className="bg-paper-light border-b border-paper-border py-10 sm:py-14">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Breadcrumb Navigation */}
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light">
                <li>
                  <Link to="/" className="hover:text-rfblue transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </li>
                <li className="font-semibold text-ink-darkest" aria-current="page">
                  Categories
                </li>
              </ol>
            </nav>

            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="max-w-3xl">
                
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-serif text-ink-darkest tracking-tight leading-tight">
                  Explore research on the topics that matter most
                </h1>
                {/* <p className="mt-3 text-sm sm:text-base lg:text-lg text-ink-muted leading-relaxed">
                  Explore empirical research, comparative benchmarking, and critical insights organized
                  across our specialized academic and industry categories.
                </p> */}
              </div>

              {/* Live Search & Count Affordance */}
              <div className="w-full lg:w-80 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-ink-light absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search topics..."
                    aria-label="Search research disciplines"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-white border border-paper-border text-sm text-ink-darkest placeholder-ink-light focus:outline-none focus:border-rfblue focus:ring-2 focus:ring-rfblue/20 transition-all shadow-2xs"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear category search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-light hover:text-ink-darkest"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-ink-light px-1">
                  <span>
                    {isLoading
                      ? 'Loading topics...'
                      : `${filteredCategories.length} ${
                          filteredCategories.length === 1 ? 'topic' : 'topics'
                        } available`}
                  </span>
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="text-rfblue hover:underline font-medium"
                    >
                      Reset filter
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ==================================================
            B. CATEGORIES DIRECTORY GRID
            ================================================== */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </div>
          ) : isError ? (
            <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-paper-border max-w-xl mx-auto shadow-xs">
              <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
                <RefreshCw className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-ink-darkest">Unable to Load Categories</h2>
              <p className="text-sm text-ink-muted mt-2">
                We encountered an issue retrieving the research disciplines. Please verify your connection
                and try again.
              </p>
              <button
                type="button"
                onClick={() => refetch()}
                className="mt-5 px-4 py-2 rounded-xl bg-rfblue text-white text-xs font-bold uppercase tracking-wider hover:bg-rfblue-700 transition-colors shadow-xs"
              >
                Retry
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Compass}
                title="No categories match your search"
                description={
                  searchQuery
                    ? `No research disciplines matched "${searchQuery}". Try a different keyword or reset the search.`
                    : 'No research categories are currently published.'
                }
                actionLabel={searchQuery ? 'Clear Search' : undefined}
                onAction={searchQuery ? () => setSearchQuery('') : undefined}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((cat) => (
                <CategoryCard
                  key={cat.id || cat.slug}
                  topic={cat}
                  className="h-full sm:min-h-[245px]"
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
