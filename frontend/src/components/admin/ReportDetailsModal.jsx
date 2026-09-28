import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/admin.api.js';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  User,
  Clock,
  ExternalLink,
  CheckCircle,
  EyeOff,
  Trash2,
  Loader2,
  FileText
} from 'lucide-react';

const REASON_COLORS = {
  SPAM: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30',
  HARASSMENT: 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30',
  OFFENSIVE: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
  MISINFORMATION: 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30',
  PERSONAL_INFO: 'bg-orange-500/10 text-orange-700 dark:text-orange-300 border-orange-500/30',
  PROMOTIONAL: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30',
  OTHER: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30'
};

export const ReportDetailsModal = ({ commentId, onClose, onActionComplete }) => {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState(null);

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-comment-reports', commentId],
    queryFn: async () => {
      const res = await adminApi.getCommentReports(commentId);
      return res.data;
    },
    enabled: Boolean(commentId)
  });

  const moderateMutation = useMutation({
    mutationFn: ({ action, reason }) =>
      adminApi.moderateComment(commentId, { action, reason }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-comment-reports', commentId] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-queue'] });
      if (onActionComplete) {
        onActionComplete(variables.action);
      }
      onClose();
    },
    onError: (err) => {
      setActionError(err.response?.data?.error?.message || err.message || 'Action failed');
    }
  });

  const comment = data?.comment;
  const reports = data?.reports || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-zinc-800 flex items-center justify-between bg-slate-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Reported Comment Inspection
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Granular triage of reader violation complaints and enforcement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {actionError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 font-medium flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{actionError}</span>
            </div>
          )}

          {isLoading ? (
            <div className="py-16 flex flex-col items-center justify-center space-y-2 text-slate-500">
              <Loader2 className="w-6 h-6 animate-spin text-rfblue" />
              <span>Loading report details...</span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-red-600 dark:text-red-400 space-y-2">
              <p className="font-semibold">{error?.message || 'Failed to load report details'}</p>
              <button
                onClick={() => refetch()}
                className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-zinc-800 text-xs font-semibold hover:bg-slate-200"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              {/* Offending Comment Snapshot */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <div className="flex items-center space-x-2 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-900 dark:text-white font-semibold">
                      {comment?.author?.name || 'Anonymous Author'}
                    </span>
                    <span className="text-[11px]">({comment?.author?.email || 'No email'})</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    comment?.status === 'VISIBLE'
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : comment?.status === 'REPORTED'
                      ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300'
                      : 'bg-slate-500/10 text-slate-700 dark:text-slate-300'
                  }`}>
                    {comment?.status}
                  </span>
                </div>

                <div
                  className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans prose dark:prose-invert max-w-none text-xs"
                  dangerouslySetInnerHTML={{ __html: comment?.content || '' }}
                />

                {comment?.article && (
                  <div className="pt-2 border-t border-slate-200/60 dark:border-zinc-700/60 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="truncate max-w-md">Article: <strong className="text-slate-700 dark:text-slate-300">{comment.article.title}</strong></span>
                    <a
                      href={`/rf/articles/${comment.article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rfblue hover:underline inline-flex items-center gap-1 shrink-0 font-medium"
                    >
                      <span>View in Context</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Reader Reports Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Community Reports ({reports.length})
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    Filed by authenticated readers
                  </span>
                </div>

                {reports.length === 0 ? (
                  <p className="text-slate-400 italic py-3 text-center">No active reports filed.</p>
                ) : (
                  <div className="space-y-2.5">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="p-3.5 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                                REASON_COLORS[report.reason] || REASON_COLORS.OTHER
                              }`}
                            >
                              {report.reason}
                            </span>
                            <span className="font-semibold text-slate-800 dark:text-slate-200">
                              {report.reporter?.name || 'Reader'}
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              ({report.reporter?.email})
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(report.createdAt).toLocaleString()}
                          </span>
                        </div>

                        {report.details ? (
                          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-zinc-800/40 text-slate-600 dark:text-slate-300 italic border-l-2 border-amber-500">
                            "{report.details}"
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-[11px]">No additional explanation provided.</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-800 transition-colors"
          >
            Close
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={moderateMutation.isPending}
              onClick={() => moderateMutation.mutate({ action: 'APPROVE', reason: 'Dismissed reader complaints' })}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {moderateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
              <span>Dismiss & Approve</span>
            </button>

            <button
              type="button"
              disabled={moderateMutation.isPending}
              onClick={() => moderateMutation.mutate({ action: 'HIDE', reason: 'Quarantined after reader reports' })}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {moderateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>Hide Comment</span>
            </button>

            <button
              type="button"
              disabled={moderateMutation.isPending}
              onClick={() => moderateMutation.mutate({ action: 'DELETE', reason: 'Permanently deleted for violation' })}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center space-x-1.5 disabled:opacity-50"
            >
              {moderateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Delete Comment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
