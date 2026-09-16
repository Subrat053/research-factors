import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  EyeOff,
  Trash2,
  ShieldAlert,
  Loader2,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  X
} from 'lucide-react';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';

export default function ModerationQueuePage() {
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  // Auto-hide feedback toast after 5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-moderation-queue'],
    queryFn: () => adminApi.getModerationQueue()
  });

  const comments = data?.data || [];

  const handleModerate = async (commentId, action) => {
    setProcessingId(commentId);
    try {
      await adminApi.moderateComment(commentId, { action });
      const actionLabels = {
        APPROVE: 'Comment approved and cleared from queue.',
        REMOVE: 'Comment has been hidden from public discussions.',
        SPAM: 'Comment marked as spam and permanently suppressed.'
      };
      setFeedback({ type: 'success', text: actionLabels[action] || 'Action completed successfully.' });
      refetch();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || 'Moderation action failed. Please check your permissions.'
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AdminLayout
      title="Community Moderation Desk"
      subtitle="Review reported comments, resolve flag complaints, and enforce editorial community guidelines"
    >
      <Helmet>
        <title>Community Moderation Desk — Research Factors Backoffice</title>
      </Helmet>

      {/* Auto-dismissing Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between transition-all ${
            feedback.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
          }`}
        >
          <div className="flex items-center space-x-3 text-xs font-medium">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      {isLoading ? (
        <div className="py-24 flex flex-col justify-center items-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <span className="text-xs font-medium">Loading moderation reports...</span>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-300">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-400" />
          <p className="text-sm font-semibold">Unable to fetch moderation queue</p>
          <p className="text-xs text-slate-400 mt-1">{error?.message || 'Access denied or server error'}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-800 text-xs text-white hover:bg-slate-700 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-16 text-center">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-serif font-bold text-white">No Flagged Comments</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            All peer responses and reader comments are currently adhering to editorial and community standards.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-6 hover:border-slate-700/80 transition-all"
            >
              <div className="flex-1 space-y-3 min-w-0">
                {/* Meta Header */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-bold text-slate-200">
                    {item.author?.name || 'Anonymous Reader'}
                  </span>
                  <span className="text-slate-500">on</span>
                  {item.article?.slug ? (
                    <Link
                      to={`/articles/${item.article.slug}`}
                      target="_blank"
                      className="font-medium text-blue-400 hover:text-blue-300 hover:underline inline-flex items-center space-x-1 truncate max-w-sm"
                    >
                      <span className="truncate">{item.article.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 ml-1 opacity-70" />
                    </Link>
                  ) : (
                    <span className="text-slate-400">{item.article?.title || 'Unknown Manuscript'}</span>
                  )}
                  <span className="px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 text-[10px] font-bold">
                    {item.reportCount} {item.reportCount === 1 ? 'Report' : 'Reports'}
                  </span>
                </div>

                {/* Comment Content Preview */}
                <div
                  className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/80 p-3.5 rounded-xl border border-slate-800/80"
                  dangerouslySetInnerHTML={{ __html: item.content }}
                />

                {/* Reported Reasons */}
                {item.reports && item.reports.length > 0 && (
                  <div className="bg-slate-900/90 rounded-xl p-3 border border-slate-800/60 space-y-1.5">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                      Report Citations ({item.reports.length}):
                    </span>
                    <div className="space-y-1">
                      {item.reports.map((r, idx) => (
                        <div key={idx} className="text-[11px] text-slate-300 flex items-start space-x-2">
                          <span className="text-red-400 font-medium shrink-0">• {r.reason}</span>
                          <span className="text-slate-500">
                            flagged by {r.reporter || 'Reader'} {r.details && `("${r.details}")`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-start">
                <button
                  onClick={() => handleModerate(item.id, 'APPROVE')}
                  disabled={processingId === item.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all disabled:opacity-50"
                  title="Approve comment and dismiss all flags"
                >
                  {processingId === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Keep Visible</span>
                </button>

                <button
                  onClick={() => handleModerate(item.id, 'REMOVE')}
                  disabled={processingId === item.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all disabled:opacity-50"
                  title="Hide comment from discussion"
                >
                  <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hide</span>
                </button>

                <button
                  onClick={() => handleModerate(item.id, 'SPAM')}
                  disabled={processingId === item.id}
                  className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/30 transition-all disabled:opacity-50"
                  title="Mark comment as spam and ban pattern"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-400" />
                  <span>Spam</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
}
