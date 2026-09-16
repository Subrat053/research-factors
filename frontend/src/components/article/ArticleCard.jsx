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

  // 1. FEATURED HERO VARIANT (Ghost / Brightspot style)
  if (variant === 'featured') {
    return (
      <article className="group relative bg-white rounded-3xl border border-paper-border overflow-hidden shadow-xs hover:shadow-xl hover:border-rfblue/30 transition-all duration-300">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Image Left */}
          <div className="lg:col-span-7 overflow-hidden aspect-[16/10] lg:aspect-auto relative min-h-[320px] lg:min-h-[420px] bg-paper">
            {coverImageUrl ? (
              <img
                src={normalizeMediaUrl(coverImageUrl)}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-rfblue-900 to-rfblue-700 flex items-center justify-center p-8 text-white">
                <span className="font-serif text-3xl font-bold opacity-30">Research Factors</span>
              </div>
            )}
            <div className="absolute top-5 left-5 flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-rfblue shadow-xs">
                {category?.name || 'Research'}
              </span>
              {article.isFeatured && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white shadow-xs">
                  Featured
                </span>
              )}
            </div>
          </div>

          {/* Editorial Content Right */}
          <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between">
            <div>
              <div className="flex items-center space-x-3 text-xs text-ink-light font-medium mb-4">
                <span>{formattedDate}</span>
                <span>•</span>
                <span className="flex items-center">
                  <Clock className="w-3.5 h-3.5 mr-1" />
                  {readingTimeMin} min read
                </span>
              </div>

              <Link to={`/research/${slug}`} className="block group">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-ink-darkest leading-tight tracking-tight group-hover:text-rfblue transition-colors">
                  {title}
                </h2>
                <p className="mt-4 text-sm sm:text-base text-ink-muted leading-relaxed font-light line-clamp-3">
                  {subtitle || excerpt}
                </p>
              </Link>
            </div>

            {/* Author Footer */}
            <div className="mt-8 pt-6 border-t border-paper-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rfblue-50 border border-rfblue-100 flex items-center justify-center font-bold text-sm text-rfblue">
                  {author?.firstName?.[0] || 'A'}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-ink-darkest">{author?.fullName}</h4>
                  <p className="text-[11px] text-ink-light truncate max-w-[160px]">
                    {author?.authorProfile?.headline || 'Editorial Fellow'}
                  </p>
                </div>
              </div>

              <Link
                to={`/research/${slug}`}
                className="w-10 h-10 rounded-full bg-paper flex items-center justify-center text-ink-darkest group-hover:bg-rfblue group-hover:text-white transition-all shadow-xs"
              >
                <ArrowUpRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </article>
    );
  }

  // 2. COMPACT SIDEBAR VARIANT
  if (variant === 'compact') {
    return (
      <article className="group flex items-start space-x-4 py-4 border-b border-paper-border/60 last:border-0">
        <div className="flex-1">
          <div className="flex items-center space-x-2 text-[10px] uppercase font-bold tracking-wider text-rfblue mb-1">
            <span>{category?.name}</span>
            <span className="text-ink-light">• {readingTimeMin}m</span>
          </div>
          <Link to={`/research/${slug}`}>
            <h4 className="text-sm font-serif font-bold text-ink-darkest group-hover:text-rfblue transition-colors leading-snug line-clamp-2">
              {title}
            </h4>
          </Link>
        </div>
        {coverImageUrl && (
          <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-paper">
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

  // 3. STANDARD EDITORIAL GRID CARD (Default)
  return (
    <article className="group flex flex-col justify-between bg-white rounded-2xl border border-paper-border overflow-hidden hover:shadow-lg hover:border-rfblue/30 transition-all duration-300">
      <div>
        {/* Cover Image Container */}
        <Link to={`/research/${slug}`} className="block relative aspect-[16/10] overflow-hidden bg-paper">
          {coverImageUrl ? (
            <img
              src={normalizeMediaUrl(coverImageUrl)}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xs text-ink-light">
              Research Factors
            </div>
          )}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/90 backdrop-blur-md text-rfblue shadow-xs">
              {category?.name || 'Research'}
            </span>
          </div>
        </Link>

        {/* Content Body */}
        <div className="p-6">
          <div className="flex items-center space-x-2 text-xs text-ink-light font-medium mb-2.5">
            <span>{formattedDate}</span>
            <span>•</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {readingTimeMin} min read
            </span>
          </div>

          <Link to={`/research/${slug}`}>
            <h3 className="text-lg font-serif font-bold text-ink-darkest group-hover:text-rfblue transition-colors leading-snug tracking-tight">
              {title}
            </h3>
          </Link>

          <p className="mt-2.5 text-xs text-ink-muted leading-relaxed font-light line-clamp-2">
            {excerpt || subtitle}
          </p>
        </div>
      </div>

      {/* Author Footer */}
      <div className="px-6 py-4 bg-paper/50 border-t border-paper-border/60 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-rfblue-50 text-rfblue flex items-center justify-center font-bold text-xs">
            {author?.firstName?.[0] || 'A'}
          </div>
          <span className="text-xs font-semibold text-ink-darkest">{author?.fullName}</span>
        </div>

        {commentCount > 0 && (
          <span className="flex items-center text-xs text-ink-light">
            <MessageSquare className="w-3.5 h-3.5 mr-1" />
            {commentCount}
          </span>
        )}
      </div>
    </article>
  );
}
