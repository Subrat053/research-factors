import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MessageSquare, ArrowUpRight, TrendingUp, Sparkles, Eye } from 'lucide-react';
import { normalizeMediaUrl } from '../../services/media.api.js';

// Helper for formatting tags in clean normal form with valid slug
function formatTag(tag) {
  if (!tag) return { name: '', slug: '' };
  const tagObj = tag.tag || tag;
  const raw = typeof tagObj === 'string' ? tagObj : (tagObj.name || tagObj.slug || '');
  const clean = String(raw).replace(/^#+/, '').trim();
  const slug = (typeof tagObj === 'object' && tagObj.slug)
    ? tagObj.slug
    : clean.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  let name = (typeof tagObj === 'object' && tagObj.name) ? tagObj.name : clean;
  name = name.replace(/^#+/, '').trim();
  if (name.includes('_') || (name.includes('-') && !name.includes(' '))) {
    name = name.replace(/[-_]/g, ' ');
  }
  return { name, slug };
}

export function ArticleCard({ article, variant = 'standard', rank, className = '' }) {
  if (!article) return null;

  const {
    title,
    slug,
    subtitle,
    excerpt,
    coverImageUrl,
    category,
    author,
    readingTimeMin,
    publishedAt,
    commentCount,
    viewCount,
    isSponsored,
    sponsorName,
    tags = []
  } = article;

  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
    : null;

  const categorySlug = category?.slug || 'research';
  const articleUrl = `/${categorySlug}/${slug}`;

  // A. TRENDING HERO VARIANT (60% Left Hero Asymmetric Card)
  if (variant === 'trendingHero') {
    const displayExcerpt = excerpt || 'In-depth empirical research, critical analysis, and findings from Research Factors.';

    return (
      <article className={`group relative bg-white rounded-2xl border border-paper-border overflow-hidden shadow-xs hover:shadow-lg hover:border-rfblue/40 transition-all duration-300 flex flex-col h-full ${className}`}>
        {/* Large Image Container with calibrated height */}
        <div className="relative aspect-[16/9] max-h-[290px] sm:max-h-[330px] w-full overflow-hidden bg-slate-100 shrink-0">
          <Link to={articleUrl} className="block w-full h-full">
            {coverImageUrl ? (
              <img
                src={normalizeMediaUrl(coverImageUrl)}
                alt={article.coverImageAlt || title}
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-rfblue/90 flex flex-col items-center justify-center p-6 text-white text-center">
                <span className="text-xs uppercase tracking-widest font-bold text-rfblue-100/70 mb-1">
                  Research Factors
                </span>
                <span className="text-xl sm:text-2xl font-bold opacity-40">
                  Featured Trending Study
                </span>
              </div>
            )}
          </Link>

          {/* Badges Overlay */}
          <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 flex flex-wrap items-center gap-2 z-10">
            <Link
              to={`/categories/${categorySlug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-rfblue shadow-xs hover:bg-rfblue hover:text-white transition-colors"
            >
              {category?.name || 'Research'}
            </Link>
            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-rfblue text-white shadow-xs">
              <TrendingUp className="w-3 h-3" />
              <span>Trending #1</span>
            </span>
            {isSponsored && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-slate-900/90 text-amber-300 border border-amber-400/40 shadow-xs">
                Sponsored
              </span>
            )}
          </div>
        </div>

        {/* Content Body - snug without artificial empty space */}
        <div className="p-5 sm:p-6 flex flex-col justify-between flex-1">
          <div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm text-ink-light font-medium mb-2.5">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                {readingTimeMin || 5} min read
              </span>
              {viewCount > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    <Eye className="w-3.5 h-3.5 mr-1 text-slate-500" />
                    {viewCount.toLocaleString()} reads
                  </span>
                </>
              )}
            </div>

            <Link to={articleUrl} className="block group">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-ink-darkest leading-snug tracking-tight group-hover:text-rfblue transition-colors line-clamp-2">
                {title}
              </h2>
            </Link>

            <p className="mt-2.5 text-xs sm:text-base text-ink-muted leading-relaxed line-clamp-3">
              {subtitle}
            </p>
            <p className="mt-2.5 text-xs sm:text-base text-ink-muted leading-relaxed line-clamp-3">
              {displayExcerpt}
            </p>
          </div>

          {/* Author Footer */}
          <div className="mt-4 sm:mt-5 pt-3.5 sm:pt-4 border-t border-paper-border flex items-center justify-between">
            <div className="flex items-center space-x-3 min-w-0 pr-3">
              <div className="w-10 h-10 rounded-lg overflow-hidden bg-rfblue-50 border border-rfblue-100 flex items-center justify-center font-bold text-xs text-rfblue shrink-0 shadow-2xs">
                {author?.avatarUrl ? (
                  <img
                    src={normalizeMediaUrl(author.avatarUrl)}
                    alt={author.fullName || 'Author'}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const next = e.currentTarget.nextElementSibling;
                      if (next) next.style.display = 'flex';
                    }}
                  />
                ) : null}
                <span
                  className="w-full h-full flex items-center justify-center"
                  style={{ display: author?.avatarUrl ? 'none' : 'flex' }}
                >
                  {author?.firstName?.[0] || author?.fullName?.[0] || 'A'}
                </span>
              </div>
              <div className="min-w-0">
                <h4 className="text-xs sm:text-sm font-bold text-ink-darkest truncate">{author?.fullName || 'Research Factors Contributor'}</h4>
                <p className="text-[11px] text-ink-light truncate max-w-[200px]">
                  {author?.authorProfile?.headline || 'Editorial Fellow'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {commentCount > 0 && (
                <span className="hidden sm:flex items-center text-xs font-medium text-ink-light">
                  <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {commentCount}
                </span>
              )}
              <Link
                to={articleUrl}
                className="w-9 h-9 rounded-lg bg-paper flex items-center justify-center text-ink-darkest group-hover:bg-rfblue group-hover:text-white transition-all shadow-2xs"
                title="Read Research"
                aria-label={`Read research: ${title}`}
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // B. TRENDING SECONDARY VARIANT (40% Right Column Stacked Cards)
  if (variant === 'trendingSecondary') {
    return (
      <article
        className={`group relative bg-white rounded-xl border border-paper-border overflow-hidden shadow-2xs hover:shadow-md hover:border-rfblue/40 transition-all duration-300 flex flex-row items-stretch h-full ${className}`}
      >
        {/* Thumbnail Left: Flush full height & fixed width */}
        <div className="relative w-[34%] sm:w-[36%] lg:w-[34%] xl:w-[36%] shrink-0 h-full overflow-hidden bg-slate-100">
          <Link to={articleUrl} className="block w-full h-full">
            {coverImageUrl ? (
              <img
                src={normalizeMediaUrl(coverImageUrl)}
                alt={article.coverImageAlt || title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center p-2 text-center text-sm text-ink-light">
                Research Factors
              </div>
            )}
          </Link>
          <div className="absolute top-2 left-2 z-10">
            <Link
              to={`/categories/${categorySlug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-rfblue shadow-xs hover:bg-rfblue hover:text-white transition-colors"
            >
              {category?.name || 'Research'}
            </Link>
          </div>
        </div>

        {/* Content Right: Padded and vertically distributed */}
        <div className="flex-1 min-w-0 p-3 sm:p-3.5 flex flex-col justify-between h-full bg-white">
          <div>
            <div className="flex items-center space-x-1.5 sm:space-x-2 text-[11px] sm:text-xs text-ink-light font-medium mb-1">
              {rank && (
                <span className="font-bold text-rfblue">#{rank}</span>
              )}
              {rank && <span>•</span>}
              <span>{formattedDate}</span>
              <span>•</span>
              <span>{readingTimeMin || 4}m read</span>
              {isSponsored && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Sponsored
                </span>
              )}
            </div>

            <Link to={articleUrl} className="block">
              <h3 className="text-xs sm:text-base font-bold text-ink-darkest group-hover:text-rfblue transition-colors leading-snug line-clamp-3">
                {title}
              </h3>
            </Link>

            <p className="mt-1 text-sm text-ink-muted line-clamp-2 sm:line-clamp-2 leading-relaxed hidden sm:block">
              {(subtitle || excerpt).slice(0, 110)} ...
            </p>
          </div>

          <div className="mt-2 pt-1.5 border-t border-paper-border/60 flex items-center justify-between text-[11px] sm:text-sm text-ink-light">
            <span className="truncate max-w-[130px] font-medium text-ink-darkest">
              {author?.fullName || 'RF Research'}
            </span>
            {commentCount > 0 && (
              <span className="flex items-center text-[10px] sm:text-[11px]">
                <MessageSquare className="w-3 h-3 mr-1 text-slate-400" />
                {commentCount}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // C. EDITORIAL PICK VARIANT (3-Column Card Grid)
  if (variant === 'editorialPick') {
    return (
      <article className={`group flex flex-col justify-between bg-white rounded-xl border border-paper-border overflow-hidden shadow-2xs hover:shadow-md hover:border-rfblue/40 transition-all duration-300 h-full ${className}`}>
        <div>
          {/* Uniform 16:9 Image */}
          <div className="relative aspect-[16/9] overflow-hidden bg-slate-100">
            <Link to={articleUrl} className="block w-full h-full">
              {coverImageUrl ? (
                <img
                  src={normalizeMediaUrl(coverImageUrl)}
                  alt={article.coverImageAlt || title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                />
              ) : (
                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-ink-light">
                  Research Factors
                </div>
              )}
            </Link>
            <div className="absolute top-3 left-3 z-10 flex items-center space-x-1.5">
              <Link
                to={`/categories/${categorySlug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-rfblue shadow-xs hover:bg-rfblue hover:text-white transition-colors"
              >
                {category?.name || 'Research'}
              </Link>
              {isSponsored && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 text-amber-300 shadow-xs">
                  Sponsored
                </span>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-4 sm:p-5">
            <div className="flex items-center space-x-2 text-xs text-ink-light font-medium mb-2">
              <span>{formattedDate}</span>
              <span>•</span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1 text-slate-500" />
                {readingTimeMin || 5} min read
              </span>
            </div>

            <Link to={articleUrl}>
              <h3 className="text-base sm:text-lg font-bold text-ink-darkest group-hover:text-rfblue transition-colors line-clamp-2 leading-snug">
                {title}
              </h3>
            </Link>

            <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-2">
              {subtitle || excerpt}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 bg-paper/30 border-t border-paper-border/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-rfblue-50 text-rfblue flex items-center justify-center font-bold text-[10px] shrink-0 border border-rfblue-100">
              {author?.firstName?.[0] || author?.fullName?.[0] || 'A'}
            </div>
            <span className="font-semibold text-ink-darkest truncate">{author?.fullName || 'Contributor'}</span>
          </div>
          {commentCount > 0 && (
            <span className="flex items-center text-ink-light shrink-0 ml-2">
              <MessageSquare className="w-3 h-3 mr-1 text-slate-400" />
              {commentCount}
            </span>
          )}
        </div>
      </article>
    );
  }

  // D. LATEST RESEARCH LIST VARIANT (Scanning-friendly horizontal card)
  if (variant === 'latestList') {
    return (
      <article className={`group flex flex-col sm:flex-row items-stretch bg-white rounded-xl border border-paper-border overflow-hidden shadow-2xs hover:shadow-md hover:border-rfblue/40 transition-all duration-300 ${className}`}>
        {/* Left Image */}
        <div className="relative aspect-[16/10] sm:aspect-auto sm:w-48 md:w-56 overflow-hidden bg-slate-100 shrink-0">
          <Link to={articleUrl} className="block w-full h-full">
            {coverImageUrl ? (
              <img
                src={normalizeMediaUrl(coverImageUrl)}
                alt={article.coverImageAlt || title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-ink-light">
                Research Factors
              </div>
            )}
          </Link>
          <div className="absolute top-2.5 left-2.5 sm:hidden z-10">
            <Link
              to={`/categories/${categorySlug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-rfblue shadow-xs"
            >
              {category?.name || 'Research'}
            </Link>
          </div>
        </div>

        {/* Right Content */}
        <div className="p-4 sm:p-5 flex flex-col justify-between flex-1 min-w-0">
          <div>
            <div className="hidden sm:flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rfblue mb-1.5">
              <Link
                to={`/categories/${categorySlug}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline text-rfblue"
              >
                {category?.name || 'Research'}
              </Link>
              <span className="text-ink-light font-normal">•</span>
              <span className="text-ink-light font-normal">{formattedDate}</span>
              <span className="text-ink-light font-normal">•</span>
              <span className="text-ink-light font-normal">{readingTimeMin || 5}m read</span>
              {isSponsored && (
                <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                  Sponsored
                </span>
              )}
            </div>

            <Link to={articleUrl}>
              <h3 className="text-base sm:text-lg font-bold text-ink-darkest group-hover:text-rfblue transition-colors line-clamp-2 leading-snug">
                {title}
              </h3>
            </Link>

            <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-2">
              {subtitle || excerpt}
            </p>
          </div>

          <div className="mt-4 pt-2.5 border-t border-paper-border/60 flex items-center justify-between text-xs text-ink-light">
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-ink-darkest">{author?.fullName || 'RF Fellow'}</span>
              <span className="hidden sm:inline text-slate-300">|</span>
              <span className="hidden sm:inline text-[11px] text-ink-light">{author?.authorProfile?.headline || 'Researcher'}</span>
            </div>
            {commentCount > 0 && (
              <span className="flex items-center text-ink-light">
                <MessageSquare className="w-3 h-3 mr-1 text-slate-400" />
                {commentCount}
              </span>
            )}
          </div>
        </div>
      </article>
    );
  }

  // E. MOST READ NUMBERED SIDEBAR VARIANT
  if (variant === 'mostRead') {
    return (
      <article className={`group flex items-start space-x-3.5 py-3 border-b border-paper-border/60 last:border-0 ${className}`}>
        {/* Number Badge */}
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs sm:text-sm border border-slate-200 group-hover:bg-rfblue group-hover:text-white group-hover:border-rfblue transition-colors shrink-0 mt-0.5 shadow-2xs">
          {rank || 1}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 text-[11px] font-bold uppercase tracking-wider text-rfblue mb-1">
            <Link
              to={`/categories/${categorySlug}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline"
            >
              {category?.name || 'Topic'}
            </Link>
            <span className="text-ink-light font-normal">• {readingTimeMin || 4}m read</span>
          </div>

          <Link to={articleUrl} className="block">
            <h4 className="text-sm sm:text-base font-bold text-ink-darkest group-hover:text-rfblue transition-colors leading-snug line-clamp-2">
              {title}
            </h4>
          </Link>

          <div className="mt-1 flex items-center space-x-2 text-sm text-ink-light">
            <span className="truncate max-w-[120px]">{author?.fullName || 'Contributor'}</span>
            {viewCount > 0 && (
              <>
                <span>•</span>
                <span>{viewCount.toLocaleString()} views</span>
              </>
            )}
          </div>
        </div>

        {/* Optional Micro Thumbnail */}
        {coverImageUrl && (
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden shrink-0 bg-slate-100 border border-paper-border">
            <img
              src={normalizeMediaUrl(coverImageUrl)}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </article>
    );
  }

  // 1. FEATURED HERO VARIANT
  if (variant === 'featured') {
    const displayExcerpt = excerpt || subtitle || 'In-depth empirical research, critical analysis, and findings from Research Factors.';

    return (
      <article className="h-full w-full group relative bg-white rounded-2xl border border-paper-border overflow-hidden shadow-xs hover:shadow-md hover:border-rfblue/40 transition-all duration-200 flex flex-col">
        <div className="flex flex-col md:grid md:grid-cols-2 gap-0 h-full flex-1">
          {/* Image Left */}
          <div className="overflow-hidden h-[190px] sm:h-[210px] md:h-full relative bg-slate-100 shrink-0">
            {coverImageUrl ? (
              <img
                src={normalizeMediaUrl(coverImageUrl)}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-rfblue/90 flex flex-col items-center justify-center p-6 text-white text-center">
                <span className="text-xs uppercase tracking-widest font-bold text-rfblue-100/70 mb-1">
                  Research Factors
                </span>
                <span className="text-xl sm:text-2xl font-bold opacity-40">
                  Empirical Science
                </span>
              </div>
            )}
            <div className="absolute top-4 left-4 flex items-center space-x-2 z-10">
              <Link
                to={`/categories/${categorySlug}`}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-rfblue shadow-xs hover:bg-rfblue hover:text-white transition-colors"
              >
                {category?.name || 'Research'}
              </Link>
              {article.isFeatured && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider bg-rfblue text-white shadow-xs">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Editorial Content Right */}
          <div className="p-5 sm:p-6 lg:p-7 flex flex-col justify-between h-full bg-white">
            <div>
              <div className="flex items-center space-x-2 text-xs text-ink-light font-medium mb-2.5">
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                  {readingTimeMin || 5} min read
                </span>
              </div>

              <Link to={articleUrl} className="block group">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-ink-darkest leading-snug tracking-tight group-hover:text-rfblue transition-colors line-clamp-2">
                  {title}
                </h2>
                {subtitle && (
                  <p className="mt-2 text-sm sm:text-base text-ink-darkest font-semibold leading-relaxed line-clamp-2">
                    {subtitle}
                  </p>
                )}
                <p className={`mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-3 sm:line-clamp-4`}>
                  {displayExcerpt}
                </p>
              </Link>

              {tags && tags.length > 0 && (
                <div className="h-[24px] overflow-hidden flex flex-wrap items-center gap-1.5 mt-3">
                  {tags.map((t, idx) => {
                    const { name, slug } = formatTag(t);
                    if (!name || !slug) return null;
                    return (
                      <Link
                        key={t.id || slug || idx}
                        to={`/tag/${slug}`}
                        onClick={(e) => e.stopPropagation()}
                        title={`Browse research tagged ${name}`}
                        className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-rfblue hover:text-white dark:hover:bg-rfblue dark:hover:text-white transition-colors whitespace-nowrap shrink-0 max-w-[200px] truncate cursor-pointer z-10"
                      >
                        {name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Author Footer */}
            <div className="mt-4 pt-4 border-t border-paper-border flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0 pr-2">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-rfblue-50 border border-rfblue-100 flex items-center justify-center font-bold text-xs text-rfblue shrink-0 shadow-2xs">
                  {author?.avatarUrl ? (
                    <img
                      src={normalizeMediaUrl(author.avatarUrl)}
                      alt={author.fullName || 'Author'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const next = e.currentTarget.nextElementSibling;
                        if (next) next.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span
                    className="w-full h-full flex items-center justify-center"
                    style={{ display: author?.avatarUrl ? 'none' : 'flex' }}
                  >
                    {author?.firstName?.[0] || author?.fullName?.[0] || 'A'}
                  </span>
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-ink-darkest truncate">{author?.fullName}</h4>
                  <p className="text-[11px] text-ink-light truncate max-w-[150px]">
                    {author?.authorProfile?.headline || 'Editorial Fellow'}
                  </p>
                </div>
              </div>

              <Link
                to={articleUrl}
                className="w-9 h-9 rounded-lg bg-paper flex items-center justify-center text-ink-darkest group-hover:bg-rfblue group-hover:text-white transition-all shadow-2xs shrink-0"
                title="Read Research"
              >
                <ArrowUpRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // 2. COMPACT NUMBERED / SIDEBAR VARIANT
  if (variant === 'compact') {
    return (
      <article className="group flex items-start space-x-3.5 py-3.5 border-b border-paper-border/60 last:border-0">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 text-xs font-bold uppercase tracking-wider text-rfblue mb-1">
            <Link
              to={`/categories/${categorySlug}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-rfblue transition-colors"
            >
              {category?.name || 'Topic'}
            </Link>
            <span className="text-ink-light">• {readingTimeMin || 5}m</span>
          </div>
          <Link to={articleUrl}>
            <h4 className="text-sm sm:text-base font-semibold text-ink-darkest group-hover:text-rfblue transition-colors leading-snug line-clamp-2">
              {title}
            </h4>
          </Link>
        </div>
        {coverImageUrl && (
          <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-paper border border-paper-border">
            <img
              src={normalizeMediaUrl(coverImageUrl)}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
      </article>
    );
  }

  // 3. RELATED HORIZONTAL VARIANT (Left Image, Right Heading Only)
  if (variant === 'related-horizontal') {
    const displayExcert = excerpt || subtitle;
    return (
      <Link
        to={articleUrl}
        className="group flex items-center space-x-3.5 p-2 rounded-xl hover:bg-paper transition-colors duration-200"
      >
        <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-lg overflow-hidden shrink-0 bg-paper border border-paper-border">
          {coverImageUrl ? (
            <img
              src={normalizeMediaUrl(coverImageUrl)}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-ink-light text-center p-1">
              Research Factors
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-semibold text-ink-darkest group-hover:text-rfblue transition-colors leading-snug line-clamp-2 sm:line-clamp-2">
            {title}
          </h4>
          <p className={`mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-2 sm:line-clamp-2`}>
            {displayExcert}
          </p>
        </div>
      </Link>
    );
  }

  // 3. STANDARD 4-COLUMN / GRID CARD (Default)
  return (
    <article className="group flex flex-col justify-between bg-white rounded-xl border border-paper-border overflow-hidden shadow-2xs hover:shadow-md hover:border-rfblue/40 transition-all duration-200">
      <div>
        {/* Cover Image Container */}
        <div className="relative aspect-[16/10] overflow-hidden bg-paper">
          <Link to={articleUrl} className="block w-full h-full">
            {coverImageUrl ? (
              <img
                src={normalizeMediaUrl(coverImageUrl)}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-sm text-ink-light">
                Research Factors
              </div>
            )}
          </Link>
          <div className="absolute top-3 left-3 z-10">
            <Link
              to={`/categories/${categorySlug}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center px-3 py-1 rounded-md text-xs sm:text-sm font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-rfblue shadow-xs hover:bg-rfblue hover:text-white transition-colors"
            >
              {category?.name || 'Research'}
            </Link>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6">
          <div className="flex items-center space-x-2 text-xs sm:text-sm text-ink-light font-medium mb-2.5">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
              {readingTimeMin || 5} min read
            </span>
          </div>

          <Link to={articleUrl}>
            <h3 className="text-card-title group-hover:text-rfblue transition-colors line-clamp-2">
              {title}
            </h3>
          </Link>

          <p className="mt-2.5 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-2">
            {excerpt || subtitle}
          </p>
        </div>
      </div>

      {/* Author Footer */}
      <div className="px-5 sm:px-6 py-3.5 bg-paper/40 border-t border-paper-border/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5 min-w-0">
          <div className="w-7 h-7 rounded-md overflow-hidden bg-rfblue-50 text-rfblue flex items-center justify-center font-bold text-xs shrink-0 border border-rfblue-100 shadow-2xs">
            {author?.avatarUrl ? (
              <img
                src={normalizeMediaUrl(author.avatarUrl)}
                alt={author.fullName || 'Author'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const next = e.currentTarget.nextElementSibling;
                  if (next) next.style.display = 'flex';
                }}
              />
            ) : null}
            <span
              className="w-full h-full flex items-center justify-center"
              style={{ display: author?.avatarUrl ? 'none' : 'flex' }}
            >
              {author?.firstName?.[0] || author?.fullName?.[0] || 'A'}
            </span>
          </div>
          <span className="text-xs sm:text-sm font-semibold text-ink-darkest truncate">{author?.fullName}</span>
        </div>

        {commentCount > 0 && (
          <span className="flex items-center text-xs sm:text-sm text-ink-light shrink-0 ml-2">
            <MessageSquare className="w-3.5 h-3.5 mr-1 text-slate-400" />
            {commentCount}
          </span>
        )}
      </div>
    </article>
  );
}
