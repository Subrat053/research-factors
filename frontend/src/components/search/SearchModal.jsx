import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  BookOpen,
  Clock,
  Newspaper,
  Sparkles,
  TrendingUp,
  Flame,
  CornerDownLeft,
  Tag
} from 'lucide-react';
import { searchApi } from '../../services/articles.api.js';
import {
  getRecentSearches,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  getLastSearchContext
} from '../../utils/searchHistory.js';

const ARTICLE_TYPES = ['ALL', 'RESEARCH', 'ANALYSIS', 'REVIEW', 'GUIDE', 'COMPARISON'];

export function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const inputRef = useRef(null);
  const resultsContainerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches on modal open or storage update
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(getRecentSearches());
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setSelectedType('ALL');
      setResults([]);
      setSelectedIndex(-1);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }
  }, [isOpen]);

  // Synchronize recent searches across local storage updates
  useEffect(() => {
    const handleRecentUpdate = (e) => {
      if (e.detail) {
        setRecentSearches(e.detail);
      } else {
        setRecentSearches(getRecentSearches());
      }
    };

    window.addEventListener('rf_recent_searches_updated', handleRecentUpdate);
    return () => window.removeEventListener('rf_recent_searches_updated', handleRecentUpdate);
  }, []);

  // Determine last searched type/context to drive personalized recommendations
  const lastContext = useMemo(() => {
    return getLastSearchContext();
  }, [recentSearches]);

  const recommendedType = lastContext?.type || null;

  // 1. Trending Articles Query (In-Memory Server-Cached + TanStack Client-Cached 5m)
  const { data: trendingArticles = [], isLoading: isTrendingLoading } = useQuery({
    queryKey: ['search', 'trending'],
    queryFn: async () => {
      const res = await searchApi.getTrending({ limit: 5 });
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: isOpen && !query.trim(),
    staleTime: 5 * 60 * 1000 // 5 minutes client cache: 0 network hits on re-opening
  });

  // 2. Type-Tailored Recommendations Query (In-Memory Server-Cached + TanStack Client-Cached 5m)
  const { data: recommendedArticles = [], isLoading: isRecsLoading } = useQuery({
    queryKey: ['search', 'recommendations', recommendedType],
    queryFn: async () => {
      const res = await searchApi.getRecommendations({
        type: recommendedType || undefined,
        limit: 3
      });
      return Array.isArray(res) ? res : res?.data || [];
    },
    enabled: isOpen && !query.trim(),
    staleTime: 5 * 60 * 1000 // 5 minutes client cache
  });

  // 3. Debounced Live Search with AbortController to cancel stale in-flight requests
  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setIsSearching(false);
      setSelectedIndex(-1);
      return;
    }

    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const typeFilter = selectedType !== 'ALL' ? selectedType : undefined;
        const res = await searchApi.search(
          trimmed,
          { type: typeFilter, limit: 12 },
          { signal: controller.signal }
        );

        let data = [];
        if (Array.isArray(res)) {
          data = res;
        } else if (res?.data && Array.isArray(res.data)) {
          data = res.data;
        } else if (res?.items && Array.isArray(res.items)) {
          data = res.items;
        }

        setResults(data);
        setSelectedIndex(-1);
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setResults([]);
        }
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, selectedType]);

  if (!isOpen) return null;

  // Handle article selection
  const handleSelectArticle = (article) => {
    if (!article) return;

    // Record in local recent searches (Zero-DB latency)
    addRecentSearch(query.trim() || article.title, {
      type: article.type,
      categorySlug: article.category?.slug
    });

    // Fire-and-forget engagement click beacon
    searchApi.trackClick(article.id, query.trim());

    onClose();
    navigate(`/research/${article.slug}`);
  };

  // Handle clicking a recent search chip
  const handleSelectRecentSearch = (searchTerm) => {
    setQuery(searchTerm);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Handle removal of single recent search
  const handleRemoveRecent = (e, itemQuery) => {
    e.stopPropagation();
    removeRecentSearch(itemQuery);
  };

  // Handle clearing all recent searches
  const handleClearAllRecent = (e) => {
    e.stopPropagation();
    clearRecentSearches();
  };

  // Keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
      return;
    }

    if (query.trim().length >= 2 && results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectArticle(results[selectedIndex]);
        } else if (results.length > 0) {
          handleSelectArticle(results[0]);
        }
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-6 md:p-12">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-darkest/70 backdrop-blur-md transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className="relative mx-auto max-w-3xl transform rounded-2xl bg-white shadow-2xl border border-paper-border   transition-all overflow-hidden"
        onKeyDown={handleKeyDown}
      >
        {/* Search Bar Input */}
        <div className="relative flex items-center border-b border-paper-border  px-4 py-3.5 bg-paper/30 ">
          <Search className="w-5 h-5 text-rfblue-600   mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers, hypotheses, topics, or authors..."
            className="w-full bg-transparent text-sm sm:text-base text-ink   placeholder-ink-light/60 focus:outline-none font-sans"
            aria-label="Search articles"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 mr-2 text-ink-light hover:text-ink  transition-colors rounded-md"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[11px] font-semibold text-ink-light bg-paper  border border-paper-border   rounded-md shadow-sm">
            ESC
          </kbd>
        </div>

        {/* Filter Pills (Active when query is typed) */}
        {query.trim().length >= 2 && (
          <div className="flex items-center space-x-1 px-4 py-2 bg-paper/50  border-b border-paper-border   overflow-x-auto text-xs scrollbar-none">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-light/70 mr-1.5 shrink-0">
              Format:
            </span>
            {ARTICLE_TYPES.map((type) => {
              const isActive = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`px-2.5 py-1 rounded-full font-medium transition-all shrink-0 ${isActive
                    ? 'bg-rfblue-600 text-white shadow-sm'
                    : 'bg-white text-ink-muted hover:bg-paper  border border-paper-border  '
                    }`}
                >
                  {type === 'ALL' ? 'All Formats' : type.charAt(0) + type.slice(1).toLowerCase()}
                </button>
              );
            })}
          </div>
        )}

        {/* Content Area */}
        <div
          ref={resultsContainerRef}
          className="max-h-[68vh] sm:max-h-[30rem] overflow-y-auto p-4 sm:p-5 divide-y divide-paper-border"
        >
          {/* ================= STATE 1: ACTIVE LIVE SEARCH ================= */}
          {query.trim().length >= 2 ? (
            <div>
              {isSearching ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3 text-ink-muted  ">
                  <Loader2 className="w-6 h-6 animate-spin text-rfblue-600  " />
                  <p className="text-xs sm:text-sm font-medium">Scanning peer-reviewed research...</p>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-ink-light pb-2 px-1">
                    <span>{results.length} research {results.length === 1 ? 'article' : 'articles'} found</span>
                    <span className="hidden sm:inline text-[11px] text-ink-light/70">
                      Use ↑↓ and ↵ to select
                    </span>
                  </div>
                  {results.map((article, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <div
                        key={article.id}
                        onClick={() => handleSelectArticle(article)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`group flex items-start justify-between p-3.5 rounded-xl cursor-pointer transition-all border ${isSelected
                          ? 'bg-rfblue-50/70  border-rfblue-200 '
                          : 'hover:bg-paper  border-transparent'
                          }`}
                      >
                        <div className="flex items-start space-x-3.5 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-rfblue-50   text-rfblue-600   flex items-center justify-center shrink-0 mt-0.5 border border-rfblue-100 ">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-wider mb-1">
                              {article.type && (
                                <span className="text-rfblue-700   bg-rfblue-50  px-1.5 py-0.5 rounded border border-rfblue-100 ">
                                  {article.type}
                                </span>
                              )}
                              {article.category?.name && (
                                <span className="text-ink-light  ">
                                  {article.category.name}
                                </span>
                              )}
                              <span className="text-ink-light/60">•</span>
                              <span className="text-ink-light/80 normal-case tracking-normal">
                                {article.readingTimeMin || 5} min read
                              </span>
                            </div>
                            <h4 className="text-sm sm:text-base font-bold text-ink-darkest group-hover:text-rfblue-600 transition-colors line-clamp-2">
                              {article.title}
                            </h4>
                            {article.excerpt && (
                              <p className="text-xs text-ink-muted/80 line-clamp-1 mt-1">
                                {article.excerpt}
                              </p>
                            )}
                          </div>
                        </div>
                        <ArrowRight
                          className={`w-4 h-4 text-ink-light transition-all shrink-0 ml-3 mt-2 ${isSelected
                            ? 'text-rfblue-600 translate-x-1 opacity-100'
                            : 'opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:text-rfblue-600'
                            }`}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <p className="text-sm font-semibold text-ink-darkest">
                    No articles found matching &ldquo;{query}&rdquo;
                  </p>
                  <p className="text-xs text-ink-light max-w-sm mx-auto">
                    Try searching for broader keywords such as &ldquo;quantum&rdquo;, &ldquo;semiconductor&rdquo;, &ldquo;microbiome&rdquo;, or reset the format filter.
                  </p>
                </div>
              )}
            </div>
          ) : query.trim().length === 1 ? (
            <div className="py-10 text-center text-xs text-ink-light">
              Type at least 2 characters to search across peer-reviewed papers, analyses, and monographs.
            </div>
          ) : (
            /* ================= STATE 2: ZERO-QUERY DASHBOARD ================= */
            <div className="space-y-6">
              {/* 1. Recent Searches (Zero-DB latency, Max 5, LocalStorage) */}
              {recentSearches.length > 0 && (
                <div>
                  <div className="flex items-center justify-between pb-2.5">
                    <div className="flex items-center text-xs font-semibold text-ink   uppercase tracking-wider">
                      <Clock className="w-3.5 h-3.5 text-ink-light mr-1.5" />
                      Recent Searches
                    </div>
                    <button
                      onClick={handleClearAllRecent}
                      className="text-[11px] text-ink-light hover:text-rfred-600   transition-colors font-medium"
                    >
                      Clear all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {recentSearches.slice(0, 5).map((item) => (
                      <div
                        key={item.id || item.query}
                        onClick={() => handleSelectRecentSearch(item.query)}
                        className="group inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-paper  /60 border border-paper-border   hover:border-rfblue-300  hover:bg-rfblue-50/50  cursor-pointer transition-all text-xs"
                      >
                        <Search className="w-3 h-3 text-ink-light group-hover:text-rfblue-600   transition-colors shrink-0" />
                        <span className="font-medium text-ink   group-hover:text-rfblue-600   transition-colors truncate max-w-[160px]">
                          {item.query}
                        </span>
                        {item.type && (
                          <span className="text-[9px] font-bold text-ink-light/70 uppercase tracking-tight bg-white   px-1 rounded border border-paper-border/60  ">
                            {item.type}
                          </span>
                        )}
                        <button
                          onClick={(e) => handleRemoveRecent(e, item.query)}
                          className="p-0.5 text-ink-light hover:text-rfred-600   transition-colors ml-0.5 rounded-full hover:bg-paper-border "
                          title="Remove item"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Personalized Recommendations based on Searched Type */}
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center space-x-1.5">
                    <Newspaper className="w-3.5 h-3.5 text-rfblue-600  " />
                    <span className="text-xs font-semibold text-ink   uppercase tracking-wider">
                      You may like
                    </span>
                    {/* {recommendedType && (
                      <span className="text-[10px] font-bold text-rfblue-600   bg-rfblue-50  px-1.5 py-0.5 rounded border border-rfblue-100 uppercase">
                        Based on {recommendedType.toLowerCase()}
                      </span>
                    )} */}
                  </div>
                </div>

                {isRecsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="animate-pulse p-3 rounded-xl border border-paper-border   bg-paper/40  /30 space-y-2"
                      >
                        <div className="h-3 w-16 bg-paper-border  -muted/40 rounded" />
                        <div className="h-4 w-full bg-paper-border  -muted/40 rounded" />
                        <div className="h-4 w-3/4 bg-paper-border  -muted/40 rounded" />
                      </div>
                    ))}
                  </div>
                ) : recommendedArticles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {recommendedArticles.slice(0, 3).map((article) => (
                      <div
                        key={article.id}
                        onClick={() => handleSelectArticle(article)}
                        className="group flex flex-col justify-between p-3.5 rounded-xl border border-paper-border   bg-white hover:border-rfblue-300  hover:bg-rfblue-50/20  cursor-pointer transition-all"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider text-rfblue-600  mb-1.5">
                            <span>{article.category?.name || article.type}</span>
                            <span className="text-ink-light normal-case tracking-normal">
                              {article.readingTimeMin || 5}m
                            </span>
                          </div>
                          <h4 className="text-xs sm:text-sm font-bold text-ink-darkest group-hover:text-rfblue-600 transition-colors line-clamp-2">
                            {article.title}
                          </h4>
                        </div>
                        <div className="flex items-center text-[11px] font-medium text-ink-light group-hover:text-rfblue-600 transition-colors mt-3">
                          <span>Read analysis</span>
                          <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-light italic">No recommendations available right now.</p>
                )}
              </div>

              {/* 3. Trending Articles (Most Read & Searched) */}
              <div>
                <div className="flex items-center justify-between pb-3">
                  <div className="flex items-center space-x-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                    <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                      Most people reading
                    </span>
                  </div>
                  {/* <span className="text-[11px] text-ink-light">Most read & searched</span> */}
                </div>

                {isTrendingLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className="animate-pulse flex items-center space-x-3 p-2.5 rounded-lg border border-paper-border bg-paper/40"
                      >
                        <div className="w-6 h-6 bg-paper-border rounded-full" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 w-1/4 bg-paper-border rounded" />
                          <div className="h-4 w-3/4 bg-paper-border rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : trendingArticles.length > 0 ? (
                  <div className="divide-y divide-paper-border/60">
                    {trendingArticles.slice(0, 4).map((article, idx) => (
                      <div
                        key={article.id}
                        onClick={() => handleSelectArticle(article)}
                        className="group flex items-center justify-between py-2.5 px-2 hover:bg-paper rounded-lg cursor-pointer transition-colors"
                      >
                        <div className="flex items-center space-x-3 min-w-0">
                          <span className="font-bold text-base sm:text-lg text-ink-light/40 group-hover:text-rfblue-600 transition-colors w-6 shrink-0 text-center">
                            0{idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center space-x-2 text-[10px] text-ink-light uppercase tracking-wider">
                              <span className="font-bold text-rfblue-600">
                                {article.category?.name || article.type}
                              </span>
                              <span>•</span>
                              <span>{article.readingTimeMin || 6} min read</span>
                              {article.viewCount > 0 && (
                                <>
                                  <span>•</span>
                                  <span className="flex items-center">
                                    <Flame className="w-3 h-3 text-amber-500 mr-0.5 inline" />
                                    {article.viewCount.toLocaleString()} reads
                                  </span>
                                </>
                              )}
                            </div>
                            <h4 className="text-xs sm:text-sm font-bold text-ink-darkest group-hover:text-rfblue-600 transition-colors line-clamp-1">
                              {article.title}
                            </h4>
                          </div>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-ink-light group-hover:text-rfblue-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-ink-light italic">No trending articles available.</p>
                )}
              </div>
            </div>
          )}
        </div>

        
      </div>
    </div>
  );
}
