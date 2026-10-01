import React, { useMemo } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { articlesApi } from '../../services/articles.api.js';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { SeoHead } from '../../components/common/SeoHead.jsx';
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
import { useConfirm, useAlert } from '../../context/ModalContext.jsx';
import { Clock,Sparkles, Calendar, ChevronRight, User, ShieldCheck, Compass, ArrowRight } from 'lucide-react';
import { recommendationsApi } from '../../services/recommendations.api.js';
import { useReadingTracker } from '../../hooks/useReadingTracker.js';
import { InterestExplorerPopup } from '../../components/recommendations/InterestExplorerPopup.jsx';
import { PersonalizedRecommendationRail } from '../../components/recommendations/PersonalizedRecommendationRail.jsx';

// Helper for formatting tags in clean, human-readable normal form
function formatNormalTag(tag) {
  if (!tag) return { name: '', slug: '' };
  const raw = typeof tag === 'string' ? tag : (tag.name || tag.slug || '');
  const clean = String(raw).replace(/^#+/, '').trim();
  const slug = (typeof tag === 'object' && tag.slug)
    ? tag.slug
    : clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let name = (typeof tag === 'object' && tag.name) ? tag.name : clean;
  name = name.replace(/^#+/, '').trim();
  if (name.includes('_') || (name.includes('-') && !name.includes(' '))) {
    name = name.replace(/[-_]/g, ' ');
  }
  return { name, slug };
}

export default function ArticleDetailPage() {
  const { categorySlug: urlCategorySlug, slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const confirm = useConfirm();
  const showAlert = useAlert();
  const [isBookmarked, setIsBookmarked] = React.useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['article', slug],
    queryFn: () => articlesApi.getArticleBySlug(slug)
  });

  const article = data?.data || null;

  // Handle 301 permanent slug redirects & category URL canonicalization
  React.useEffect(() => {
    if (data?.redirect && data?.newSlug) {
      const targetCat = data.categorySlug || 'research';
      navigate(`/${targetCat}/${data.newSlug}`, { replace: true });
      return;
    }

    if (article?.slug) {
      const correctCategory = article.category?.slug || 'research';
      // If accessed via legacy /research/:slug or /articles/:slug or mismatched category, canonicalize
      if (urlCategorySlug === 'research' || urlCategorySlug === 'articles' || (urlCategorySlug && urlCategorySlug !== correctCategory)) {
        navigate(`/${correctCategory}/${article.slug}`, { replace: true });
      }
    }
  }, [data, article, urlCategorySlug, navigate]);

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

  // Structured Multi-Intent Recommendation Query
  const { data: recommendationsData, isLoading: isRecsLoading } = useQuery({
    queryKey: ['article-recommendations', article?.id],
    queryFn: () => recommendationsApi.getArticleRecommendations(article.id),
    enabled: Boolean(article?.id)
  });
  const journeys = recommendationsData?.data || null;
  const journeyItems = journeys?.recommendations?.length
    ? journeys.recommendations
    : (journeys?.completeYourResearch?.items?.length
      ? journeys.completeYourResearch.items
      : (journeys?.deepTopicDive?.items?.length ? journeys.deepTopicDive.items : []));

  // Dwell time & Scroll depth engagement tracker
  const { isEngaged } = useReadingTracker({
    articleId: article?.id,
    categoryId: article?.category?.id,
    tags: article?.tags
  });

  // Schema.org FAQPage structured data extraction for Google Rich Results (Must be called unconditionally)
  const combinedJsonLd = useMemo(() => {
    if (!article) return null;
    const faqBlock = (article.blocks || []).find(b => b.blockType === 'faq');
    const faqItems = Array.isArray(faqBlock?.content?.items) ? faqBlock.content.items : [];
    const faqJsonLd = faqItems.length > 0 ? {
      '@type': 'FAQPage',
      mainEntity: faqItems.map(item => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer
        }
      }))
    } : null;

    const baseLd = article.seo?.schema?.jsonLd;
    if (baseLd && faqJsonLd) {
      return {
        '@context': 'https://schema.org',
        '@graph': [
          ...(Array.isArray(baseLd['@graph']) ? baseLd['@graph'] : [baseLd]),
          faqJsonLd
        ]
      };
    }
    if (faqJsonLd) {
      return {
        '@context': 'https://schema.org',
        ...faqJsonLd
      };
    }
    return baseLd || null;
  }, [article]);

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
      const shouldLogin = await confirm({
        title: 'Sign In Required',
        message: 'Please sign in to your Research Factors account to save articles to your personal bookmarks and sync reading lists.',
        confirmText: 'Sign In',
        cancelText: 'Cancel',
        variant: 'info'
      });
      if (shouldLogin) {
        navigate(`/login?redirect=${encodeURIComponent(location.pathname)}`);
      }
      return;
    }
    try {
      const res = await bookmarksApi.toggleBookmark(article.id);
      setIsBookmarked(res.data?.bookmarked || false);
    } catch {
      showAlert({
        title: 'Unable to Save',
        message: 'We were unable to update your bookmark at this time. Please check your connection and try again.',
        variant: 'warning'
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink">
      {/* Production-Grade SEO, Social Cards & Schema.org JSON-LD Graph */}
      <SeoHead
        seo={article.seo}
        title={`${article.seoTitle || article.title} — Research Factors`}
        description={article.seoDescription || article.excerpt}
        canonicalUrl={article.canonicalUrl}
        jsonLd={combinedJsonLd}
        openGraph={{
          title: article.seoTitle || article.title,
          description: article.seoDescription || article.excerpt,
          image: article.coverImageUrl ? normalizeMediaUrl(article.coverImageUrl) : undefined,
          type: 'article'
        }}
      />

      {/* Reading Scroll Progress Bar */}
      <ReadingProgressBar />

      <Header />

      <main className="flex-1">
        {/* 2-Column Article Layout: Left Content & Right Sticky Sidebar */}
        <article className="pt-6 sm:pt-10 pb-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
              {/* LEFT COLUMN: All Article Content (8 cols) */}
              <div className="lg:col-span-8 space-y-6 lg:space-y-8 min-w-0">
                {/* 1. Breadcrumb Navigation */}
                <nav aria-label="Breadcrumbs" className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light flex-wrap">
                  <Link to="/" className="hover:text-rfblue transition-colors">Home</Link>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  <Link to="/research" className="hover:text-rfblue transition-colors">Category</Link>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  {article.category ? (
                    <Link
                      to={`/categories/${article.category.slug}`}
                      className="hover:text-rfblue font-semibold text-ink-darkest transition-colors"
                    >
                      {article.category.name}
                    </Link>
                  ) : (
                    <span className="font-semibold text-ink-darkest">
                      Research
                    </span>
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
                <h1 className="lg:text-[46px] text-ink-darkest font-semibold">
                  {article.title}
                </h1>

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
                      </div>
                    </div>
                  </div>

                  {/* Share & Bookmark Actions */}
                  <div className="shrink-0 pt-2 border-t border-paper-border/60 md:border-t-0 md:pt-0 flex items-center justify-start md:justify-end">
                    <ShareBar
                      article={article}
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

                {/* 8. MOBILE ONLY: Topic Tags (On desktop, prominently rendered at top of right sidebar) */}
                {article.tags && article.tags.length > 0 && (
                  <div className="lg:hidden pt-8 border-t border-paper-border">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-light block mb-3">
                      Tags:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, idx) => {
                        const { name, slug } = formatNormalTag(tag);
                        if (!name) return null;
                        return (
                          <Link
                            key={tag.id || slug || idx}
                            to={`/tag/${slug}`}
                            className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-[#eef5f6] text-rfblue hover:bg-ink-light hover:text-rfblue transition-colors cursor-pointer border border-[#d6e7eb] shadow-2xs"
                            title={`Browse research tagged ${name}`}
                          >
                            {name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 9. MOBILE ONLY: Sponsored Disclosure Card */}
                {article.isSponsored && article.sponsorName && (
                  <div className="lg:hidden p-6 rounded-2xl bg-white dark:bg-paper-card border border-paper-border shadow-xs space-y-3">
                    <span className="text-[11px] font-bold tracking-widest text-rfblue dark:text-[#f87171] uppercase block">
                      SPONSORED
                    </span>
                    <h3 className="font-serif text-xl font-bold text-ink-darkest">
                      {article.sponsorName}
                    </h3>
                    {article.sponsorDescription && (
                      <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                        {article.sponsorDescription}
                      </p>
                    )}
                    {article.sponsorUrl && (
                      <div className="pt-2">
                        <a
                          href={article.sponsorUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-[#a94f29] transition-colors shadow-2xs"
                        >
                          Visit Sponsor
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 10. Author Biography Card */}
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

                {/* 11. MOBILE / TABLET ONLY: Related Articles (Placed before comments on < lg) */}
                {relatedArticles.length > 0 && (
                  <div className="lg:hidden pt-8 border-t border-paper-border">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg sm:text-xl font-bold text-ink-darkest flex items-center">
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

                {/* Mobile Sponsorship Opportunity Banner (Available on all article pages) */}
                <div className="lg:hidden relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#060D1A] via-[#0F172A] to-[#1E3A8A] text-white p-5 sm:p-6 shadow-md border border-slate-800 my-6">
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-rfblue/20 rounded-full blur-2xl pointer-events-none" />
                  <div className="relative z-10 space-y-3">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                      <span>Sponsorship Opportunity</span>
                    </div>
                    <h3 className="font-serif text-lg font-bold text-white leading-snug">
                      Want your organization to be part of the research?
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      Reach readers who are already researching, comparing, and making informed choices. Sponsorship gives your brand a relevant space to showcase your products or services alongside research your audience is actively exploring.
                    </p>
                    <div className="pt-1">
                      <Link
                        to="/sponsorship"
                        className="inline-flex items-center justify-center space-x-2 w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-600 transition-all duration-200 shadow-sm cursor-pointer group"
                      >
                        <span>Become a Sponsor</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </div>

                

                {/* 12. Dynamic Peer Discussion & Comments */}
                <CommentSection articleId={article.id} />
              </div>

              {/* RIGHT COLUMN: Desktop Sidebar (4 cols - Desktop Only) */}
              <aside className="hidden lg:block lg:col-span-4 min-w-0 space-y-6">
                {/* 1. Tags Card (Header "Tags", normal-form badges) */}
                {article.tags && article.tags.length > 0 && (
                  <div className="bg-white dark:bg-paper-card rounded-2xl border border-paper-border p-6 shadow-xs">
                    <h3 className="font-serif text-2xl font-bold tracking-tight text-ink-darkest mb-4">
                      Tags
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((tag, idx) => {
                        const { name, slug } = formatNormalTag(tag);
                        if (!name) return null;
                        return (
                          <Link
                            key={tag.id || slug || idx}
                            to={`/tag/${slug}`}
                            className="px-3.5 py-1.5 rounded-full text-xs sm:text-[13px] font-medium bg-white  text-[#0f5466] hover:bg-blue-600/50  transition-colors cursor-pointer border border-ink-darkest shadow-2xs"
                            title={`Browse publications under ${name}`}
                          >
                            {name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Table of Contents Card (Viewed below the base of topic/tags heading) */}
                {headings.length > 0 && (
                  <div className="bg-white dark:bg-paper-card rounded-2xl border border-paper-border p-5 shadow-xs">
                    <TableOfContents headings={headings} />
                  </div>
                )}

                {/* 3. Sponsored Card (if article is sponsored) */}
                {article.isSponsored && article.sponsorName && (
                  <div className="bg-white dark:bg-paper-card rounded-2xl border border-paper-border p-6 shadow-xs space-y-3">
                    <span className="text-[11px] font-bold tracking-widest text-rfblue dark:text-[#f87171] uppercase block">
                      SPONSORED
                    </span>
                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-ink-darkest leading-snug">
                      {article.sponsorName}
                    </h3>
                    {article.sponsorDescription && (
                      <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                        {article.sponsorDescription}
                      </p>
                    )}
                    {article.sponsorUrl && (
                      <div className="pt-2">
                        <a
                          href={article.sponsorUrl}
                          target="_blank"
                          rel="noopener noreferrer sponsored"
                          className="inline-flex items-center justify-center px-5 py-2.5 rounded-full text-xs sm:text-sm font-semibold text-white bg-rfblue hover:bg-[#a94f29] transition-colors shadow-2xs cursor-pointer"
                        >
                          Visit Sponsor
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* 4 & 5. Sticky Lower Sidebar Cluster (Related Articles + Sponsorship Opportunity Banner) */}
                <div className="sticky top-24 space-y-6">
                  {/* Curated Journey or Related Articles Card */}
                  {journeyItems.length > 0 ? (
                    <div className="bg-white dark:bg-paper-card rounded-2xl border border-paper-border p-5 shadow-xs space-y-3">
                      <div className="flex items-center justify-between pb-3 border-b border-paper-border">
                        <div className="flex items-center space-x-2">
                          {/* <Compass className="w-4 h-4 text-rfblue" /> */}
                          <h3 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-ink-darkest">
                            Next In Your Journey
                          </h3>
                        </div>
                      </div>
                      <div className="space-y-3">
                        {journeyItems.slice(0, 3).map((jItem) => (
                          <div key={jItem.article.id} className="group flex flex-col space-y-1.5 pb-2.5 border-b border-paper-border/60 last:border-b-0 last:pb-0">
                            <ArticleCard article={jItem.article} variant="related-horizontal" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : relatedArticles.length > 0 ? (
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
                  ) : null}

                  {/* Sponsorship Opportunity Banner */}
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#060D1A] via-[#0F172A] to-[#1E3A8A] text-white p-6 shadow-md border border-slate-800">
                    <div className="absolute top-0 right-0 -mr-6 -mt-6 w-24 h-24 bg-rfblue/20 rounded-full blur-2xl pointer-events-none" />
                    <div className="relative z-10 space-y-3">
                      <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white border border-white/15">
                        <span>Sponsorship Opportunity</span>
                      </div>
                      <h3 className="font-serif text-lg font-bold text-white leading-snug">
                        Want your organization to be part of the research?
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                        Reach readers who are already researching, comparing, and making informed choices. Sponsorship gives your brand a relevant space to showcase your products or services alongside research your audience is actively exploring.
                      </p>
                      <div className="pt-2">
                        <Link
                          to="/sponsorship"
                          className="inline-flex items-center justify-center space-x-2 w-full px-4 py-2.5 rounded-full text-xs font-semibold text-white bg-rfblue hover:bg-rfblue-600 transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer group"
                        >
                          <span>Become a Sponsor</span>
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </article>

        {/* Structured Multi-Intent Recommendation Rails */}
        {article && (
          <section className="border-t border-paper-border bg-paper py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <PersonalizedRecommendationRail
                journeys={journeys}
                currentArticle={article}
                isLoading={isRecsLoading}
              />
            </div>
          </section>
        )}
      </main>

      <InterestExplorerPopup
        currentCategoryId={article?.category?.id}
        currentCategoryName={article?.category?.name}
        isTriggered={isEngaged}
      />

      <Footer />
    </div>
  );
}
