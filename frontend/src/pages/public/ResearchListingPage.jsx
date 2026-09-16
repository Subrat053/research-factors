import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '../../services/articles.api.js';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { CardSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { Search, ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';

export default function ResearchListingPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1', 10);
  const category = searchParams.get('category') || '';
  const type = searchParams.get('type') || '';
  const sort = searchParams.get('sort') || 'latest';
  const search = searchParams.get('search') || '';

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles', { page, category, type, sort, search }],
    queryFn: () => articlesApi.getArticles({ page, category, type, sort, search })
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories()
  });

  const articles = articlesData?.data?.items || [];
  const pagination = articlesData?.data?.pagination || { page: 1, totalPages: 1 };
  const categories = categoriesData?.data || [];

  const updateParam = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1'); // Reset to page 1 on filter changes
    setSearchParams(newParams);
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Page Heading */}
        <div className="border-b border-paper-border pb-8 mb-10">
          <h1 className="text-4xl sm:text-5xl font-serif font-bold text-ink-darkest tracking-tight">
            Research Archive
          </h1>
          <p className="mt-2 text-base text-ink-muted font-light max-w-2xl">
            Explore peer-reviewed publications, technical benchmarks, and cross-disciplinary analyses.
          </p>
        </div>

        {/* Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-paper-border p-5 mb-10 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 text-ink-light absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => updateParam('search', e.target.value)}
                placeholder="Filter by keyword..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-paper-border bg-paper focus:bg-white focus:outline-none focus:ring-2 focus:ring-rfblue text-ink transition-all"
              />
            </div>

            {/* Dropdowns */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
              {/* Article Type Selector */}
              <select
                value={type}
                onChange={(e) => updateParam('type', e.target.value)}
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-paper-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rfblue"
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
                className="text-xs font-semibold px-3 py-2 rounded-xl border border-paper-border bg-white text-ink focus:outline-none focus:ring-2 focus:ring-rfblue"
              >
                <option value="latest">Latest Published</option>
                <option value="popular">Most Viewed</option>
                <option value="discussed">Most Discussed</option>
              </select>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex items-center space-x-2 overflow-x-auto pt-2">
            <button
              onClick={() => updateParam('category', '')}
              className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-colors ${
                !category ? 'bg-rfblue text-white' : 'bg-paper text-ink-muted hover:text-ink'
              }`}
            >
              All Topics
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => updateParam('category', c.slug)}
                className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 transition-colors ${
                  category === c.slug ? 'bg-rfblue text-white' : 'bg-paper text-ink-muted hover:text-ink'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
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
          <div className="mt-14 pt-8 border-t border-paper-border flex items-center justify-between">
            <button
              disabled={!pagination.hasPrevPage}
              onClick={() => updateParam('page', (page - 1).toString())}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-paper-border text-xs font-semibold text-ink-muted hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous Page</span>
            </button>

            <span className="text-xs text-ink-muted">
              Page <strong className="text-ink-darkest">{pagination.page}</strong> of{' '}
              <strong className="text-ink-darkest">{pagination.totalPages}</strong>
            </span>

            <button
              disabled={!pagination.hasNextPage}
              onClick={() => updateParam('page', (page + 1).toString())}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg border border-paper-border text-xs font-semibold text-ink-muted hover:bg-white disabled:opacity-30 disabled:pointer-events-none transition-colors"
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
