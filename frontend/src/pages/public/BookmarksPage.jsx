import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  BookmarkCheck,
  Search,
  X,
  Clock,
  ArrowUpRight,
  Filter,
  Trash2,
  BookOpen,
  Calendar,
  AlertCircle,
  RefreshCw,
  Compass
} from 'lucide-react';
import { bookmarksApi } from '../../services/bookmarks.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { normalizeMediaUrl } from '../../services/media.api.js';

export default function BookmarksPage() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('SAVED_DESC');
  const [removingId, setRemovingId] = useState(null);

  // Fetch bookmarks
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => bookmarksApi.getBookmarks({ limit: 100 })
  });

  // Extract articles safely from payload
  const rawArticles = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.data?.articles)) return data.data.articles;
    if (Array.isArray(data.data)) return data.data;
    if (Array.isArray(data.articles)) return data.articles;
    return [];
  }, [data]);

  // Remove bookmark mutation
  const removeBookmarkMutation = useMutation({
    mutationFn: (articleId) => bookmarksApi.toggleBookmark(articleId),
    onMutate: (articleId) => {
      setRemovingId(articleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      setRemovingId(null);
    },
    onError: () => {
      setRemovingId(null);
    }
  });

  const handleRemoveBookmark = (e, articleId) => {
    e.preventDefault();
    e.stopPropagation();
    if (removingId) return;
    removeBookmarkMutation.mutate(articleId);
  };

  // Derive unique categories from user's bookmarks
  const categories = useMemo(() => {
    const catMap = new Map();
    rawArticles.forEach((article) => {
      if (article.category?.name) {
        catMap.set(article.category.name, article.category);
      }
    });
    return Array.from(catMap.values());
  }, [rawArticles]);

  // Filter and sort articles
  const filteredArticles = useMemo(() => {
    return rawArticles
      .filter((article) => {
        // Category filter
        if (selectedCategory !== 'ALL' && article.category?.name !== selectedCategory) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const title = (article.title || '').toLowerCase();
          const subtitle = (article.subtitle || '').toLowerCase();
          const excerpt = (article.excerpt || '').toLowerCase();
          const categoryName = (article.category?.name || '').toLowerCase();
          const authorName = (
            article.author?.fullName ||
            article.author?.user?.name ||
            article.author?.user?.username ||
            ''
          ).toLowerCase();

          return (
            title.includes(q) ||
            subtitle.includes(q) ||
            excerpt.includes(q) ||
            categoryName.includes(q) ||
            authorName.includes(q)
          );
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'SAVED_DESC') {
          // Sort by bookmarked timestamp if available, fallback to published date
          const dateA = new Date(a.bookmarkedAt || a.publishedAt || 0).getTime();
          const dateB = new Date(b.bookmarkedAt || b.publishedAt || 0).getTime();
          return dateB - dateA;
        }
        if (sortBy === 'DATE_DESC') {
          return new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime();
        }
        if (sortBy === 'DATE_ASC') {
          return new Date(a.publishedAt || 0).getTime() - new Date(b.publishedAt || 0).getTime();
        }
        if (sortBy === 'TITLE_ASC') {
          return (a.title || '').localeCompare(b.title || '');
        }
        return 0;
      });
  }, [rawArticles, selectedCategory, searchQuery, sortBy]);

  const hasActiveFilters = searchQuery.trim() !== '' || selectedCategory !== 'ALL';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('ALL');
  };

  return (
    <AdminLayout
      title="Saved Research"
      subtitle="Your personal collection of peer-reviewed articles, empirical comparisons, and investigations"
      actions={
        rawArticles.length > 0 && (
          <div className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-semibold border border-blue-100 dark:border-blue-500/20">
              <Bookmark className="w-3.5 h-3.5" />
              {rawArticles.length} {rawArticles.length === 1 ? 'Article' : 'Articles'}
            </span>
          </div>
        )
      }
    >
      <Helmet>
        <title>Saved Research — Research Factors</title>
        <meta name="description" content="Your personal collection of saved research articles." />
      </Helmet>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <div className="h-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 animate-pulse shadow-xs"
              >
                <div className="h-44 bg-slate-200 dark:bg-slate-800 rounded-xl w-full" />
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/3" />
                <div className="h-5 bg-slate-200 dark:bg-slate-800 rounded w-5/6" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-full" />
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded w-2/3" />
                <div className="pt-2 flex justify-between items-center">
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/4" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl p-8 text-center max-w-xl mx-auto my-12">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-red-900 dark:text-red-200 mb-2">
            Failed to Load Bookmarks
          </h3>
          <p className="text-xs text-red-700 dark:text-red-400 mb-6 leading-relaxed">
            {error?.message || 'We encountered an error retrieving your saved research library. Please verify your connection and try again.'}
          </p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Try Again
          </button>
        </div>
      )}

      {/* Main Content Area */}
      {!isLoading && !isError && (
        <>
          {rawArticles.length === 0 ? (
            /* Empty State: Zero Bookmarks */
            <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-xl mx-auto shadow-xs my-8 transition-colors">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-5 ring-8 ring-blue-50/50 dark:ring-blue-900/20">
                <Bookmark className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                No Saved Research Yet
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-6 leading-relaxed">
                When you discover research articles, reviews, or clinical trials you wish to examine later, click the bookmark icon on any article to save it here permanently.
              </p>
              <Link
                to="/research"
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all shadow-xs"
              >
                <Compass className="w-4 h-4" />
                Explore Research Archive
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Controls Header: Search, Category Filter, and Sort */}
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between transition-colors">
                {/* Search Bar */}
                <div className="relative flex-1 min-w-[220px]">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search saved research by title, author, or keyword..."
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl pl-9 pr-9 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter and Sort Group */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Category Filter */}
                  {categories.length > 0 && (
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all cursor-pointer"
                      >
                        <option value="ALL">All Categories</option>
                        {categories.map((cat) => (
                          <option key={cat.id || cat.name} value={cat.name}>
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Sort Order */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-700 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-400 transition-all cursor-pointer"
                  >
                    <option value="SAVED_DESC">Recently Saved</option>
                    <option value="DATE_DESC">Newest Published</option>
                    <option value="DATE_ASC">Oldest Published</option>
                    <option value="TITLE_ASC">Title (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Pills / Search Feedback */}
              {hasActiveFilters && (
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
                  <div>
                    Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{filteredArticles.length}</span> of {rawArticles.length} saved articles
                    {searchQuery && (
                      <span className="ml-1">
                        matching &ldquo;<span className="text-slate-800 dark:text-slate-200 font-medium">{searchQuery}</span>&rdquo;
                      </span>
                    )}
                    {selectedCategory !== 'ALL' && (
                      <span className="ml-1">
                        in <span className="text-blue-600 dark:text-blue-400 font-medium">{selectedCategory}</span>
                      </span>
                    )}
                  </div>
                  <button
                    onClick={resetFilters}
                    className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    Clear Filters
                  </button>
                </div>
              )}

              {/* Filtered Out Empty State */}
              {filteredArticles.length === 0 ? (
                <div className="text-center py-16 px-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-lg mx-auto shadow-xs">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 mb-1">
                    No Matching Articles
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-xs mx-auto">
                    No saved research matched your active search or filter criteria.
                  </p>
                  <button
                    onClick={resetFilters}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    Reset Search & Filters
                  </button>
                </div>
              ) : (
                /* Bookmarks Responsive Grid */
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredArticles.map((article) => {
                    const categorySlug = article.category?.slug || 'research';
                    const articleUrl = `/${categorySlug}/${article.slug}`;
                    const isRemoving = removingId === article.id;

                    const formattedDate = article.publishedAt
                      ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : null;

                    const authorName =
                      article.author?.fullName ||
                      article.author?.user?.name ||
                      article.author?.user?.username ||
                      'Editorial Staff';

                    return (
                      <article
                        key={article.id}
                        className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs hover:shadow-md hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between ${
                          isRemoving ? 'opacity-40 pointer-events-none' : ''
                        }`}
                      >
                        <div>
                          {/* Image Cover Container */}
                          <div className="relative aspect-[16/9] w-full overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0">
                            <Link to={articleUrl} className="block w-full h-full">
                              {article.coverImageUrl ? (
                                <img
                                  src={normalizeMediaUrl(article.coverImageUrl)}
                                  alt={article.coverImageAlt || article.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-blue-900 flex flex-col items-center justify-center p-6 text-white text-center">
                                  <BookOpen className="w-8 h-8 opacity-30 mb-2" />
                                  <span className="text-[11px] uppercase tracking-wider font-semibold text-blue-200/80">
                                    Research Factors
                                  </span>
                                </div>
                              )}
                            </Link>

                            {/* Category Pill Tag */}
                            {article.category?.name && (
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase bg-white/95 dark:bg-slate-900/90 text-blue-600 dark:text-blue-400 backdrop-blur-xs shadow-xs border border-white/20 dark:border-slate-800/80 pointer-events-none">
                                {article.category.name}
                              </span>
                            )}

                            {/* Unbookmark / Remove Button */}
                            <button
                              type="button"
                              onClick={(e) => handleRemoveBookmark(e, article.id)}
                              disabled={isRemoving}
                              title="Remove from Saved Research"
                              className="absolute top-3 right-3 p-2 rounded-xl bg-white/95 dark:bg-slate-900/90 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-400 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 border border-slate-200/60 dark:border-slate-700/60 shadow-xs backdrop-blur-xs transition-colors z-10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Article Body */}
                          <div className="p-5">
                            {/* Meta: Reading Time & Published Date */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mb-2.5">
                              {article.readingTimeMin && (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {article.readingTimeMin} min read
                                </span>
                              )}
                              {formattedDate && (
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-slate-400" />
                                  {formattedDate}
                                </span>
                              )}
                            </div>

                            {/* Article Title */}
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-snug mb-2">
                              <Link to={articleUrl}>{article.title}</Link>
                            </h3>

                            {/* Subtitle / Excerpt */}
                            {(article.subtitle || article.excerpt) && (
                              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                                {article.subtitle || article.excerpt}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Article Footer */}
                        <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                          {/* Author Info */}
                          <div className="flex items-center space-x-2 truncate pr-2">
                            {article.author?.user?.avatarUrl ? (
                              <img
                                src={normalizeMediaUrl(article.author.user.avatarUrl)}
                                alt={authorName}
                                className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center text-[10px] shrink-0 border border-slate-200 dark:border-slate-700">
                                {authorName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
                              {authorName}
                            </span>
                          </div>

                          {/* Read Link */}
                          <Link
                            to={articleUrl}
                            className="inline-flex items-center gap-1 font-semibold text-[11px] text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 shrink-0 transition-colors"
                          >
                            <span>Read</span>
                            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                          </Link>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </AdminLayout>
  );
}
