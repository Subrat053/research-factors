import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Bookmark, Sparkles } from 'lucide-react';
import { bookmarksApi } from '../../services/bookmarks.api.js';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { ArticleListSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { Link } from 'react-router-dom';

export default function BookmarksPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['bookmarks'],
    queryFn: () => bookmarksApi.getBookmarks()
  });

  const articles = data?.data || [];

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Helmet>
        <title>Saved Bookmarks — Research Factors</title>
        <meta name="description" content="Access your saved articles and research investigations." />
      </Helmet>

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="border-b border-paper-border pb-8 mb-10">
          <div className="flex items-center space-x-2 text-eyebrow text-rfblue mb-2">
            <Bookmark className="w-4 h-4" />
            <span>Reading Library</span>
          </div>
          <h1 className="text-ink-darkest">
            Saved Articles & Research
          </h1>
          <p className="text-sm sm:text-base text-ink-muted mt-2 max-w-xl">
            Your personal collection of peer-reviewed articles, comparisons, and investigations.
          </p>
        </div>

        {isLoading ? (
          <ArticleListSkeleton count={4} />
        ) : error ? (
          <EmptyState
            title="Failed to Load Bookmarks"
            description="We encountered an error retrieving your reading library. Please try again."
            actionText="Refresh"
            actionHref="/bookmarks"
          />
        ) : articles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-paper-border p-12">
            <div className="w-16 h-16 rounded-2xl bg-rfblue-50 text-rfblue mx-auto flex items-center justify-center mb-4">
              <Bookmark className="w-8 h-8" />
            </div>
            <h3 className="text-card-title text-ink-darkest mb-2">
              No Saved Articles Yet
            </h3>
            <p className="text-sm text-ink-muted max-w-sm mx-auto mb-6">
              When you discover research you want to reference later, click the bookmark icon on any article.
            </p>
            <Link
              to="/research"
              className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-700 transition-colors shadow-sm"
            >
              Explore Research Archive
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
