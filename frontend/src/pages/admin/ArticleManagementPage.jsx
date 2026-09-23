import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  FileText,
  Search,
  Calendar,
  Archive,
  Trash2,
  Edit3,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  Loader2,
  ExternalLink,
  PenTool,
  AlertCircle,
  Globe
} from 'lucide-react';

export default function ArticleManagementPage() {
  const queryClient = useQueryClient();
  const { user, hasPermission } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const canModerate = hasPermission('article.approve') || hasPermission('article.update_any');
  const canSchedule = hasPermission('article.schedule');
  const canArchive = hasPermission('article.publish');
  const canPublish = hasPermission('article.publish');
  const canDeleteAny = hasPermission('article.delete_any');
  const canCreate = hasPermission('article.create');

  // Schedule Modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [scheduledDate, setScheduledDate] = useState('');

  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Fetch Articles (dynamically scoped by backend to authorId if non-editor)
  const { data, isLoading } = useQuery({
    queryKey: ['admin-articles-all', { search, status: statusFilter, page }],
    queryFn: async () => {
      const res = await adminApi.listArticles({ search, status: statusFilter, page, limit: 15 });
      return res.data;
    }
  });

  const articles = data?.articles || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Rejection alerts for author
  const rejectedArticles = articles.filter(a => a.status === 'REJECTED' && a.rejectionReason);

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

  const publishMutation = useMutation({
    mutationFn: (id) => adminApi.publishArticle(id),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-articles-all']);
      queryClient.invalidateQueries(['admin-stats']);
      queryClient.invalidateQueries(['featured-article']);
      setAlertMsg({ type: 'success', text: res.message || 'Article published live successfully!' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.response?.data?.error?.message || err.message || 'Failed to publish article' });
    }
  });

  const archiveMutation = useMutation({
    mutationFn: (id) => adminApi.archiveArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-articles-all']);
      queryClient.invalidateQueries(['admin-stats']);
      queryClient.invalidateQueries(['featured-article']);
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

  const pageTitle = canModerate ? 'All Articles' : 'My Articles';
  const pageSubtitle = canModerate
    ? 'Complete editorial oversight across all article stages: Drafts, Review Queue, Published, and Archived'
    : 'Manage your research drafts, track editorial review progress, and view published articles';

  return (
    <AdminLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      actions={
        canCreate && (
          <Link
            to="/admin/editor"
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>Write Article</span>
          </Link>
        )
      }
    >
      <Helmet>
        <title>{pageTitle} — Research Factors</title>
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

      {/* Rejection Notification Banner for Author */}
      {!canModerate && rejectedArticles.length > 0 && (
        <div className="mb-6 space-y-3">
          {rejectedArticles.map((ra) => (
            <div
              key={ra.id}
              className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Action Required on "{ra.title}"
                  </h4>
                  <p className="text-xs text-amber-200/90 mt-1">
                    Editorial Feedback: <span className="font-semibold text-white">"{ra.rejectionReason}"</span>
                  </p>
                </div>
              </div>
              <Link
                to={`/admin/editor/${ra.id}`}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 text-slate-950 hover:bg-amber-400 shrink-0 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Resume in Editor</span>
              </Link>
            </div>
          ))}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="admin-toolbar mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={canModerate ? "Search articles by title, excerpt, or slug..." : "Search your articles..."}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="admin-input w-full pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="admin-input px-3 py-2 rounded-xl text-xs"
        >
          <option value="">All Statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="APPROVED">Approved / Scheduled</option>
          <option value="DRAFT">Draft</option>
          <option value="REJECTED">Needs Revision / Rejected</option>
          <option value="ARCHIVED">Archived</option>
        </select>
      </div>

      {/* Articles Table */}
      <div className="admin-table-container">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading articles...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="p-20 text-center">
            <FileText className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Articles Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {canModerate
                ? 'Try adjusting your search filters or status criteria.'
                : 'You have not written any articles yet. Click "Write Article" to begin your first draft.'}
            </p>
            {canCreate && !canModerate && (
              <Link
                to="/admin/editor"
                className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>Create Your First Article</span>
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/80">
                  <th className="py-3.5 px-6">Article Title</th>
                  {canModerate && <th className="py-3.5 px-6">Author</th>}
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Reads</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {articles.map((a) => (
                  <tr key={a.id} className="admin-table-row">
                    <td className="py-4 px-6 max-w-sm">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-semibold text-slate-900 dark:text-white truncate" title={a.title}>
                          {a.title}
                        </h4>
                        {a.isFeatured && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase tracking-wide bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 dark:border-blue-500/30 shrink-0">
                            Featured
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-500 truncate block mt-0.5">
                        /{a.slug}
                      </span>
                    </td>

                    {canModerate && (
                      <td className="py-4 px-6">
                        <span className="font-semibold text-slate-900 dark:text-slate-200 block">{a.author?.name}</span>
                        <span className="text-[10px] text-slate-500">{a.author?.email}</span>
                      </td>
                    )}

                    <td className="py-4 px-6 text-slate-700 dark:text-slate-300">
                      {a.category?.name || 'Uncategorized'}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                          a.status === 'PUBLISHED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                            : a.status === 'PENDING_REVIEW'
                            ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                            : a.status === 'APPROVED'
                            ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                            : a.status === 'REJECTED'
                            ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {a.status === 'REJECTED' ? 'NEEDS REVISION' : a.status.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-[11px]">
                      {a.viewCount.toLocaleString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {a.status === 'PUBLISHED' && (
                          <Link
                            to={`/research/${a.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                            title="View Public Article"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        <Link
                          to={`/admin/editor/${a.id}`}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                          title="Edit Article in Studio"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        {canSchedule && a.status !== 'PUBLISHED' && (
                          <button
                            onClick={() => handleOpenScheduleModal(a)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Schedule Publication"
                          >
                            <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          </button>
                        )}

                        {canArchive && (
                          a.status === 'PUBLISHED' ? (
                            <button
                              onClick={() => {
                                if (window.confirm(`Unpublish and archive '${a.title}'? It will no longer be visible to the public.`)) {
                                  archiveMutation.mutate(a.id);
                                }
                              }}
                              disabled={archiveMutation.isPending}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-500/20 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                              title="Unpublish / Archive Article"
                            >
                              <Archive className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (window.confirm(`Publish '${a.title}' live immediately? It will become visible on the public magazine.`)) {
                                  publishMutation.mutate(a.id);
                                }
                              }}
                              disabled={publishMutation.isPending}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-100 dark:bg-slate-800 dark:hover:bg-emerald-500/20 text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors cursor-pointer disabled:opacity-50"
                              title="Publish Article Live"
                            >
                              <Globe className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            </button>
                          )
                        )}

                        {canDeleteAny && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Permanently delete article '${a.title}'? All associated blocks and comments will be purged.`)) {
                                forceDeleteMutation.mutate(a.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Force Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/40">
            <span>
              Showing Page <strong className="text-slate-900 dark:text-white">{pagination.page}</strong> of{' '}
              <strong className="text-slate-900 dark:text-white">{pagination.totalPages}</strong> ({pagination.total} total)
            </span>
            <div className="space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Publication Schedule Modal */}
      {scheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="admin-modal rounded-3xl p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Schedule Publication</h3>
              <button
                onClick={() => setScheduleModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Select date and time to automatically promote{' '}
              <strong className="text-slate-800 dark:text-slate-200">"{selectedArticle?.title}"</strong> to published status.
            </p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                  Publication Timestamp
                </label>
                <input
                  type="datetime-local"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="admin-input w-full px-3 py-2 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={scheduleMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-colors cursor-pointer"
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
