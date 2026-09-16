import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  EyeOff,
  UserX,
  X,
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function ReportTriagePage() {
  const queryClient = useQueryClient();
  const [reasonFilter, setReasonFilter] = useState('');
  const [page, setPage] = useState(1);
  const [alertMsg, setAlertMsg] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports-queue', { reason: reasonFilter, page }],
    queryFn: async () => {
      const res = await adminApi.listReports({ reason: reasonFilter, page, limit: 15 });
      return res.data;
    }
  });

  const reports = data?.reports || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  const resolveMutation = useMutation({
    mutationFn: ({ id, action, notes }) => adminApi.resolveReport(id, { action, notes }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-reports-queue']);
      setAlertMsg({ type: 'success', text: `Report resolved: ${res.data.resolvedAction}` });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to resolve report' });
    }
  });

  return (
    <AdminLayout
      title="Reader Reports Triage Queue"
      subtitle="Examine community reports filed against reader comments and execute safety actions"
    >
      <Helmet>
        <title>Report Triage — Research Factors Admin</title>
      </Helmet>

      {/* Alerts */}
      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            alertMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold text-slate-400">Filter Reason:</span>
          <select
            value={reasonFilter}
            onChange={(e) => {
              setReasonFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
          >
            <option value="">All Flagged Reasons</option>
            <option value="SPAM">Spam</option>
            <option value="OFFENSIVE">Offensive</option>
            <option value="HARASSMENT">Harassment</option>
            <option value="MISINFORMATION">Misinformation</option>
            <option value="PERSONAL_INFO">Personal Information</option>
            <option value="PROMOTIONAL">Promotional Content</option>
            <option value="OTHER">Other</option>
          </select>
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/60 rounded-2xl border border-slate-800">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading moderation reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-20 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Pending Reports</h3>
            <p className="text-xs text-slate-400 mt-1">Reader community reports queue is currently empty.</p>
          </div>
        ) : (
          reports.map((r) => (
            <div
              key={r.id}
              className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-start md:justify-between gap-5"
            >
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-red-500/20 text-red-300 border border-red-500/30">
                    Flagged: {r.reason}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Reported by <strong className="text-slate-200">{r.reporter?.name}</strong> on{' '}
                    {new Date(r.createdAt).toLocaleString()}
                  </span>
                </div>

                {r.details && (
                  <p className="text-xs text-slate-300 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                    "{r.details}"
                  </p>
                )}

                {/* Target Comment Details */}
                {r.comment ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                      <div>
                        Comment by <strong className="text-slate-200">{r.comment.author?.name}</strong>{' '}
                        <span className="text-[10px]">({r.comment.author?.email})</span>
                      </div>
                      <span className="text-[11px] font-mono">{r.comment.status}</span>
                    </div>
                    <p className="text-xs text-white leading-relaxed">
                      {r.comment.content}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Target comment has been deleted.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap md:flex-col gap-2 shrink-0 md:min-w-[160px]">
                <button
                  onClick={() => resolveMutation.mutate({ id: r.id, action: 'DISMISS' })}
                  disabled={resolveMutation.isPending}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                >
                  Dismiss Report
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ id: r.id, action: 'HIDE_COMMENT' })}
                  disabled={resolveMutation.isPending}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors"
                >
                  Hide Comment
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ id: r.id, action: 'DELETE_COMMENT' })}
                  disabled={resolveMutation.isPending}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 transition-colors"
                >
                  Delete Comment
                </button>
                <button
                  onClick={() => resolveMutation.mutate({ id: r.id, action: 'SUSPEND_AUTHOR', notes: `Suspended due to report #${r.id}` })}
                  disabled={resolveMutation.isPending}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-700 text-white shadow-xs transition-colors"
                >
                  Suspend Commenter
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </AdminLayout>
  );
}
