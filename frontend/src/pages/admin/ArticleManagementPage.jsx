import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Archive,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink
} from 'lucide-react';

export default function ArticleManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');

  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Fetch Articles
  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles-all', { search, status: statusFilter, page }],
    queryFn: async () => {
      const res = await adminApi.listArticles({ search, status: statusFilter, page, limit: 15 });
      return res.data;
    }
  });

  const articles = data?.articles || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Mutations
  const scheduleMutation = useMutation({
    mutationFn: ({ id, scheduledAt }) => adminApi.scheduleArticle(id, { scheduledAt }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-articles-all']);
      setScheduleModalOpen(false);
      setScheduledDate('');
      setAlertMsg({ type: 'success', text: res.message || 'Article successfully scheduled!' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to schedule publication' });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => adminApi.archiveArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-articles-all']);
      setAlertMsg({ type: 'success', text: 'Article archived.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to archive article' });
    }
  });

  const forceDeleteMutation = useMutation({
    mutationFn: (id) => adminApi.forceDeleteArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-articles-all']);
      setAlertMsg({ type: 'success', text: 'Article permanently deleted.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete article' });
    }
  });

  const handleOpenScheduleModal = (article) => {
    setSelectedArticle(article);
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    setScheduledDate(tomorrow.toISOString().slice(0, 16));
    setScheduleModalOpen(true);
  };

  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!selectedArticle || !scheduledDate) return;
    scheduleMutation.mutate({ id: selectedArticle.id, scheduledAt: scheduledDate });
  };

  return (
    <AdminLayout
      title="All Research Manuscripts"
      subtitle="Complete editorial control across all manuscript stages: Drafts, Review Queue, Live, and Archived"
      actions={
        <Link
          to="/editor"
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
        >
          <span>Create New Manuscript</span>
        </Link>
      }
    >
      <Helmet>
        <title>Manuscripts Management — Research Factors Admin</title>
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

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search manuscripts by title, excerpt, or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved / Scheduled</option>
          <option value="DRAFT">Draft</option>
          <option value="REJECTED">Rejected</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Articles Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading manuscripts...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-20 text-center">
            <FileText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Manuscripts Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search keywords.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6">Manuscript Title</th>
                  <th className="py-3.5 px-6">Author</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Reads</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {articles.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 max-w-sm">
                      <h4 className="font-semibold text-white truncate" title={a.title}>
                        {a.title}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-500 truncate block mt-0.5">
                        /{a.slug}
                      </span>
                    </td>

                    <td className="py-4 px-6">
                      <span className="font-semibold text-slate-200 block">{a.author?.name}</span>
                      <span className="text-[10px] text-slate-500">{a.author?.email}</span>
                    </td>

                    <td className="py-4 px-6 text-slate-300">
                      {a.category?.name || 'Uncategorized'}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          a.status === 'PUBLISHED'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                            : a.status === 'PENDING_REVIEW'
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                            : a.status === 'APPROVED'
                            ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25'
                            : a.status === 'REJECTED'
                            ? 'bg-red-500/15 text-red-400 border border-red-500/25'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {a.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-400 text-[11px]">
                      {a.viewCount.toLocaleString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {a.status === 'PUBLISHED' && (
                          <Link
                            to={`/research/${a.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="View Public Article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <Link
                          to={`/editor/${a.id}`}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                          title="Edit in Studio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        {a.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleOpenScheduleModal(a)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="Schedule Publication"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          </button>
                        )}

                        {a.status === 'PUBLISHED' && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Unpublish and archive '${a.title}'?`)) {
                                archiveMutation.mutate(a.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400"
                            title="Archive / Unpublish"
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (window.confirm(`Permanently delete manuscript '${a.title}'? All associated blocks and comments will be purged.`)) {
                              forceDeleteMutation.mutate(a.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                          title="Force Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
            <span>Showing {articles.length} of {pagination.total} manuscripts</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-30"
              >
                Previous
              </button>
              <span className="font-semibold text-white">{page} / {pagination.totalPages}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-30"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule Publication Modal */}
      {scheduleModalOpen && selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-serif font-bold text-white mb-1">
              Schedule Publication
            </h3>
            <p className="text-xs text-slate-400 mb-4 truncate">
              {selectedArticle.title}
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Target Publication Date & Time (UTC)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs"
                >
                  {scheduleMutation.isPending ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
