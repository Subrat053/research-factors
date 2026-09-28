import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  TrendingUp,
  Clock,
  Sparkles,
  RefreshCw,
  Mail,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { articlesApi } from '../../services/articles.api.js';
import { seoApi } from '../../services/seo.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { EditorialSponsorAd } from '../../components/sponsorship/EditorialSponsorAd.jsx';

/**
 * Calculates internal popularity score for ranking trending stories
 * Combines views, comments, featured weight, and publication recency
 */
function calculateTrendingScore(article) {
  if (!article) return 0;
  const views = Number(article.viewCount) || 0;
  const comments = Number(article.commentCount || article._count?.comments) || 0;
  const isFeatured = article.isFeatured ? 60 : 0;
  
  // Recency bonus: articles published within 14 days receive decaying boost
  const pubTime = article.publishedAt ? new Date(article.publishedAt).getTime() : 0;
  const ageHours = pubTime > 0 ? Math.max(1, (Date.now() - pubTime) / (1000 * 60 * 60)) : 720;
  const recencyBonus = Math.max(0, 120 - ageHours * 0.35);

  return views * 1.5 + comments * 12 + isFeatured + recencyBonus;
}

/**
 * Helper to pull N unique articles from an array, avoiding IDs already shown
 */
function getUniqueArticles(articles, usedIdsSet, count = 1) {
  const selected = [];
  for (const item of articles) {
    if (!item || !item.id || usedIdsSet.has(item.id)) continue;
    usedIdsSet.add(item.id);
    selected.push(item);
    if (selected.length === count) break;
  }
  return selected;
}

export default function TrendingPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'all';

  // Local pagination for "Latest Research" section
  const [latestPage, setLatestPage] = useState(1);
  const [loadedArticles, setLoadedArticles] = useState([]);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // 1. Fetch Categories for Filter Strip
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories(),
    staleTime: 1000 * 60 * 15
  });
  const categories = categoriesData?.data || [];

  // 2. Fetch Trending Candidate Articles (pool of top candidates)
  const {
    data: trendingData,
    isLoading: isTrendingLoading,
    isError: isTrendingError,
    refetch: refetchTrending
  } = useQuery({
    queryKey: ['trending-pool', activeCategory],
    queryFn: () =>
      articlesApi.getArticles({
        sort: 'popular',
        category: activeCategory !== 'all' ? activeCategory : undefined,
        limit: 25
      })
  });

  // 3. Fetch Latest Articles for 70% stream
  const {
    data: latestData,
    isLoading: isLatestLoading,
    isFetching: isLatestFetching
  } = useQuery({
    queryKey: ['latest-research', activeCategory, latestPage],
    queryFn: () =>
      articlesApi.getArticles({
        sort: 'latest',
        category: activeCategory !== 'all' ? activeCategory : undefined,
        page: latestPage,
        limit: 6
      })
  });

  // Keep accumulator of loaded latest articles across pagination
  React.useEffect(() => {
    if (latestData?.data?.items) {
      if (latestPage === 1) {
        setLoadedArticles(latestData.data.items);
      } else {
        setLoadedArticles((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newItems = latestData.data.items.filter((a) => !existingIds.has(a.id));
          return [...prev, ...newItems];
        });
      }
    }
  }, [latestData, latestPage]);

  // Reset pagination on category change
  const handleCategoryChange = (categorySlug) => {
    setLatestPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (categorySlug === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', categorySlug);
    }
    setSearchParams(newParams);
  };

  // 4. Fetch Resolved SEO
  const { data: seoResponse } = useQuery({
    queryKey: ['seo', 'page', 'trending'],
    queryFn: () => seoApi.resolveSeo({ type: 'PAGE', id: 'trending' }),
    staleTime: 1000 * 60 * 15
  });
  const pageSeo = seoResponse?.data || null;

  // 5. Intelligent Ranking & Deduplication Logic
  const {
    featuredHeroArticle,
    supportingTrendingArticles,
    editorsPicks,
    latestResearchArticles,
    mostReadArticles
  } = useMemo(() => {
    const rawTrendingPool = trendingData?.data?.items || trendingData?.data || [];
    
    // Sort pool by trendingScore
    const scoredPool = [...rawTrendingPool].sort((a, b) => {
      const scoreA = calculateTrendingScore(a);
      const scoreB = calculateTrendingScore(b);
      return scoreB - scoreA;
    });

    const usedIds = new Set();

    // 1 Hero Article (highest trending)
    const heroList = getUniqueArticles(scoredPool, usedIds, 1);
    const hero = heroList[0] || null;

    // 3 Supporting Trending Stories
    const supporting = getUniqueArticles(scoredPool, usedIds, 3);

    // 3 Editor's Picks
    // Prioritize articles with isFeatured or high score from remaining pool
    const picks = getUniqueArticles(scoredPool, usedIds, 3);

    // Most Read Ranked 1 to 5
    // Top remaining by view count
    const remainingByViews = [...scoredPool]
      .filter((a) => !usedIds.has(a.id))
      .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    
    const mostRead = getUniqueArticles(remainingByViews, new Set(usedIds), 5);

    // Latest Research stream from accumulator (strictly excluding any hero/picks/mostRead)
    const latest = loadedArticles.filter((a) => a.id !== hero?.id && !supporting.some(s => s.id === a.id));

    return {
      featuredHeroArticle: hero,
      supportingTrendingArticles: supporting,
      editorsPicks: picks,
      latestResearchArticles: latest,
      mostReadArticles: mostRead
    };
  }, [trendingData, loadedArticles]);

  const pagination = latestData?.data?.pagination || { page: 1, totalPages: 1 };
  const canLoadMore = latestPage < pagination.totalPages;

  // Newsletter handler
  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (newsletterEmail && newsletterEmail.includes('@')) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
      setTimeout(() => setNewsletterSubscribed(false), 5000);
    }
  };

  const cleanCanonical =
    typeof window !== 'undefined'
      ? `${window.location.origin}/trending`
      : 'https://researchfactors.com/trending';

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-rfblue-100 selection:text-rfblue">
      {/* Dynamic SEO */}
      <SeoHead
        seo={pageSeo}
        title="Trending Research & Articles | Research Factors"
        description="Discover the peer-reviewed articles, empirical benchmarks, and analytical investigations currently gaining reader attention across Research Factors."
        canonicalUrl={cleanCanonical}
        robots="index, follow"
      />

      {/* Main Header */}
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 space-y-10 sm:space-y-12">
        {/* ==================================================
            A. PAGE HEADER / INTRODUCTION
            ================================================== */}
        <header className="border-b border-paper-border pb-6 sm:pb-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="max-w-3xl">
              <div className="inline-flex items-center space-x-2 text-xs font-bold uppercase tracking-widest text-rfblue mb-2.5">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Trending Intelligence</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ink-darkest font-serif leading-tight">
                What Readers Are Researching
              </h1>
              <p className="mt-2 text-xs sm:text-sm lg:text-base text-ink-muted leading-relaxed">
                Discover the articles, comparisons, analysis, and ideas currently getting attention across Research Factors.
              </p>
            </div>

            {/* Editorial Metadata Badges */}
            <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-ink-light shrink-0">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-paper-border shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
                Updated regularly
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-paper-border shadow-2xs">
                Research & Analysis
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white border border-paper-border shadow-2xs">
                Multi-disciplinary
              </span>
            </div>
          </div>
        </header>

        {/* ==================================================
            ERROR STATE
            ================================================== */}
        {isTrendingError && (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-white border border-red-200 shadow-xs max-w-xl mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-ink-darkest mb-1.5">
              We couldn't load trending articles right now
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mb-5">
              Our team is analyzing the latest research metrics. Please try reloading the feed.
            </p>
            <button
              onClick={() => refetchTrending()}
              className="inline-flex items-center px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 transition-colors shadow-xs"
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try Again
            </button>
          </div>
        )}

        {/* ==================================================
            LOADING SKELETON
            ================================================== */}
        {isTrendingLoading && !isTrendingError && (
          <div className="space-y-10 animate-pulse">
            {/* Hero Asymmetric Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 bg-white rounded-2xl border border-paper-border p-6 h-[460px] flex flex-col justify-between">
                <div className="w-full h-64 bg-slate-200 rounded-xl mb-4" />
                <div className="space-y-2.5">
                  <div className="w-24 h-4 bg-slate-200 rounded" />
                  <div className="w-3/4 h-7 bg-slate-200 rounded" />
                  <div className="w-full h-4 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="lg:col-span-5 grid grid-rows-3 gap-3.5 sm:gap-4 h-full">
                {[1, 2, 3].map((key) => (
                  <div key={key} className="bg-white rounded-xl border border-paper-border overflow-hidden h-[130px] flex items-stretch">
                    <div className="w-[38%] bg-slate-200 shrink-0 h-full" />
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <div className="w-16 h-3 bg-slate-200 rounded" />
                      <div className="w-full h-4 bg-slate-200 rounded" />
                      <div className="w-2/3 h-3 bg-slate-200 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================
            EMPTY STATE
            ================================================== */}
        {!isTrendingLoading && !isTrendingError && !featuredHeroArticle && (
          <div className="p-10 sm:p-16 text-center rounded-2xl bg-white border border-paper-border shadow-xs max-w-xl mx-auto my-12">
            <div className="w-12 h-12 rounded-full bg-rfblue-50 text-rfblue flex items-center justify-center mx-auto mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-ink-darkest mb-2 font-serif">
              No trending research yet
            </h2>
            <p className="text-xs sm:text-sm text-ink-muted mb-6 leading-relaxed">
              Explore the latest published research and discover empirical benchmarks across Research Factors.
            </p>
            <Link
              to="/research"
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 transition-colors shadow-xs"
            >
              Explore Latest Articles
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        )}

        {/* ==================================================
            MAIN CONTENT WHEN LOADED
            ================================================== */}
        {!isTrendingLoading && !isTrendingError && featuredHeroArticle && (
          <>
            {/* ==================================================
                B. FEATURED TRENDING STORIES (Asymmetric 60/40 Grid)
                ================================================== */}
            <section aria-labelledby="featured-trending-heading">
              <h2 id="featured-trending-heading" className="sr-only">
                Featured Trending Stories
              </h2>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
                {/* LEFT: 1 Large Featured Article (~58-60% width) */}
                <div className="lg:col-span-7 flex flex-col">
                  <ArticleCard
                    article={featuredHeroArticle}
                    variant="trendingHero"
                    className="w-full"
                  />
                </div>

                {/* RIGHT: 3 Supporting Articles (~40-42% width) */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-3 sm:gap-3.5">
                  {supportingTrendingArticles.map((article, idx) => (
                    <div key={article.id} className="flex-1 min-h-0">
                      <ArticleCard
                        article={article}
                        variant="trendingSecondary"
                        rank={idx + 2}
                        className="h-full"
                      />
                    </div>
                  ))}
                  {/* Graceful fallback if fewer than 3 supporting articles */}
                  {supportingTrendingArticles.length === 0 && (
                    <div className="p-8 text-center rounded-xl bg-white border border-paper-border h-full flex flex-col items-center justify-center">
                      <p className="text-xs text-ink-muted">Additional trending research is being aggregated.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ==================================================
                C. TRENDING CATEGORY STRIP
                ================================================== */}
            <section
              aria-label="Filter trending by category"
              className="pt-2 pb-2 border-y border-paper-border"
            >
              <div className="flex items-center justify-between gap-3">
                <span className="hidden md:inline-flex text-xs font-bold uppercase tracking-wider text-ink-light shrink-0">
                  Filter Topics:
                </span>
                <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth py-1 w-full">
                  {/* "All" category button */}
                  <button
                    onClick={() => handleCategoryChange('all')}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                      activeCategory === 'all'
                        ? 'bg-rfblue text-white shadow-xs'
                        : 'bg-white border border-paper-border text-ink-muted hover:border-rfblue/40 hover:text-ink-darkest'
                    }`}
                  >
                    All Disciplines
                  </button>

                  {/* Dynamic Category List */}
                  {categories.map((cat) => (
                    <button
                      key={cat.id || cat.slug}
                      onClick={() => handleCategoryChange(cat.slug)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 ${
                        activeCategory === cat.slug
                          ? 'bg-rfblue text-white shadow-xs'
                          : 'bg-white border border-paper-border text-ink-muted hover:border-rfblue/40 hover:text-ink-darkest'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* ==================================================
                D. EDITOR'S PICKS (3-Column Card Grid)
                ================================================== */}
            {editorsPicks.length > 0 && (
              <section aria-labelledby="editors-picks-heading">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 pb-3 border-b border-paper-border">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rfblue block mb-1">
                      Selected Research
                    </span>
                    <h2
                      id="editors-picks-heading"
                      className="text-xl sm:text-2xl font-bold tracking-tight text-ink-darkest font-serif"
                    >
                      Editor's Picks
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-ink-light mt-1 sm:mt-0">
                    Rigorous analysis and empirical discoveries worth your attention.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editorsPicks.map((pick) => (
                    <ArticleCard
                      key={pick.id}
                      article={pick}
                      variant="editorialPick"
                      className="h-full"
                    />
                  ))}
                </div>
              </section>
            )}

            {/* ==================================================
                E & F. LATEST RESEARCH (70%) + MOST READ & SPONSORSHIP (30%)
                ================================================== */}
            <section
              aria-labelledby="latest-research-heading"
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 pt-4"
            >
              {/* LEFT COLUMN: LATEST RESEARCH (~68-70%) */}
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between pb-3 border-b border-paper-border">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-rfblue block mb-1">
                      Chronological Index
                    </span>
                    <h2
                      id="latest-research-heading"
                      className="text-xl sm:text-2xl font-bold tracking-tight text-ink-darkest font-serif"
                    >
                      Latest Research
                    </h2>
                  </div>
                  <span className="text-xs text-ink-light font-medium">
                    {activeCategory !== 'all' ? `Filtered by ${activeCategory}` : 'All Publications'}
                  </span>
                </div>

                {/* List Cards */}
                <div className="space-y-4">
                  {latestResearchArticles.map((article) => (
                    <ArticleCard
                      key={article.id}
                      article={article}
                      variant="latestList"
                    />
                  ))}

                  {latestResearchArticles.length === 0 && !isLatestLoading && (
                    <div className="p-8 text-center rounded-xl bg-white border border-paper-border">
                      <p className="text-xs sm:text-sm text-ink-muted">
                        No additional articles found for this topic filter.
                      </p>
                    </div>
                  )}
                </div>

                {/* Load More Button */}
                {canLoadMore && (
                  <div className="pt-4 text-center">
                    <button
                      onClick={() => setLatestPage((p) => p + 1)}
                      disabled={isLatestFetching}
                      className="inline-flex items-center justify-center px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-ink-darkest bg-white hover:bg-paper-card border border-paper-border hover:border-rfblue/40 transition-all shadow-2xs disabled:opacity-50"
                    >
                      {isLatestFetching ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin text-rfblue" />
                          <span>Loading More Research...</span>
                        </>
                      ) : (
                        <>
                          <span>Load More Research</span>
                          <ArrowRight className="w-4 h-4 ml-1.5" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* RIGHT SIDEBAR: MOST READ & SPONSORSHIP UNIT (~30-32%) */}
              <aside className="lg:col-span-4 space-y-8" aria-label="Sidebar highlights">
                {/* Most Read Ranked List */}
                <div className="bg-white rounded-2xl border border-paper-border p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-paper-border">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-rfblue" />
                      <h3 className="text-sm font-bold uppercase tracking-wider text-ink-darkest">
                        Most Read
                      </h3>
                    </div>
                    <span className="text-[11px] text-ink-light">Top Interest</span>
                  </div>

                  <div className="divide-y divide-paper-border/60">
                    {mostReadArticles.map((article, idx) => (
                      <ArticleCard
                        key={article.id}
                        article={article}
                        variant="mostRead"
                        rank={idx + 1}
                      />
                    ))}

                    {mostReadArticles.length === 0 && (
                      <p className="text-xs text-ink-muted py-4 text-center">
                        Trending ranking in progress.
                      </p>
                    )}
                  </div>
                </div>

                {/* SPONSORSHIP AD UNIT */}
                <EditorialSponsorAd />
              </aside>
            </section>

            {/* ==================================================
                G. RESEARCH / EDITORIAL TRUST ELEMENT
                ================================================== */}
            <section
              aria-labelledby="trust-element-heading"
              className="rounded-2xl bg-white border border-paper-border p-6 sm:p-8 lg:p-10 shadow-xs"
            >
              <div className="max-w-3xl mb-8">
                <span className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-widest text-rfblue mb-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Research Factors Charter</span>
                </span>
                <h2
                  id="trust-element-heading"
                  className="text-xl sm:text-2xl font-bold tracking-tight text-ink-darkest font-serif"
                >
                  Research-Driven Content for High-Stakes Decisions
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed">
                  Designed to help engineers, executives, and researchers understand products, technologies, companies, and ideas with rigorous empirical backing.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-paper-border">
                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 border border-rfblue-100">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-darkest mb-1">
                      Research-Backed
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Every insight is supported by primary datasets, reproducible benchmarks, and literature citations.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 border border-rfblue-100">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-darkest mb-1">
                      Clear Comparisons
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Systematic head-to-head parameter evaluations without promotional ambiguity or inflated claims.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3.5">
                  <div className="w-9 h-9 rounded-xl bg-rfblue-50 text-rfblue flex items-center justify-center shrink-0 border border-rfblue-100">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-ink-darkest mb-1">
                      Independent Governance
                    </h3>
                    <p className="text-xs text-ink-muted leading-relaxed">
                      Strict editorial separation: commercial sponsorships are transparently declared and peer-reviewed.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ==================================================
                H. NEWSLETTER / RESEARCH UPDATES
                ================================================== */}
            <section
              aria-labelledby="newsletter-heading"
              className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-rfblue-950 text-white p-6 sm:p-10 lg:p-12 shadow-md overflow-hidden relative"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-rfblue/15 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8 lg:gap-12">
                {/* Left Column: Heading & Description */}
                <div className="max-w-xl">
                  <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider bg-white/10 text-rfblue-200 border border-white/15 mb-3">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Research Dispatch</span>
                  </div>
                  <h2
                    id="newsletter-heading"
                    className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-white font-serif leading-snug"
                  >
                    Stay Ahead of What Matters
                  </h2>
                  <p className="mt-2 text-xs sm:text-sm text-slate-300 leading-relaxed">
                    Get new research publications, rigorous comparisons, and important developments delivered directly to your inbox every week.
                  </p>
                </div>

                {/* Right Column: Input & Action */}
                <div className="w-full lg:max-w-md xl:max-w-lg shrink-0">
                  {newsletterSubscribed ? (
                    <div className="flex items-center space-x-2 text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 rounded-xl px-4 py-3 text-xs sm:text-sm shadow-xs">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>Thank you for subscribing! Check your inbox for confirmation.</span>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleNewsletterSubmit}
                      className="flex flex-col sm:flex-row gap-3 w-full"
                    >
                      <input
                        type="email"
                        required
                        placeholder="Enter your professional email"
                        value={newsletterEmail}
                        onChange={(e) => setNewsletterEmail(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl text-xs sm:text-sm text-ink-darkest bg-white border border-transparent focus:outline-none focus:ring-2 focus:ring-rfblue shadow-xs min-w-0"
                        aria-label="Email address for research updates"
                      />
                      <button
                        type="submit"
                        className="px-6 py-3 rounded-xl text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-600 active:bg-rfblue-700 transition-colors shadow-xs shrink-0 cursor-pointer"
                      >
                        Subscribe
                      </button>
                    </form>
                  )}

                  <p className="mt-3 text-[11px] text-slate-400">
                    Zero spam. Unsubscribe anytime. Strictly peer-reviewed research updates.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* Main Footer */}
      <Footer />
    </div>
  );
}
