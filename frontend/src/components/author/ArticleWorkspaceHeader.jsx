import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Send,
  Globe,
  Archive,
  ExternalLink,
  Clock,
  Check,
  Loader2,
  FileText,
  AlertCircle
} from 'lucide-react';

export function ArticleWorkspaceHeader({
  article,
  currentId,
  saveStatus,
  savingDraft,
  submitting,
  totalWords = 0,
  estimatedReadingTime = 1,
  canPublish = false,
  canSubmit = true,
  activeTab,
  onTabChange,
  visibleTabs = [],
  onSaveDraft,
  onPreviewLive,
  onSubmitForReview,
  onDirectPublish,
  onUnpublish,
  onModifyChanges,
  onDiscardDraft
}) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      {/* Top Action & Status Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Back Link & Manuscript Breadcrumb */}
        <div className="flex items-center space-x-3 min-w-0">
          <Link
            to="/admin/articles"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            title="Return to Articles Archive"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {article.type || 'RESEARCH'} MANUSCRIPT
              </span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                  article.status === 'PUBLISHED'
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                    : article.status === 'PENDING_REVIEW'
                    ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                    : article.status === 'REJECTED'
                    ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
                }`}
              >
                {article.status === 'PENDING_REVIEW'
                  ? 'Under Review'
                  : article.status === 'REJECTED'
                  ? 'Changes Requested'
                  : article.status === 'PUBLISHED'
                  ? 'Published'
                  : 'Draft'}
              </span>
              {article.status === 'PUBLISHED' && article.hasUnpublishedChanges && (
                <>
                  <span className="text-slate-300 dark:text-slate-700">•</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider border bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
                    Unpublished Changes
                  </span>
                </>
              )}
            </div>
            <h1 className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
              {article.title ? article.title : 'Untitled Manuscript'}
            </h1>
          </div>
        </div>

        {/* Center / Right: Save Status, Reading Time, and Actions */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-2.5">
          {/* Reading Metric Pill */}
          <div className="hidden sm:inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <Clock className="w-3 h-3 text-blue-600 dark:text-blue-400" />
            <span>{totalWords} words</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>~{estimatedReadingTime}m read</span>
          </div>

          {/* Autosave Status Pill */}
          <span
            className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all ${
              saveStatus === 'saved'
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : saveStatus === 'saving'
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 animate-pulse'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700'
            }`}
          >
            {saveStatus === 'saved' ? '● Saved' : saveStatus === 'saving' ? 'Saving...' : '● Unsaved'}
          </span>

          {/* Live Preview Button */}
          <button
            type="button"
            onClick={onPreviewLive}
            disabled={savingDraft || submitting}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title="Open live simulation in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden sm:inline">Preview</span>
          </button>

          {/* Manual Save Draft Button */}
          <button
            type="button"
            onClick={onSaveDraft}
            disabled={savingDraft || submitting}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
            title={article.status === 'PUBLISHED' ? "Save modifications to draft without altering live publication" : "Save draft changes"}
          >
            {savingDraft ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Draft</span>
          </button>

          {/* Discard Draft Option if published article has staged changes */}
          {article.status === 'PUBLISHED' && article.hasUnpublishedChanges && onDiscardDraft && (
            <button
              type="button"
              onClick={onDiscardDraft}
              disabled={savingDraft || submitting}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 text-slate-600 dark:text-slate-300 text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-50"
              title="Discard draft edits and revert to live version"
            >
              <span>Discard Draft</span>
            </button>
          )}

          {/* Primary Action Button: Modify Changes / Publish / Submit Review */}
          {article.status === 'PUBLISHED' ? (
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onModifyChanges}
                disabled={submitting || savingDraft || (!canPublish && !canSubmit)}
                className={`inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer ${
                  canPublish
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-blue-600 hover:bg-blue-500'
                }`}
                title={
                  canPublish
                    ? 'Modify article and publish changes live immediately'
                    : 'Submit article modifications for editorial peer review'
                }
              >
                {submitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : canPublish ? (
                  <Globe className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Modify Changes</span>
              </button>

              {canPublish && (
                <button
                  type="button"
                  onClick={onUnpublish}
                  disabled={submitting}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                  title="Unpublish article back to archive"
                >
                  {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
                  <span>Unpublish</span>
                </button>
              )}
            </div>
          ) : canPublish ? (
            <button
              type="button"
              onClick={onDirectPublish}
              disabled={submitting}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
              <span>Publish</span>
            </button>
          ) : article.status === 'PENDING_REVIEW' ? (
            <button
              type="button"
              disabled
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold cursor-not-allowed"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Under Review</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onSubmitForReview}
              disabled={submitting || !canSubmit}
              className="inline-flex items-center space-x-1.5 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>{article.status === 'REJECTED' ? 'Re-submit' : 'Submit Review'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom Workspace Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 flex items-center space-x-1 sm:space-x-2 overflow-x-auto border-t border-slate-100 dark:border-slate-800/60 scrollbar-none py-1.5">
        {visibleTabs.map(tab => {
          const Icon = tab.icon || FileText;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/60 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isActive
                    ? 'bg-blue-200/60 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
}
