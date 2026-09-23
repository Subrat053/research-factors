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
import { Clock, Calendar, ChevronRight, User, ShieldCheck, Sparkles } from 'lucide-react';

export default function ArticleDetailPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getArticleBySlug(slug)
  });

  const article = data?.data || null;

  // Dynamic fallback query if the article category has fewer than 4 related publications
  const { data: fallbackData } = useQuery({
    queryKey: ['related-fallback', article?.category?.slug],
    queryFn: () => articlesApi.getArticles({ category: article?.category?.slug, limit: 6 }),
    enabled: Boolean(article?.category?.slug && (!article.related || article.related.length < 4))
  });

  // Combine directly related articles with category fallback items, avoiding duplicates
  const directRelated = article?.related || [];
  const fallbackItems = (fallbackData?.data?.items || []).filter(
    item => item.id !== article?.id && !directRelated.some(r => r.id === item.id)
  );
  const relatedArticles = [...directRelated, ...fallbackItems].slice(0, 5);

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
          <h2 className="mb-3">Article Not Found</h2>
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
    .map((b, idx) => ({ block: b, blockIndex: idx }))
    .filter(({ block }) => block.blockType === 'heading')
    .map(({ block, blockIndex }) => ({
      id: `heading-${blockIndex}`,
      level: block.content?.level || 2,
      text: block.content?.text || ''
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
        {/* 2-Column Article Layout: Left Content & Right Sticky Sidebar */}
        <article className="pt-8 sm:pt-10 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* LEFT COLUMN: All Article Content (8 cols) */}
              <div className="lg:col-span-8 space-y-8 min-w-0">
                {/* 1. Breadcrumb Navigation */}
                <nav className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light flex-wrap">
                  <Link to="/" className="hover:text-rfblue transition-colors">Home</Link>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <Link to="/research" className="hover:text-rfblue transition-colors">Research</Link>
                  {article.category && (
                    <>
                      <ChevronRight className="w-3.5 h-3.5" />
                      <Link
                        to={`/research?category=${article.category.slug}`}
                        className="hover:text-rfblue font-medium text-ink-muted transition-colors"
                      >
                        {article.category.name}
                      </Link>
                    </>
                  )}
                </nav>

                {/* 2. Format & Reading Time Badges */}
                <div className="flex items-center space-x-3 text-xs sm:text-sm">
                  <Link
                    to={`/research?type=${article.type || 'RESEARCH'}`}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rfblue-50 hover:bg-rfblue-100 text-rfblue border border-rfblue-100 hover:border-rfblue-200 transition-colors cursor-pointer shadow-2xs"
                    title={`Browse all ${article.type || 'Research'} articles`}
                  >
                    {article.type || 'Research'}
                  </Link>
                  <span className="flex items-center text-ink-light font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1" />
                    {article.readingTimeMin} min read
                  </span>
                </div>

                {/* 3. Primary Article Headline */}
                <h2 className="text-ink-darkest font-semibold">
                  {article.title}
                </h2>

                {/* 4. Subtitle / Excerpt */}
                {article.subtitle && (
                  <p className="text-lead text-base sm:text-lg lg:text-xl">
                    {article.subtitle}
                  </p>
                )}

                {/* 5. Editorial Byline & Share Bar Header */}
                <div className="border-y border-paper-border py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Author Meta Block */}
                  <div className="flex items-center space-x-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-paper-border bg-rfblue-50 dark:bg-rfblue-950/40 text-rfblue flex items-center justify-center font-bold text-base shrink-0 shadow-2xs">
                      {article.author?.avatarUrl || article.author?.authorProfile?.avatarUrl ? (
                        <img
                          src={normalizeMediaUrl(article.author?.avatarUrl || article.author?.authorProfile?.avatarUrl)}
                          alt={article.author?.fullName || 'Author'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const next = e.currentTarget.nextElementSibling;
                            if (next) next.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <span
                        className="w-full h-full flex items-center justify-center text-rfblue font-bold"
                        style={{
                          display: (article.author?.avatarUrl || article.author?.authorProfile?.avatarUrl) ? 'none' : 'flex'
                        }}
                      >
                        {article.author?.firstName?.[0] || article.author?.fullName?.[0] || 'A'}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="text-xs text-ink-light font-medium mr-0.5">By</span>
                        <h3 className="text-sm sm:text-base font-bold text-ink-darkest truncate">
                          {article.author?.fullName}
                        </h3>
                        <ShieldCheck className="w-4 h-4 text-rfblue shrink-0" title="Verified Editorial Author" />
                      </div>

                      <div className="flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs sm:text-sm text-ink-light mt-0.5">
                        {formattedDate && <span>{formattedDate}</span>}
                        {formattedDate && <span>•</span>}
                        <span className="text-ink-muted">
                          {article.author?.authorProfile?.headline || 'Research Fellow'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Share & Bookmark Actions */}
                  <div className="shrink-0 pt-2 border-t border-paper-border/60 md:border-t-0 md:pt-0 flex items-center justify-start md:justify-end">
                    <ShareBar
                      title={article.title}
                      onBookmark={handleBookmarkToggle}
                      isBookmarked={isBookmarked}
                    />
                  </div>
                </div>

                {/* 6. Hero Cover Image */}
                {article.coverImageUrl && (
                  <figure className="my-8">
                    <div className="rounded-2xl overflow-hidden border border-paper-border shadow-md bg-paper max-h-[520px]">
                      <img
                        src={normalizeMediaUrl(article.coverImageUrl)}
                        alt={article.coverImageAlt || article.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {article.coverImageAlt && (
                      <figcaption className="text-center text-xs sm:text-sm text-ink-light mt-2.5 italic">
                        {article.coverImageAlt}
                      </figcaption>
                    )}
                  </figure>
                )}

                {/* 7. Article Body Prose (Full width of the parent column) */}
                <div className="w-full">
                  <BlockRenderer blocks={article.blocks} />
                </div>

                {/* 8. Article Footer & Topic Tags */}
                {article.tags && article.tags.length > 0 && (
                  <div className="pt-8 border-t border-paper-border">
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-light mr-2">
                        Tags:
                      </span>
                      {article.tags.map(tag => {
                        const raw = typeof tag === 'string' ? tag : (tag.slug || tag.name || '');
                        const clean = raw.replace(/^#+/, '');
                        const slug = (typeof tag === 'object' && tag.slug) ? tag.slug : clean.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        const formatted = `#${slug.replace(/-/g, '_')}`;
                        return (
                          <Link
                            key={tag.id || slug}
                            to={`/research?tag=${slug}`}
                            className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-paper border border-paper-border text-ink-muted hover:text-white hover:bg-rfblue hover:border-rfblue cursor-pointer transition-colors shadow-2xs inline-flex items-center"
                            title={`Browse research tagged ${formatted}`}
                          >
                            {formatted}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 9. Author Biography Card */}
                <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-paper-card border border-paper-border shadow-xs flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-5">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-rfblue-50 dark:bg-rfblue-950/40 text-rfblue flex items-center justify-center font-bold text-xl border border-rfblue-100 dark:border-rfblue-800 shrink-0 shadow-2xs">
                    {article.author?.avatarUrl || article.author?.authorProfile?.avatarUrl ? (
                      <img
                        src={normalizeMediaUrl(article.author?.avatarUrl || article.author?.authorProfile?.avatarUrl)}
                        alt={article.author?.fullName || 'Author'}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          const next = e.currentTarget.nextElementSibling;
                          if (next) next.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span
                      className="w-full h-full flex items-center justify-center text-rfblue font-bold"
                      style={{
                        display: (article.author?.avatarUrl || article.author?.authorProfile?.avatarUrl) ? 'none' : 'flex'
                      }}
                    >
                      {article.author?.firstName?.[0] || article.author?.fullName?.[0] || 'A'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold uppercase tracking-widest text-rfblue">
                        Author Biography
                      </span>
                      <ShieldCheck className="w-3.5 h-3.5 text-rfblue" />
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-ink-darkest mt-0.5">
                      {article.author?.fullName}
                    </h4>
                    {article.author?.authorProfile?.headline && (
                      <p className="text-xs sm:text-sm text-ink-light mt-0.5">
                        {article.author.authorProfile.headline}
                      </p>
                    )}
                    <p className="text-sm sm:text-base text-ink-muted mt-3 leading-relaxed">
                      {article.author?.authorProfile?.biography || article.author?.bio || 'Independent researcher contributing empirical investigations to Research Factors.'}
                    </p>
                  </div>
                </div>

                {/* 10. MOBILE / TABLET ONLY: Related Articles (Placed before comments on < lg) */}
                {relatedArticles.length > 0 && (
                  <div className="lg:hidden pt-8 border-t border-paper-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-ink-darkest flex items-center">
                        <Sparkles className="w-4 h-4 text-rfblue mr-2" />
                        Related Articles
                      </h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {relatedArticles.map(item => (
                        <ArticleCard key={item.id} article={item} variant="related-horizontal" />
                      ))}
                    </div>
                  </div>
                )}

                {/* 11. Dynamic Peer Discussion & Comments */}
                <CommentSection articleId={article.id} />
              </div>

              {/* RIGHT COLUMN: Sticky Sidebar (4 cols - Desktop Only) */}
              <aside className="hidden lg:block lg:col-span-4 min-w-0 h-full">
                <div className="sticky top-24 space-y-6 max-h-[calc(100vh-6.5rem)] overflow-y-auto no-scrollbar pr-0.5">
                  {/* Table of Contents (if article has headings) */}
                  {headings.length > 0 && (
                    <div className="bg-white dark:bg-paper-card rounded-2xl border border-paper-border p-5 shadow-xs">
                      <TableOfContents headings={headings} />
                    </div>
                  )}

                  {/* Related Articles Box (Left Image, Right Heading) */}
                  {relatedArticles.length > 0 && (
                    <div className="bg-white dark:bg-paper-card rounded-2xl border border-paper-border p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-paper-border">
                        <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest flex items-center">
                          Related Articles
                        </h3>
                      </div>
                      <div className="space-y-2">
                        {relatedArticles.map(item => (
                          <ArticleCard key={item.id} article={item} variant="related-horizontal" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </aside>
            </div>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
