import React from 'react';
import { ShieldAlert, Sparkles, Search } from 'lucide-react';
import { ArticleSeoStudio } from '../article/ArticleSeoStudio.jsx';

export function ArticleSeoTab({
  article,
  onChange,
  seoMetadata,
  resolvedSeo,
  onRegenerate,
  isRegenerating,
  canAccessSeo = false
}) {
  if (!canAccessSeo) {
    return (
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs text-center max-w-2xl mx-auto space-y-4">
        <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl w-fit mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Automated Search Engine Optimization
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          As a contributing author, you do not need to manually configure technical SEO tags, OpenGraph schemas, or SERP metadata. The Research Factors editorial engine automatically generates and optimizes search metadata from your article title, abstract, and section headings.
        </p>
        <p className="text-[11px] text-slate-500 dark:text-slate-500">
          Senior editors and publication administrators review and adjust technical indexation directives prior to public release.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ArticleSeoStudio
        article={article}
        onChange={onChange}
        seoMetadata={seoMetadata}
        resolvedSeo={resolvedSeo}
        onRegenerate={onRegenerate}
        isRegenerating={isRegenerating}
      />
    </div>
  );
}
