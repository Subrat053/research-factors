import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getDynamicCategoryTheme, resolveCategoryArt } from '../../utils/categoryTheme.js';

/**
 * Editorial Category Card Component
 * Features:
 * - Upper-right Flaticon illustration with corner-only fade at text meeting point
 * - Dynamically computed ambient glow lighting matching category palette
 * - Elevated, prominent editorial heading
 * - 3-line clamped description
 * - Responsive layout for both infinite marquee sliders and responsive grids
 */
export function CategoryCard({ topic, className = '' }) {
  if (!topic) return null;

  const { name, slug, desc, description, articleCount } = topic;
  const theme = getDynamicCategoryTheme(name, slug);
  const artUrl = resolveCategoryArt(topic);
  const displayDesc = desc || description || `Empirical analysis, benchmarks, and research in ${name}.`;

  const count = typeof articleCount === 'number'
    ? articleCount
    : (typeof topic._count?.articles === 'number' ? topic._count.articles : null);

  const countDisplay = typeof count === 'number'
    ? `${count} ${count === 1 ? 'article' : 'articles'}`
    : (articleCount || 'Explore');

  // Detect whether artUrl is a photo/raster upload (non-SVG, not in /icons/categories/)
  const isPhoto = /\.(jpg|jpeg|webp|png)(\?|$)/i.test(artUrl) && !artUrl.includes('/icons/categories/');

  return (
    <Link
      to={`/categories/${slug}`}
      className={`group relative bg-white rounded-2xl border border-paper-border hover:border-slate-300 shadow-2xs hover:shadow-md transition-all duration-200 flex flex-col justify-between overflow-hidden p-4 sm:p-5 ${className}`}
      aria-label={`Explore ${name} category`}
    >
      {/* 1. Soft Ambient Chromatic Glow Underlayer */}
      <div
        className="pointer-events-none absolute -top-8 -right-8 w-36 h-36 sm:w-44 sm:h-44 rounded-full blur-3xl opacity-20 group-hover:opacity-35 transition-opacity duration-300"
        style={{ backgroundColor: theme.accent }}
        aria-hidden="true"
      />

      {/* 2. Content Zone (Floated Art: Image on right, Text wraps around it) */}
      <div className="relative z-10">
        {/* Floated Art Box: Takes prominent right side; text wraps naturally around left & bottom */}
        <div className="float-right ml-3 sm:ml-4 mb-1.5 w-24 sm:w-28 md:w-30 h-24 sm:h-24 md:h-28 flex items-center justify-center overflow-hidden rounded-xl shrink-0">
        {/* <div className="float-right ml-3 sm:ml-4 mb-1.5 w-22 sm:w-28 md:w-30 h-24 sm:h-24 md:h-28 flex items-center justify-center overflow-hidden rounded-xl shrink-0"> */}
          <img
            src={artUrl}
            alt=""
            loading="lazy"
            className={`w-full h-full transition-transform duration-300 group-hover:scale-105 ${
              isPhoto
                ? 'object-cover rounded-xl shadow-2xs'
                : 'object-contain'
            }`}
          />
        </div>

        {/* Heading: Sits to the left of the image without overriding */}
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-ink-darkest group-hover:text-rfblue transition-colors leading-tight">
          {name}
        </h3>

        {/* Description: Lines 1 & 2 stop before the image; line 3 wraps full-width below the image */}
        <p className="mt-2 text-xs sm:text-sm text-ink-muted leading-relaxed overflow-hidden max-h-[5rem] sm:max-h-[4.95rem]">
          {displayDesc}
        </p>
      </div>

      {/* 3. Card Footer: Article Count & Micro-animated Action Button */}
      <div className="relative z-10 mt-4 sm:mt-5 pt-2 sm:pt-3.5 border-t border-paper-border/60 flex items-center justify-between">
        <span className="text-xs sm:text-sm font-semibold text-ink-muted group-hover:text-ink transition-colors">
          {countDisplay}
        </span>
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-paper border border-paper-border/80 flex items-center justify-center text-ink group-hover:bg-rfblue group-hover:text-white group-hover:border-rfblue transition-all duration-200 shrink-0">
          <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </Link>
  );
}

export default CategoryCard;
