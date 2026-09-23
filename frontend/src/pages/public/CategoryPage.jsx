import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { articlesApi } from '../../services/articles.api.js';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { CardSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { EmptyState } from '../../components/feedback/EmptyState.jsx';
import { Compass, ChevronRight } from 'lucide-react';

export default function CategoryPage() {
  const { categorySlug } = useParams();

  const { data: categoryData } = useQuery({
    queryKey: ['category', categorySlug],
    queryFn: () => articlesApi.getCategoryBySlug(categorySlug)
  });

  const { data: articlesData, isLoading } = useQuery({
    queryKey: ['articles', { category: categorySlug }],
    queryFn: () => articlesApi.getArticles({ category: categorySlug, limit: 12 })
  });

  const category = categoryData?.data;
  const articles = articlesData?.data?.items || [];

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-xs text-ink-light mb-8">
          <Link to="/" className="hover:text-rfblue">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link to="/research" className="hover:text-rfblue">Research</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-ink-darkest font-medium">{category?.name || categorySlug}</span>
        </nav>

        {/* Hero Banner */}
        <div className="bg-white rounded-3xl border border-paper-border p-8 sm:p-12 mb-12 shadow-xs">
          <div className="max-w-3xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rfblue-50 text-rfblue mb-4 border border-rfblue-100">
              <Compass className="w-3.5 h-3.5" />
              <span>Research Field</span>
            </div>
            <h1 className="text-ink-darkest">
              {category?.name || categorySlug}
            </h1>
            <p className="mt-4 text-lead">
              {category?.description || 'Curated peer-reviewed publications and technical analyses.'}
            </p>
          </div>
        </div>

        {/* Articles Feed */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : articles.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {articles.map(article => (
              <ArticleCard key={article.id} article={article} variant="standard" />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No research in this field yet"
            description="Our fellows are currently reviewing submissions for this topic."
          />
        )}
      </main>

      <Footer />
    </div>
  );
}
