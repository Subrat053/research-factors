import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { ReportDetailsModal } from '../../components/admin/ReportDetailsModal.jsx';
import { useModal } from '../../context/ModalContext.jsx';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { getAppUrl } from '../../utils/url.js';
import {
  Search,
  RefreshCw,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  EyeOff,
  Trash2,
  ShieldAlert,
  ExternalLink,
  ThumbsUp,
  CornerDownRight,
  X,
  Loader2,
  Clock,
  ChevronLeft,
  ChevronRight,
  User,
  AlertCircle,
  Check
} from 'lucide-react';

const STATUS_TABS = [
  { key: 'ALL', label: 'All Comments' },
  { key: 'REPORTED', label: 'Reported', isAlert: true },
  { key: 'VISIBLE', label: 'Visible' },
  { key: 'HIDDEN', label: 'Hidden' },
  { key: 'DELETED', label: 'Deleted' }
];

export default function ModerationQueuePage() {
  const queryClient = useQueryClient();
  const { confirm } = useModal();

  const [activeTab, setActiveTab] = useState('ALL');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [articleFilter, setArticleFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [inspectingCommentId, setInspectingCommentId] = useState(null);
  const [processingId, setProcessingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Main comments query with status counts & background auto-refresh
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'admin-comments',
      {
        status: activeTab,
        search: debouncedSearch,
        articleId: articleFilter,
        sort: sortBy,
        page
      }
    ],
    queryFn: async () => {
      const res = await adminApi.listComments({
        status: activeTab,
        search: debouncedSearch,
        articleId: articleFilter,
        sort: sortBy,
        page,
        limit: 15
      });
      return res;
    },
    refetchInterval: autoRefresh ? 30000 : false
  });

  const comments = data?.data || [];
  const statusCounts = data?.statusCounts || {
    ALL: 0,
    VISIBLE: 0,
    REPORTED: 0,
    HIDDEN: 0,
    DELETED: 0
  };
  const pagination = data?.pagination || { total: 0, page: 1, limit: 15, totalPages: 1 };

  // Moderate comment mutation (Approve, Hide, Delete)
  const moderateMutation = useMutation({
    mutationFn: ({ commentId, action, reason }) =>
      adminApi.moderateComment(commentId, { action, reason }),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-comments'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reports-queue'] });

      const actionText = {
        APPROVE: 'Comment approved and made visible to public discourse.',
        HIDE: 'Comment hidden from public discourse.',
        DELETE: 'Comment deleted and purged from thread.'
      };
      setFeedback({
        type: 'success',
        text: actionText[variables.action] || 'Comment moderation recorded.'
      });
      setProcessingId(null);
    },
    onError: (err) => {
      setFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Action failed.'
      });
      setProcessingId(null);
    }
  });

  const handleModerate = async (commentId, action, reason = null) => {
    if (action === 'DELETE') {
      const confirmed = await confirm({
        title: 'Delete Comment Permanently?',
        message: 'Are you sure you want to delete this comment? Associated reports will also be cleared.',
        confirmText: 'Delete Comment',
        cancelText: 'Cancel',
        variant: 'danger'
      });
      if (!confirmed) return;
    }

    setProcessingId(commentId);
    moderateMutation.mutate({ commentId, action, reason });
  };

  return (
    <AdminLayout
      title="Editorial Comments Hub"
      subtitle="Comprehensive governance of reader discourse, community reports triage, and moderation enforcement"
    >
      <Helmet>
        <title>Comments Management Hub — Research Factors Backoffice</title>
      </Helmet>

      {/* Inspect Report Modal */}
      {inspectingCommentId && (
        <ReportDetailsModal
          commentId={inspectingCommentId}
          onClose={() => setInspectingCommentId(null)}
          onActionComplete={(action) => {
            setFeedback({
              type: 'success',
              text: `Report resolved and comment updated: ${action}`
            });
          }}
        />
      )}

      {/* Auto-dismissing Feedback Banner */}
      {feedback && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between transition-all ${feedback.type === 'error'
              ? 'bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300'
              : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300'
            }`}
        >
          <div className="flex items-center space-x-3 text-xs font-medium">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
            ) : (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status Filter Tabs with Live Badges */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-zinc-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          {STATUS_TABS.map((tab) => {
            const count = statusCounts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`relative px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center space-x-2 ${isActive
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-zinc-800/80 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-zinc-700'
                  }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isActive
                      ? 'bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900'
                      : tab.isAlert && count > 0
                        ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                        : 'bg-slate-200 dark:bg-zinc-700 text-slate-600 dark:text-slate-400'
                    }`}
                >
                  {count}
                </span>

                {/* Pulsing indicator for active reported comments */}
                {tab.isAlert && count > 0 && (
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live polling controls */}
        <div className="flex items-center space-x-3 text-xs">
          <label className="flex items-center space-x-1.5 text-slate-500 dark:text-slate-400 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-rfblue focus:ring-rfblue w-3.5 h-3.5"
            />
            <span>Auto-refresh (30s)</span>
          </label>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
            title="Refresh comments list"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-rfblue' : ''}`} />
          </button>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="admin-toolbar mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by comment prose, author name, or article title..."
            className="admin-input pl-9 pr-8 py-2 w-full rounded-xl text-xs"
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort & Pagination Limit */}
        <div className="flex items-center space-x-3 text-xs">
          <span className="font-semibold text-slate-500 dark:text-slate-400">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(1);
            }}
            className="admin-input px-3 py-1.5 rounded-xl text-xs"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="most_reported">Most Reported</option>
            <option value="most_liked">Most Liked</option>
          </select>
        </div>
      </div>

      {/* Main Comments List */}
      {isLoading ? (
        <div className="py-24 flex flex-col justify-center items-center text-slate-500 dark:text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-rfblue" />
          <span className="text-xs font-medium">Loading peer responses and comments...</span>
        </div>
      ) : isError ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 text-center text-red-700 dark:text-red-300">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <p className="text-sm font-semibold">Unable to fetch comments desk</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{error?.message || 'Access denied or server error'}</p>
          <button
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-xs text-slate-800 dark:text-white hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            Retry
          </button>
        </div>
      ) : comments.length === 0 ? (
        <div className="admin-card rounded-2xl p-16 text-center">
          <MessageSquare className="w-12 h-12 text-slate-300 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Comments Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            {searchInput
              ? 'No comments match your search criteria. Try modifying your search keywords.'
              : activeTab === 'REPORTED'
                ? 'Excellent! No comments are currently flagged with community reports.'
                : 'No reader comments exist in this category yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((item) => {
            const isProcessing = processingId === item.id;
            const hasReports = item.reportCount > 0;

            return (
              <div
                key={item.id}
                className="admin-card rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-5 hover:border-rfblue/40 transition-all"
              >
                <div className="flex-1 space-y-3 min-w-0">
                  {/* Meta Bar */}
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Author Avatar */}
                    <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-zinc-700 flex items-center justify-center text-[10px] font-bold text-slate-700 dark:text-slate-200 overflow-hidden shrink-0">
                      {item.author?.avatarUrl ? (
                        <img
                          src={normalizeMediaUrl(item.author.avatarUrl)}
                          alt={item.author.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{(item.author?.name || 'U').charAt(0)}</span>
                      )}
                    </div>

                    <span className="font-bold text-slate-900 dark:text-slate-200">
                      {item.author?.name || 'Anonymous Reader'}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      ({item.author?.email})
                    </span>

                    <span className="text-slate-300 dark:text-zinc-600">·</span>

                    <span className="text-slate-400 dark:text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${item.status === 'VISIBLE'
                          ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                          : item.status === 'REPORTED'
                            ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                            : item.status === 'HIDDEN'
                              ? 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border border-slate-500/20'
                              : 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/20'
                        }`}
                    >
                      {item.status}
                    </span>

                    {/* Report Inspection Badge Button */}
                    {hasReports && (
                      <button
                        onClick={() => setInspectingCommentId(item.id)}
                        className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 hover:bg-amber-500/25 text-amber-800 dark:text-amber-300 border border-amber-500/30 flex items-center space-x-1 cursor-pointer transition-colors"
                        title="Click to inspect reader violation complaints"
                      >
                        <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                        <span>{item.reportCount} Report(s) — Inspect</span>
                      </button>
                    )}
                  </div>

                  {/* Target Manuscript Title */}
                  {item.article && (
                    <div className="flex items-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <span>On article:</span>
                      <a
                        href={getAppUrl(`/articles/${item.article.slug}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-rfblue hover:underline inline-flex items-center gap-1 truncate max-w-md"
                      >
                        <span className="truncate">{item.article.title}</span>
                        <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
                      </a>
                    </div>
                  )}

                  {/* Comment Body */}
                  <div
                    className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-zinc-800/40 border border-slate-200/80 dark:border-zinc-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-sans prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                  />

                  {/* Engagement Metrics */}
                  <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                    <span className="flex items-center space-x-1">
                      <ThumbsUp className="w-3 h-3" />
                      <span>{item.likeCount || 0} Likes</span>
                    </span>
                    <span className="flex items-center space-x-1">
                      <CornerDownRight className="w-3 h-3" />
                      <span>{item.replyCount || 0} Replies</span>
                    </span>
                    {item.depth > 0 && (
                      <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-zinc-800 text-[10px] font-medium text-slate-500">
                        Threaded Reply
                      </span>
                    )}
                  </div>
                </div>

                {/* Moderation Actions Column */}
                <div className="flex flex-wrap md:flex-col gap-2 shrink-0 md:min-w-[140px] pt-1">
                  {/* Approve / Restore */}
                  {item.status !== 'VISIBLE' && (
                    <button
                      onClick={() => handleModerate(item.id, 'APPROVE')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      <span>Approve</span>
                    </button>
                  )}

                  {/* Hide */}
                  {item.status !== 'HIDDEN' && (
                    <button
                      onClick={() => handleModerate(item.id, 'HIDE')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>Hide</span>
                    </button>
                  )}

                  {/* Delete */}
                  {item.status !== 'DELETED' && (
                    <button
                      onClick={() => handleModerate(item.id, 'DELETE')}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-700 dark:text-red-300 border border-red-500/30 transition-colors flex items-center justify-center space-x-1.5 disabled:opacity-50 cursor-pointer"
                    >
                      {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-slate-200 dark:border-zinc-800 pt-4 text-xs text-slate-500 dark:text-slate-400">
          <div>
            Showing <strong className="text-slate-800 dark:text-slate-200">{((pagination.page - 1) * pagination.limit) + 1}</strong> to{' '}
            <strong className="text-slate-800 dark:text-slate-200">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>{' '}
            of <strong className="text-slate-800 dark:text-slate-200">{pagination.total}</strong> comments
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            <span className="font-semibold px-2">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
