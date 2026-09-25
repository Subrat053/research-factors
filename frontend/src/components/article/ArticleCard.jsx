import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, MessageSquare, ArrowUpRight } from 'lucide-react';
import { normalizeMediaUrl } from '../../services/media.api.js';

export function ArticleCard({ article, variant = 'standard' }) {
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
    commentCount
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

  // 1. FEATURED HERO VARIANT
  if (variant === 'featured') {
    const displayExcerpt = subtitle || excerpt || 'In-depth empirical research, critical analysis, and findings from Research Factors.';

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
                <p className="mt-2.5 text-xs sm:text-sm text-ink-muted leading-relaxed line-clamp-2 sm:line-clamp-3">
                  {displayExcerpt}
                </p>
              </Link>
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
          <h4 className="text-sm sm:text-base font-semibold text-ink-darkest group-hover:text-rfblue transition-colors leading-snug line-clamp-2 sm:line-clamp-3">
            {title}
          </h4>
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
