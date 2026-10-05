import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle,
  Users,
  MessageSquare,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  FolderTree,
  Tags,
  Mail,
  UserCheck,
  KeyRound,
  Settings,
  Activity,
  ChevronRight,
  ExternalLink,
  PenTool,
  AlertCircle,
  Eye,
  Edit3
} from 'lucide-react';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminDashboardPage() {
  const { user, hasPermission } = useAuth();
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');
  const canModerate = hasPermission('article.approve') || hasPermission('article.update_any');
  const canCreate = hasPermission('article.create');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats()
  });

  const isAuthorView = data?.data?.isAuthorView || (!canModerate && canCreate);

  const stats = data?.data?.metrics || {
    totalArticles: 0,
    publishedArticles: 0,
    pendingReviewArticles: 0,
    draftArticles: 0,
    rejectedArticles: 0,
    archivedArticles: 0,
    totalComments: 0,
    reportedComments: 0,
    totalUsers: 0,
    totalAuthors: 0,
    totalCategories: 0,
    totalTags: 0,
    unreadContactMessages: 0,
    totalViews: 0
  };

  const recentActivity = data?.data?.recentActivity || [];

  const pageTitle = isAuthorView ? 'Author Studio Overview' : 'Platform Executive Overview';
  const pageSubtitle = isAuthorView
    ? 'Track your research publication lifecycle, editorial review progress, and reader engagement'
    : 'Editorial governance, taxonomy controls, and real-time operational telemetry';

  return (
    <AdminLayout
      title={pageTitle}
      subtitle={pageSubtitle}
      actions={
        <div className="flex items-center space-x-3">
          {canCreate && (
            <Link
              to="/admin/editor"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs"
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Write Article</span>
            </Link>
          )}
          {canModerate && stats.pendingReviewArticles > 0 && (
            <Link
              to="/admin/articles/review-queue"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-amber-300 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Review Queue ({stats.pendingReviewArticles})</span>
            </Link>
          )}
          {isSuperAdmin && (
            <Link
              to="/admin/settings"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>System Settings</span>
            </Link>
          )}
        </div>
      }
    >
      <Helmet>
        <title>{pageTitle} — Research Factors</title>
      </Helmet>

      {/* Author Revision Alert Banner */}
      {isAuthorView && stats.rejectedArticles > 0 && (
        <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-white">
                {stats.rejectedArticles} {stats.rejectedArticles === 1 ? 'article requires' : 'articles require'} revision:
              </span>{' '}
              Editorial feedback has been submitted. Check your articles list to update your draft and re-submit.
            </div>
          </div>
          <Link
            to="/admin/articles"
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 shrink-0 transition-colors"
          >
            View Feedback
          </Link>
        </div>
      )}

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* KPI 1 */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              {isAuthorView ? 'Published Articles' : 'Published Research'}
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
            {stats.publishedArticles}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>{isAuthorView ? 'Live in magazine' : 'Verified public catalog'}</span>
            <span className="text-emerald-500 dark:text-emerald-400 font-semibold">Active</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="admin-card p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Under Editorial Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
            {stats.pendingReviewArticles}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
            <span>{isAuthorView ? 'Awaiting peer review' : 'Awaiting reviewer check'}</span>
            <span className="text-amber-500 dark:text-amber-400 font-semibold">Pending</span>
          </div>
        </div>

        {/* KPI 3 */}
        {isAuthorView ? (
          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Draft Articles</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Edit3 className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
              {stats.draftArticles}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>Unsubmitted articles</span>
              <span className="text-blue-500 dark:text-blue-400 font-semibold">In Progress</span>
            </div>
          </div>
        ) : (
          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Registered Users</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
              {stats.totalUsers}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{stats.totalAuthors} Verified Authors</span>
              <span className="text-blue-500 dark:text-blue-400 font-semibold">Verified</span>
            </div>
          </div>
        )}

        {/* KPI 4 */}
        {isAuthorView ? (
          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cumulative Readers</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Eye className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
              {(stats.totalViews || 0).toLocaleString()}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{stats.totalComments || 0} Peer Comments</span>
              <span className="text-purple-500 dark:text-purple-400 font-semibold">Reads</span>
            </div>
          </div>
        ) : (
          <div className="admin-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Flagged Comments</span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-red-400" />
              </div>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white mt-3">
              {stats.reportedComments}
            </p>
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mt-2">
              <span>{stats.totalComments} Total Discussions</span>
              <span className="text-red-500 dark:text-red-400 font-semibold">Moderation</span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Activity & Navigation shortcuts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Articles Table (2 cols) */}
        <div className="lg:col-span-2 admin-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {isAuthorView ? 'My Recent Articles' : 'Recent Editorial Pipeline'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isAuthorView
                  ? 'Recent draft updates and publication checkpoints'
                  : 'Latest articles submitted or published across the platform'}
              </p>
            </div>
            <Link
              to="/admin/articles"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 flex items-center space-x-1"
            >
              <span>{isAuthorView ? 'View All My Articles' : 'View All Articles'}</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="pb-3 px-2">Article</th>
                  {!isAuthorView && <th className="pb-3 px-2">Author</th>}
                  <th className="pb-3 px-2">Category</th>
                  <th className="pb-3 px-2">Status</th>
                  <th className="pb-3 px-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan={isAuthorView ? 4 : 5} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      No articles recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-2 max-w-xs truncate font-medium text-slate-900 dark:text-white">
                        {item.title}
                      </td>
                      {!isAuthorView && (
                        <td className="py-3 px-2 text-slate-500 dark:text-slate-400 truncate">
                          {item.author}
                        </td>
                      )}
                      <td className="py-3 px-2 text-slate-500 dark:text-slate-400 truncate">
                        {item.category?.name || item.category || 'Uncategorized'}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${item.status === 'PUBLISHED'
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25'
                              : item.status === 'PENDING_REVIEW'
                                ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25'
                                : item.status === 'APPROVED'
                                  ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/25'
                                  : item.status === 'REJECTED'
                                    ? 'bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/25'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                          {item.status === 'REJECTED' ? 'NEEDS REVISION' : item.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <Link
                          to={`/admin/editor/${item.id}`}
                          className="p-1 rounded-md text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors inline-block"
                          title="Edit Article"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Shortcuts & Control Hub (1 col) */}
        <div className="space-y-4">
          <div className="admin-card p-5">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">
              {isAuthorView ? 'Author Workspace' : 'Control Hub'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              {isAuthorView ? 'Quick links to manage your research presence' : 'Direct shortcuts to governance modules'}
            </p>

            <div className="space-y-2">
              <Link
                to="/admin/profile"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Profile
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Headline, bio, social links, avatar</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
              </Link>

              <Link
                to="/admin/articles"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {isAuthorView ? 'My Articles' : 'All Articles'}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Review status, drafts, metrics</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
              </Link>

              {/* Admin specific shortcuts */}
              {canModerate && (
                <>
                  <Link
                    to="/admin/users"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 dark:text-purple-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          User Directory
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Manage accounts and roles</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                  </Link>

                  <Link
                    to="/admin/articles/review-queue"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 border border-slate-200 dark:border-slate-800/50 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 dark:text-amber-400">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                          Editorial Review Desk
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400">Approve, feature, or reject drafts</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* RBAC Active Notice */}
          <div className="admin-card-inner p-4">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-200">Dynamic RBAC Security</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                  Your permissions are continuously verified. Mutations are isolated strictly to resources you own or are authorized to manage.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
