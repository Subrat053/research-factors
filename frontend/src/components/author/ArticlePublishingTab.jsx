import React from 'react';
import {
  Globe,
  Send,
  Save,
  Archive,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Loader2,
  ExternalLink
} from 'lucide-react';

export function ArticlePublishingTab({
  article,
  currentId,
  canPublish = false,
  canSubmit = true,
  savingDraft = false,
  submitting = false,
  onSaveDraft,
  onSubmitForReview,
  onDirectPublish,
  onUnpublish,
  onPreviewLive
}) {
  return (
    <div className="space-y-6">
      {/* 1. EDITORIAL REJECTION / REVISION NOTICE */}
      {article.status === 'REJECTED' && article.rejectionReason && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start space-x-3.5">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Editorial Peer Feedback & Required Revisions
            </h4>
            <p className="text-sm text-slate-200 leading-relaxed">
              {article.rejectionReason}
            </p>
          </div>
        </div>
      )}

      {/* 2. LIFECYCLE & STATUS SUMMARY CARD */}
      <div className="bg-white dark:bg-slate-900/80 rounded-2xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800/80 shadow-xs space-y-6 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Manuscript Lifecycle & Publishing Workflow
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage publication status, peer review checkpoints, and public visibility
            </p>
          </div>
          <span
            className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
              article.status === 'PUBLISHED'
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : article.status === 'PENDING_REVIEW'
                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : article.status === 'REJECTED'
                ? 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700'
            }`}
          >
            {article.status === 'PENDING_REVIEW'
              ? 'Under Editorial Review'
              : article.status === 'REJECTED'
              ? 'Changes Requested'
              : article.status === 'PUBLISHED'
              ? 'Published Live'
              : 'Draft Manuscript'}
          </span>
        </div>

        {/* Workflow Pipeline Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className={`p-4 rounded-xl border ${
            article.status === 'DRAFT'
              ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800'
              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
          }`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Step 1</span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Authoring & Draft</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Add empirical prose, section chapters, and tables.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            article.status === 'PENDING_REVIEW'
              ? 'bg-amber-50/50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
          }`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Step 2</span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Editorial Review</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Submitted for peer review and editorial verification.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            article.status === 'PUBLISHED'
              ? 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
          }`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Step 3</span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Published Live</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Visible on public digital magazine and indexed by search engines.
            </p>
          </div>

          <div className={`p-4 rounded-xl border ${
            article.status === 'ARCHIVED'
              ? 'bg-purple-50/50 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800'
              : 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800'
          }`}>
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Step 4</span>
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">Archived / Closed</h4>
            <p className="text-[11px] text-slate-500 mt-1">
              Unpublished from public magazine feed.
            </p>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onSaveDraft}
              disabled={savingDraft || submitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              {savingDraft ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Draft Changes</span>
            </button>

            <button
              type="button"
              onClick={onPreviewLive}
              disabled={savingDraft || submitting}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <ExternalLink className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Preview Live Simulation</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {canPublish ? (
              article.status === 'PUBLISHED' ? (
                <button
                  type="button"
                  onClick={onUnpublish}
                  disabled={submitting}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
                  <span>Unpublish Manuscript</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onDirectPublish}
                  disabled={submitting}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                  <span>Publish Live to Public</span>
                </button>
              )
            ) : article.status === 'PENDING_REVIEW' ? (
              <button
                type="button"
                disabled
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-300 text-xs font-semibold cursor-not-allowed"
              >
                <Clock className="w-4 h-4" />
                <span>Currently Under Peer Review</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onSubmitForReview}
                disabled={submitting || !canSubmit}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{article.status === 'REJECTED' ? 'Re-submit for Review' : 'Submit for Review'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
