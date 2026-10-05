import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Send,
  Loader2,
  ArrowLeft,
  X,
  Sparkles
} from 'lucide-react';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { BlockRenderer } from '../../components/article/BlockRenderer.jsx';

export default function ArticleReviewQueuePage() {
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState('PENDING_REVIEW');
  const [activeArticle, setActiveArticle] = useState(null);
  const [reviewAction, setReviewAction] = useState('PUBLISH'); // 'PUBLISH', 'APPROVE', 'REJECT'
  const [feedbackNotes, setFeedbackNotes] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-review-queue', selectedStatus],
    queryFn: () => adminApi.getReviewQueue({ status: selectedStatus === 'ALL' ? undefined : selectedStatus })
  });

  const articles = data?.data || [];

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!activeArticle) return;

    setProcessing(true);
    try {
      await adminApi.reviewArticle(activeArticle.id, {
        action: reviewAction,
        feedback: feedbackNotes,
        isFeatured
      });
      setAlertMsg({
        type: 'success',
        text: `Manuscript successfully updated with action: ${reviewAction}${isFeatured ? ' (Featured on Homepage)' : ''}`
      });
      setActiveArticle(null);
      setFeedbackNotes('');
      setIsFeatured(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      queryClient.invalidateQueries({ queryKey: ['featured-article'] });
    } catch (err) {
      setAlertMsg({
        type: 'error',
        text: err.response?.data?.error?.message || 'Review action failed. Please try again.'
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <AdminLayout
      title="Editorial Review Desk"
      subtitle="Peer review incoming articles, inspect empirical content blocks, request revisions, or publish featured research"
      actions={
        <Link
          to="/admin/articles"
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-850 hover:bg-blue-600 hover:text-white border border-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Articles</span>
        </Link>
      }
    >
      <Helmet>
        <title>Editorial Review Desk — Research Factors Admin</title>
      </Helmet>

      {/* Alert Banner */}
      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
            }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="p-1 opacity-70 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Filter Tabs */}
      <div className="flex items-center space-x-2 pb-4 mb-6 border-b border-slate-200 dark:border-slate-800/80 overflow-x-auto">
        {[
          { key: 'PENDING_REVIEW', label: 'Pending Review' },
          { key: 'APPROVED', label: 'Approved / Scheduled' },
          { key: 'REJECTED', label: 'Changes Requested' },
          { key: 'ALL', label: 'All Articles' }
        ].map((st) => (
          <button
            key={st.key}
            onClick={() => setSelectedStatus(st.key)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${selectedStatus === st.key
                ? 'bg-blue-600 text-white shadow-xs shadow-blue-600/30'
                : 'bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Review Queue Table */}
      <div className="admin-table-container">
        {isLoading ? (
          <div className="py-24 flex flex-col justify-center items-center text-slate-500 dark:text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-blue-500 mb-2" />
            <span className="text-xs">Fetching review queue...</span>
          </div>
        ) : articles.length === 0 ? (
          <div className="py-24 text-center text-slate-500 dark:text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto mb-3 border border-emerald-500/20">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-base font-bold text-slate-900 dark:text-white">Review Queue Clear</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              No articles currently match the selected status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100/70 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3 font-semibold">Manuscript</th>
                  <th className="px-6 py-3 font-semibold">Field</th>
                  <th className="px-6 py-3 font-semibold">Author</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60">
                {articles.map((article) => (
                  <tr key={article.id} className="admin-table-row">
                    <td className="px-6 py-4 max-w-sm">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{article.title}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate mt-0.5">
                        {article.excerpt || 'No abstract summary provided'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {article.category?.name || 'General'}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                      {article.author?.fullName || 'Researcher'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${article.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : article.status === 'PENDING_REVIEW'
                                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                                : article.status === 'REJECTED'
                                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                        >
                          {article.status === 'PENDING_REVIEW'
                            ? 'Pending Review'
                            : article.status === 'REJECTED'
                              ? 'Changes Requested'
                              : article.status === 'PUBLISHED'
                                ? 'Published'
                                : article.status}
                        </span>
                        {article.isFeatured && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            <Sparkles className="w-2.5 h-2.5 mr-1" />
                            Featured
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setActiveArticle(article);
                          setIsFeatured(Boolean(article.isFeatured));
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect & Review</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Inspection Modal */}
      {activeArticle && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="admin-modal rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-8 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/90">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 block mb-0.5">
                  Editorial Review Desk
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white line-clamp-1">
                  {activeArticle.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Manuscript Details & Blocks */}
            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-slate-100/60 dark:bg-slate-950/40">
              {/* Metadata Pill */}
              <div className="p-4 admin-card-inner rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-300">
                <span>Author: <strong className="text-slate-900 dark:text-white">{activeArticle.author?.fullName}</strong></span>
                <span>Category: <strong className="text-slate-900 dark:text-white">{activeArticle.category?.name || 'General'}</strong></span>
                <span>Reading Time: <strong className="text-slate-900 dark:text-white">{activeArticle.readingTimeMin} min</strong></span>
                <span>Current Status: <strong className="text-blue-600 dark:text-blue-400">{activeArticle.status}</strong></span>
              </div>

              {/* Excerpt */}
              {activeArticle.excerpt && (
                <div className="p-4 admin-card rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Abstract / Executive Summary
                  </span>
                  <p className="text-sm italic text-slate-700 dark:text-slate-300 leading-relaxed">
                    {activeArticle.excerpt}
                  </p>
                </div>
              )}

              {/* Manuscript Blocks Preview */}
              <div className="bg-white text-ink p-8 rounded-2xl shadow-inner max-w-prose mx-auto border border-paper-border">
                <BlockRenderer blocks={activeArticle.blocks} />
              </div>
            </div>

            {/* Modal Footer: Action Form */}
            <form
              onSubmit={handleReviewSubmit}
              className="px-8 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex-1 w-full">
                <input
                  type="text"
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Feedback / internal editorial notes..."
                  className="admin-input w-full text-xs p-2.5 rounded-xl"
                />
              </div>

              <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
                {/* Featured Toggle */}
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 cursor-pointer select-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 transition-colors">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700"
                  />
                  <span>Featured</span>
                </label>

                {/* Reject */}
                <button
                  type="button"
                  onClick={() => {
                    setReviewAction('REJECT');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${reviewAction === 'REJECT'
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400 hover:bg-red-500/20'
                    }`}
                >
                  Reject with Notes
                </button>

                {/* Approve */}
                <button
                  type="button"
                  onClick={() => {
                    setReviewAction('APPROVE');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${reviewAction === 'APPROVE'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/20'
                    }`}
                >
                  Approve
                </button>

                {/* Direct Publish Live */}
                <button
                  type="submit"
                  disabled={processing}
                  onClick={() => {
                    setReviewAction('PUBLISH');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {processing ? 'Processing...' : 'Publish Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
