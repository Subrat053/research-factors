import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../../services/articles.api.js';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { Header } from '../../components/layout/Header.jsx';
import { Footer } from '../../components/layout/Footer.jsx';
import { BlockRenderer } from '../../components/article/BlockRenderer.jsx';
import { ArticleCard } from '../../components/article/ArticleCard.jsx';
import { ShareBar } from '../../components/article/ShareBar.jsx';
import { TableOfContents } from '../../components/article/TableOfContents.jsx';
import { ReadingProgressBar } from '../../components/article/ReadingProgressBar.jsx';
import { DetailSkeleton } from '../../components/feedback/SkeletonLoader.jsx';
import { CommentSection } from '../../components/comments/CommentSection.jsx';
import { bookmarksApi } from '../../services/bookmarks.api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Clock, Calendar, ChevronRight, User, ShieldCheck } from 'lucide-react';

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getArticleBySlug(slug)
  });

  const article = data?.data || null;

  React.useEffect(() => {
    if (user && article?.id) {
      bookmarksApi.checkStatus(article.id)
        .then(res => setIsBookmarked(res.data?.bookmarked || false))
        .catch(() => {});
    }
  }, [user, article?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Header />
        <main className="flex-1">
          <DetailSkeleton />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-paper flex flex-col">
        <Header />
        <main className="flex-1 max-w-xl mx-auto px-4 py-24 text-center">
          <h2 className="text-3xl font-serif font-bold text-ink-darkest mb-3">Article Not Found</h2>
          <p className="text-sm text-ink-muted mb-6">
            The requested research publication could not be found or has been unpublished.
          </p>
          <Link
            to="/research"
            className="inline-flex items-center px-6 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-700"
          >
            Return to Research Archive
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const headings = (article.blocks || [])
    .filter(b => b.blockType === 'heading')
    .map(b => ({
      level: b.content?.level || 2,
      text: b.content?.text || ''
    }));

  const formattedDate = article.publishedAt
    ? new Date(article.publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
    : null;

  const handleBookmarkToggle = async () => {
    if (!user) {
      alert('Please sign in to save articles to your bookmarks');
      return;
    }
    try {
      const res = await bookmarksApi.toggleBookmark(article.id);
      setIsBookmarked(res.data?.bookmarked || false);
    } catch {
      alert('Failed to update bookmark');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      <Helmet>
        <title>{article.seoTitle || article.title} — Research Factors</title>
        <meta name="description" content={article.seoDescription || article.excerpt} />
        <meta property="og:title" content={article.title} />
        <meta property="og:description" content={article.excerpt} />
        {article.coverImageUrl && <meta property="og:image" content={normalizeMediaUrl(article.coverImageUrl)} />}
        {article.canonicalUrl && <link rel="canonical" href={article.canonicalUrl} />}
      </Helmet>

      {/* Reading Scroll Progress Bar */}
      <ReadingProgressBar />

      <Header />

      <main className="flex-1">
        {/* Article Header & Breadcrumbs */}
        <article className="pt-10 pb-20">
          <header className="max-w-4xl mx-auto px-4 sm:px-6">
            {/* Breadcrumb Navigation */}
            <nav className="flex items-center space-x-2 text-xs text-ink-light mb-6">
              <Link to="/" className="hover:text-rfblue">Home</Link>
              <ChevronRight className="w-3 h-3" />
              <Link to="/research" className="hover:text-rfblue">Research</Link>
              {article.category && (
                <>
                  <ChevronRight className="w-3 h-3" />
                  <Link
                    to={`/research?category=${article.category.slug}`}
                    className="hover:text-rfblue font-medium text-ink-muted"
                  >
                    {article.category.name}
                  </Link>
                </>
              )}
            </nav>

            {/* Category & Reading Badges */}
            <div className="flex items-center space-x-3 text-xs mb-6">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rfblue-50 text-rfblue border border-rfblue-100">
                {article.type || 'Research'}
              </span>
              <span className="flex items-center text-ink-light font-medium">
                <Clock className="w-3.5 h-3.5 mr-1" />
                {article.readingTimeMin} min read
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-ink-darkest leading-[1.12]">
              {article.title}
            </h1>

            {/* Subtitle / Excerpt */}
            {article.subtitle && (
              <p className="mt-6 text-lg sm:text-xl text-ink-muted leading-relaxed font-light">
                {article.subtitle}
              </p>
            )}

            {/* Author Meta & Share Header */}
            <div className="mt-8 pt-6 border-t border-paper-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-full bg-rfblue-50 border border-rfblue-100 flex items-center justify-center text-rfblue font-bold text-base shrink-0">
                  {article.author?.firstName?.[0] || 'A'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-ink-darkest flex items-center">
                    {article.author?.fullName}
                    <ShieldCheck className="w-4 h-4 text-rfblue ml-1.5" title="Verified Editorial Author" />
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-ink-light mt-0.5">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{article.author?.authorProfile?.headline || 'Research Fellow'}</span>
                  </div>
                </div>
              </div>

              <ShareBar
                title={article.title}
                onBookmark={handleBookmarkToggle}
                isBookmarked={isBookmarked}
              />
            </div>
          </header>

          {/* Hero Cover Image */}
          {article.coverImageUrl && (
            <figure className="max-w-5xl mx-auto px-4 sm:px-6 my-12">
              <div className="rounded-3xl overflow-hidden border border-paper-border shadow-md bg-paper max-h-[560px]">
                <img
                  src={normalizeMediaUrl(article.coverImageUrl)}
                  alt={article.coverImageAlt || article.title}
                  className="w-full h-full object-cover"
                />
              </div>
              {article.coverImageAlt && (
                <figcaption className="text-center text-xs text-ink-light mt-2.5 italic">
                  {article.coverImageAlt}
                </figcaption>
              )}
            </figure>
          )}

          {/* Core Content Grid (Prose + Sidebar) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Main Article Prose Column (68-72ch measure) */}
              <div className="lg:col-span-8 lg:col-start-2 max-w-prose mx-auto w-full">
                <BlockRenderer blocks={article.blocks} />

                {/* Article Footer & Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="mt-14 pt-8 border-t border-paper-border">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-ink-light mr-2">
                        Topics:
                      </span>
                      {article.tags.map(tag => (
                        <span
                          key={tag.id}
                          className="px-3 py-1 rounded-full text-xs font-medium bg-paper border border-paper-border text-ink-muted hover:text-rfblue cursor-pointer transition-colors"
                        >
                          #{tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Author Bio Card */}
                <div className="mt-14 p-8 rounded-3xl bg-white border border-paper-border shadow-xs flex items-start space-x-5">
                  <div className="w-14 h-14 rounded-2xl bg-rfblue-50 text-rfblue flex items-center justify-center font-bold text-lg border border-rfblue-100 shrink-0">
                    {article.author?.firstName?.[0] || 'A'}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-rfblue">
                      Author Biography
                    </span>
                    <h4 className="text-base font-bold text-ink-darkest mt-0.5">
                      {article.author?.fullName}
                    </h4>
                    <p className="text-xs text-ink-light mt-0.5">
                      {article.author?.authorProfile?.headline}
                    </p>
                    <p className="text-sm text-ink-muted mt-3 leading-relaxed font-light">
                      {article.author?.authorProfile?.biography || article.author?.bio}
                    </p>
                  </div>
                </div>

                {/* Dynamic Peer Discussion & Comments */}
                <CommentSection articleId={article.id} />
              </div>

              {/* Sticky Sidebar (Table of Contents & Share) */}
              <aside className="hidden lg:block lg:col-span-3 space-y-6">
                <div className="sticky top-28 space-y-6">
                  <TableOfContents headings={headings} />
                </div>
              </aside>
            </div>
          </div>
        </article>

        {/* Related Articles Section */}
        {article.related && article.related.length > 0 && (
          <section className="border-t border-paper-border bg-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-paper-border">
                <h3 className="text-2xl font-serif font-bold text-ink-darkest">
                  Related Research Publications
                </h3>
                <Link to="/research" className="text-xs font-bold text-rfblue hover:text-rfblue-700">
                  Explore More →
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {article.related.map(item => (
                  <ArticleCard key={item.id} article={item} variant="standard" />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
