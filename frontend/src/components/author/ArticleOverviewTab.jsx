import React, { useState } from 'react';
import {
  UploadCloud,
  Loader2,
  X,
  Tag,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Layers,
  FileText,
  Image as ImageIcon
} from 'lucide-react';
import { normalizeMediaUrl, mediaApi } from '../../services/media.api.js';

export function ArticleOverviewTab({
  article,
  onChange,
  categories = [],
  isCustomCategory,
  setIsCustomCategory,
  customCategoryName,
  setCustomCategoryName,
  tagInput,
  setTagInput,
  suggestedTags = [],
  showTagSuggestions,
  setShowTagSuggestions,
  onAddTag,
  onRemoveTag,
  canUploadMedia = true,
  onAlert,
  totalWords = 0,
  estimatedReadingTime = 1
}) {
  const [coverInputMode, setCoverInputMode] = useState('upload'); // 'upload' | 'url'
  const [uploadingCover, setUploadingCover] = useState(false);

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!canUploadMedia) {
      if (onAlert) {
        onAlert({
          type: 'error',
          message: 'Permission denied: Your account role does not possess media upload privileges.'
        });
      }
      return;
    }

    setUploadingCover(true);
    try {
      const res = await mediaApi.upload(file, {
        altText: article.coverImageAlt || article.title || 'Article Cover'
      });
      const publicUrl = res.data?.publicUrl || res.publicUrl;
      if (!publicUrl) throw new Error('Failed to retrieve uploaded cover image URL.');

      onChange('coverImageUrl', normalizeMediaUrl(publicUrl));
      if (onAlert) {
        onAlert({
          type: 'success',
          message: 'Cover image uploaded and converted to WebP successfully!'
        });
      }
    } catch (err) {
      if (onAlert) {
        onAlert({
          type: 'error',
          message: err.message || 'Failed to upload cover image.'
        });
      }
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  // Readiness Checklist Calculation
  const checks = [
    { label: 'Title specified (min 5 chars)', ok: (article.title || '').trim().length >= 5 },
    { label: 'Category assigned', ok: Boolean(article.categoryId || (isCustomCategory && customCategoryName.trim())) },
    { label: 'Executive excerpt / abstract', ok: (article.excerpt || '').trim().length >= 20 },
    { label: 'Hero cover image attached', ok: Boolean(article.coverImageUrl) },
    { label: 'Content blocks drafted', ok: (article.blocks || []).length > 0 },
    { label: 'Topic tags assigned', ok: (article.tags || []).length > 0 }
  ];
  const passedCount = checks.filter(c => c.ok).length;

  return (
    <div className="space-y-6">
      {/* 1. ARTICLE READINESS SUMMARY CARD */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800/80 shadow-xs transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Pre-Submission Checklist
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Key requirements before submitting for editorial review
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-900 dark:text-white">
              {passedCount} of {checks.length} Complete
            </span>
            <div className="w-24 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${passedCount === checks.length ? 'bg-emerald-500' : 'bg-blue-600'
                  }`}
                style={{ width: `${(passedCount / checks.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-3">
          {checks.map((chk, i) => (
            <div
              key={i}
              className={`p-2.5 rounded-xl border text-xs flex items-center space-x-1.5 ${chk.ok
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
                  : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400'
                }`}
            >
              {chk.ok ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <div className="w-3.5 h-3.5 rounded-full border border-slate-300 dark:border-slate-700 shrink-0" />
              )}
              <span className="text-sm font-medium truncate">{chk.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. TAXONOMY & READING METRICS */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800/80 shadow-xs transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
          {/* Primary Research Category */}
          <div className="md:col-span-5">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Article Category <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomCategory(!isCustomCategory);
                  if (!isCustomCategory) {
                    onChange('categoryId', '');
                  } else {
                    setCustomCategoryName('');
                  }
                }}
                className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                {isCustomCategory ? 'Select Existing' : '+ Custom Category'}
              </button>
            </div>
            {isCustomCategory ? (
              <input
                type="text"
                value={customCategoryName}
                onChange={(e) => {
                  setCustomCategoryName(e.target.value);
                  onChange('categoryName', e.target.value);
                }}
                placeholder="e.g. Quantum Cryptography, Bioengineering..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium placeholder-slate-400 dark:placeholder-slate-500"
              />
            ) : (
              <select
                value={article.categoryId}
                onChange={(e) => onChange('categoryId', e.target.value)}
                className="w-full text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
              >
                <option value="">Select Field of Study...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Article Format / Genre */}
          <div className="md:col-span-4">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                Article Format / Type <span className="text-red-500">*</span>
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">Editorial genre</span>
            </div>
            <select
              value={article.type || 'RESEARCH'}
              onChange={(e) => onChange('type', e.target.value)}
              className="w-full text-sm p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
            >
              <option value="RESEARCH">Research (Empirical / Experimental)</option>
              <option value="REVIEW">Review (Literature / Technology)</option>
              <option value="COMPARISON">Comparison (Benchmarks / Matrix)</option>
              <option value="ANALYSIS">Analysis (Architectural / Economic)</option>
              <option value="GUIDE">Guide (Methodology / Technical)</option>
              <option value="OPINION">Opinion (Perspective / Commentary)</option>
            </select>
          </div>

          {/* Reading Time Pill */}
          <div className="md:col-span-3 flex md:justify-end items-end pt-2 md:pt-0">
            <div className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 font-medium shadow-2xs">
              <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className='text-sm'>~{estimatedReadingTime} min read</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-sm text-slate-500">{totalWords} words</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. HEADLINE, SUBTITLE, & ABSTRACT */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-5 transition-colors">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Article Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={article.title}
            onChange={(e) => onChange('title', e.target.value)}
            placeholder="Article Title (e.g. Empirical Benchmarks of Quantum Processors...)"
            className="w-full text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 pb-2"
          />
        </div>

        {/* Subtitle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Thesis Statement / Subtitle
          </label>
          <input
            type="text"
            value={article.subtitle || ''}
            onChange={(e) => onChange('subtitle', e.target.value)}
            placeholder="Core thesis statement or explanatory subtitle..."
            className="w-full text-base font-normal text-slate-700 dark:text-slate-300 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 pb-1.5"
          />
        </div>

        {/* Excerpt / Abstract */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Abstract / Executive Summary
          </label>
          <textarea
            value={article.excerpt || ''}
            onChange={(e) => onChange('excerpt', e.target.value)}
            placeholder="Abstract / Executive Summary (visible on archive cards, social cards, and search previews)..."
            rows={3}
            className="w-full text-sm font-normal text-slate-600 dark:text-slate-400 focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500 bg-transparent resize-none border-b border-slate-200 dark:border-slate-800 focus:border-blue-500 pb-1.5 leading-relaxed"
          />
        </div>
      </div>

      {/* 4. HERO COVER IMAGE ASSET */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Hero Cover Asset
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Editorial banner displayed prominently on public article view and magazine index
            </p>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <button
              type="button"
              onClick={() => setCoverInputMode('upload')}
              className={`font-semibold cursor-pointer ${coverInputMode === 'upload' ? 'text-blue-600 dark:text-blue-400 underline' : 'text-slate-500'
                }`}
            >
              Upload File
            </button>
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <button
              type="button"
              onClick={() => setCoverInputMode('url')}
              className={`font-semibold cursor-pointer ${coverInputMode === 'url' ? 'text-blue-600 dark:text-blue-400 underline' : 'text-slate-500'
                }`}
            >
              Enter Direct URL
            </button>
          </div>
        </div>

        {article.coverImageUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-950 group max-h-80 shadow-xs">
              <img
                src={normalizeMediaUrl(article.coverImageUrl)}
                alt={article.coverImageAlt || article.title || 'Cover Asset'}
                className="w-full h-full object-cover max-h-80"
              />
              <div className="absolute top-3 right-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => onChange('coverImageUrl', '')}
                  className="p-1.5 bg-black/70 hover:bg-black text-white rounded-full transition-colors shadow-md cursor-pointer"
                  title="Remove cover asset"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div>
              <input
                type="text"
                value={article.coverImageAlt || ''}
                onChange={(e) => onChange('coverImageAlt', e.target.value)}
                placeholder="Cover Image Alt Description & Figure Caption..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        ) : coverInputMode === 'upload' ? (
          <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-blue-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-all text-center">
            {uploadingCover ? (
              <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-xs font-semibold">Processing via Sharp WebP...</span>
              </div>
            ) : (
              <>
                <UploadCloud className="w-8 h-8 text-blue-600 dark:text-blue-400 mb-2" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Upload Article Cover Image
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  PNG, JPG, WebP up to 8MB (Auto-optimized to modern WebP)
                </span>
              </>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              onChange={handleCoverUpload}
              disabled={uploadingCover}
              className="hidden"
            />
          </label>
        ) : (
          <input
            type="url"
            value={article.coverImageUrl || ''}
            onChange={(e) => onChange('coverImageUrl', e.target.value)}
            placeholder="https://... (Direct image URL or CDN link)"
            className="w-full text-xs p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200"
          />
        )}
      </div>

      {/* 5. TOPIC TAGS (Research Taxonomies) */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Topic Tags (Taxonomies)
            </h3>
            <p className="text-[11px] sm:text-sm text-slate-500 dark:text-slate-400">
              Tag your article to appear in topic feeds and recommendation rails (max 8 tags)
            </p>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {(article.tags || []).length}/8 Tags
          </span>
        </div>

        {/* Existing Tag Chips */}
        {(article.tags || []).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {article.tags.map((tag, idx) => {
              const raw = typeof tag === 'string' ? tag : (tag.name || tag.slug || '');
              const clean = String(raw).replace(/^#+/, '').trim();
              let displayName = (typeof tag === 'object' && tag.name) ? tag.name : clean;
              displayName = displayName.replace(/^#+/, '').trim();
              if (displayName.includes('_') || (displayName.includes('-') && !displayName.includes(' '))) {
                displayName = displayName.replace(/[-_]/g, ' ');
              }
              return (
                <span
                  key={idx}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium bg-[#eef5f6] dark:bg-[#152e35] text-[#0f5466] dark:text-[#5eead4] border border-[#d6e7eb] dark:border-[#1e444e] shadow-2xs"
                >
                  <span>{displayName}</span>
                  <button
                    type="button"
                    onClick={() => onRemoveTag(idx)}
                    className="p-0.5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                    title="Remove tag"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              );
            })}
          </div>
        )}

        {/* Tag Input Field & Autocomplete */}
        <div className="relative">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(true);
              }}
              onFocus={() => setShowTagSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  if (tagInput.trim()) onAddTag(tagInput.trim());
                }
              }}
              placeholder="Add topic tag (e.g. Artificial Intelligence, Solid State Battery)..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-200 font-medium"
            />
            <button
              type="button"
              onClick={() => {
                if (tagInput.trim()) onAddTag(tagInput.trim());
              }}
              disabled={!tagInput.trim() || (article.tags || []).length >= 8}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors disabled:opacity-40 shrink-0 cursor-pointer shadow-xs"
            >
              Add Tag
            </button>
          </div>

          {/* Autocomplete Suggestions */}
          {showTagSuggestions && suggestedTags.length > 0 && (
            <div className="absolute bottom-full left-0 mb-1.5 w-full bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-750 py-1.5 z-40 max-h-48 overflow-y-auto">
              <div className="px-3 py-1 text-xs font-bold uppercase tracking-wider text-slate-500">
                Suggested Taxonomies
              </div>
              {suggestedTags.map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => onAddTag(st)}
                  className="w-full text-left px-3 py-1.5 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between text-slate-800 dark:text-slate-200 hover:text-blue-600 transition-colors cursor-pointer"
                >
                  <span className="font-medium">{st.name}</span>

                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
