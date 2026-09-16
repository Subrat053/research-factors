import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { articlesApi } from '../../services/articles.api.js';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { CardSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { Sparkles, ArrowRight, TrendingUp, Compass, PenTool, CheckCircle2 } from 'lucide-react';

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState(null);

  // 1. Fetch Featured Article for Hero Masthead
  const { data: featuredData, isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['featured-article'],
    queryFn: () => articlesApi.getFeaturedArticle()
  });

  // 2. Fetch Published Articles
  const { data: articlesData, isLoading: isArticlesLoading } = useQuery({
    queryKey: ['articles', { category: selectedCategory }],
    queryFn: () => articlesApi.getArticles({ limit: 7, category: selectedCategory })
  });

  // 3. Fetch Trending Articles
  const { data: trendingData, isLoading: isTrendingLoading } = useQuery({
    queryKey: ['trending'],
    queryFn: () => articlesApi.getTrending()
  });

  // 4. Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => articlesApi.getCategories()
  });

  const articles = articlesData?.data?.items || [];
  const trending = trendingData?.data || [];
  const categories = categoriesData?.data || [];

  const featuredArticle = featuredData?.data || articles[0] || null;
  const standardArticles = articles.filter(a => a.id !== featuredArticle?.id);

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header />

      <main className="flex-1">
        {/* 1. HERO MASTHEAD SECTION (Ghost & Brightspot Style) */}
        <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24 border-b border-paper-border bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto">
              {/* Announcement Pill */}
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rfblue-50 text-rfblue border border-rfblue-100 shadow-2xs mb-8 hover:bg-rfblue-100/60 transition-colors">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Empirical Benchmarking & Analysis</span>
                <span className="text-rfblue-600">→</span>
              </div>

              {/* Bold Editorial Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-bold tracking-tight text-ink-darkest leading-[1.08]">
                Research that helps you understand the world.
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-ink-muted leading-relaxed font-light max-w-2xl mx-auto">
                Explore in-depth technical analysis, empirical reviews, semiconductor benchmarks, and academic perspectives.
              </p>

              {/* Hero CTA Buttons */}
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/research"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-semibold text-white bg-rfblue hover:bg-rfblue-700 shadow-sm transition-all group"
                >
                  <span>Explore Research Library</span>
                  <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-full text-sm font-semibold text-ink bg-paper hover:bg-paper-warm border border-paper-border transition-colors"
                >
                  Become an Author
                </Link>
              </div>
            </div>

            {/* Featured Article Card */}
            <div className="mt-14 max-w-6xl mx-auto">
              {isFeaturedLoading && !featuredArticle ? (
                <div className="h-96 rounded-3xl bg-paper-border/60 animate-pulse" />
              ) : featuredArticle ? (
                <ArticleCard article={featuredArticle} variant="featured" />
              ) : null}
            </div>
          </div>
        </section>

        {/* 2. LATEST RESEARCH + TRENDING SPLIT SECTION */}
        <section className="py-16 lg:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Left 8 Cols: Latest Research Grid */}
            <div className="lg:col-span-8">
              {/* Category Filter Pills */}
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-paper-border">
                <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                      selectedCategory === null
                        ? 'bg-ink-darkest text-white shadow-xs'
                        : 'bg-white border border-paper-border text-ink-muted hover:text-ink'
                    }`}
                  >
                    All Research
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.slug)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
                        selectedCategory === cat.slug
                          ? 'bg-ink-darkest text-white shadow-xs'
                          : 'bg-white border border-paper-border text-ink-muted hover:text-ink'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <Link
                  to="/research"
                  className="hidden sm:inline-flex items-center text-xs font-bold text-rfblue hover:text-rfblue-700"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>
              </div>

              {/* Grid */}
              {isArticlesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                  <CardSkeleton />
                </div>
              ) : standardArticles.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {standardArticles.map((article) => (
                    <ArticleCard key={article.id} article={article} variant="standard" />
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No articles in this domain"
                  description="Be the first fellow to publish empirical research in this category."
                />
              )}
            </div>

            {/* Right 4 Cols: Trending Sidebar & Topics */}
            <div className="lg:col-span-4 space-y-10">
              {/* Trending Widget */}
              <div className="bg-white rounded-3xl border border-paper-border p-6 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-ink-darkest mb-4">
                  <TrendingUp className="w-4 h-4 text-rfblue" />
                  <span>Trending Research</span>
                </div>
                <div className="divide-y divide-paper-border/60">
                  {isTrendingLoading ? (
                    <div className="space-y-4 py-2 animate-pulse">
                      <div className="h-12 bg-paper-border/50 rounded" />
                      <div className="h-12 bg-paper-border/50 rounded" />
                      <div className="h-12 bg-paper-border/50 rounded" />
                    </div>
                  ) : trending.length > 0 ? (
                    trending.map((item) => (
                      <ArticleCard key={item.id} article={item} variant="compact" />
                    ))
                  ) : (
                    <p className="text-xs text-ink-light py-4">No trending articles yet.</p>
                  )}
                </div>
              </div>

              {/* Categories Explorer */}
              <div className="bg-white rounded-3xl border border-paper-border p-6 shadow-xs">
                <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-ink-darkest mb-4">
                  <Compass className="w-4 h-4 text-rfblue" />
                  <span>Explore Research Topics</span>
                </div>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <Link
                      key={cat.id}
                      to={`/research?category=${cat.slug}`}
                      className="group flex items-center justify-between p-3 rounded-xl hover:bg-paper transition-colors"
                    >
                      <div>
                        <h4 className="text-sm font-semibold text-ink-darkest group-hover:text-rfblue transition-colors">
                          {cat.name}
                        </h4>
                        <p className="text-xs text-ink-light line-clamp-1">{cat.description}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-paper border border-paper-border text-ink-muted">
                        {cat._count?.articles || 0}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. AUTHOR RECRUITMENT CALLOUT (Ghost Style) */}
        <section className="bg-ink-darkest text-white py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rfblue flex items-center justify-center mx-auto mb-6 shadow-lg">
              <PenTool className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight leading-tight">
              Have rigorous research worth publishing?
            </h2>
            <p className="mt-4 text-base sm:text-lg text-ink-light max-w-xl mx-auto font-light leading-relaxed">
              Join leading engineers, scientists, and analysts who publish structured articles, comparisons, and empirical datasets with open community discussion.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/register"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-sm bg-white text-ink-darkest hover:bg-paper transition-colors shadow-md"
              >
                Apply as Author
              </Link>
              <Link
                to="/about"
                className="w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-sm border border-slate-700 text-white hover:bg-slate-800 transition-colors"
              >
                Our Editorial Standards
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
