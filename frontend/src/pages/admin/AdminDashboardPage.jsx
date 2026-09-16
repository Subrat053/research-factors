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
  ExternalLink
} from 'lucide-react';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isSuperAdmin = user?.roles?.includes('SUPER_ADMIN');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => adminApi.getStats()
  });

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
    unreadContactMessages: 0
  };

  const recentActivity = data?.data?.recentActivity || [];

  return (
    <AdminLayout
      title="Platform Executive Overview"
      subtitle="Editorial governance, taxonomy controls, and real-time operational telemetry"
      actions={
        <div className="flex items-center space-x-3">
          <Link
            to="/admin/articles"
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs"
          >
            <span>Manuscript Review Desk</span>
            {stats.pendingReviewArticles > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                {stats.pendingReviewArticles}
              </span>
            )}
          </Link>
          {isSuperAdmin && (
            <Link
              to="/admin/settings"
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>System Settings</span>
            </Link>
          )}
        </div>
      }
    >
      <Helmet>
        <title>Platform Executive Overview — Research Factors</title>
      </Helmet>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Published Research</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-white mt-3">
            {stats.publishedArticles}
          </p>
          <div className="flex items-center justify-between text-xs text-slate-400 mt-2">
            <span>Total Manuscripts: {stats.totalArticles}</span>
            <span className="text-emerald-400 font-semibold">
              {stats.totalArticles > 0
                ? `${Math.round((stats.publishedArticles / stats.totalArticles) * 100)}% live`
                : '0%'}
            </span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Peer Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-white mt-3">
            {stats.pendingReviewArticles}
          </p>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-slate-400">Awaiting editorial decision</span>
            <Link to="/admin/articles" className="text-blue-400 hover:text-blue-300 font-medium">
              Review →
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Reported Comments</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-white mt-3">
            {stats.reportedComments}
          </p>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-slate-400">Out of {stats.totalComments} total</span>
            <Link to="/admin/reports" className="text-rose-400 hover:text-rose-300 font-medium">
              Triage →
            </Link>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Verified Authors</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-serif font-bold text-white mt-3">
            {stats.totalAuthors}
          </p>
          <div className="flex items-center justify-between text-xs mt-2">
            <span className="text-slate-400">Total Users: {stats.totalUsers}</span>
            <Link to="/admin/authors" className="text-blue-400 hover:text-blue-300 font-medium">
              Accredit →
            </Link>
          </div>
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <Link
          to="/admin/categories"
          className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-all flex items-center space-x-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-800/80 group-hover:bg-slate-800 flex items-center justify-center">
            <FolderTree className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{stats.totalCategories}</p>
            <p className="text-[11px] text-slate-400">Categories</p>
          </div>
        </Link>

        <Link
          to="/admin/tags"
          className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-all flex items-center space-x-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-800/80 group-hover:bg-slate-800 flex items-center justify-center">
            <Tags className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">{stats.totalTags}</p>
            <p className="text-[11px] text-slate-400">Keywords & Tags</p>
          </div>
        </Link>

        <Link
          to="/admin/contact-messages"
          className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-all flex items-center space-x-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-800/80 group-hover:bg-slate-800 flex items-center justify-center">
            <Mail className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">
              {stats.unreadContactMessages}
            </p>
            <p className="text-[11px] text-slate-400">Unread Inquiries</p>
          </div>
        </Link>

        <Link
          to="/admin/audit-logs"
          className="bg-slate-900/40 border border-slate-800/60 rounded-xl p-4 hover:border-slate-700 transition-all flex items-center space-x-3 group"
        >
          <div className="w-9 h-9 rounded-lg bg-slate-800/80 group-hover:bg-slate-800 flex items-center justify-center">
            <Activity className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <p className="text-lg font-bold text-white leading-tight">Audit Trail</p>
            <p className="text-[11px] text-slate-400">Immutable Logs</p>
          </div>
        </Link>
      </div>

      {/* Quick Launch & Recent Submissions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Submissions Table (2 cols) */}
        <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xs flex flex-col">
          <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Manuscript Activity</h3>
              <p className="text-xs text-slate-400">Submissions, editorial updates, and publications</p>
            </div>
            <Link
              to="/admin/articles"
              className="text-xs font-semibold text-blue-400 hover:text-blue-300 flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/40 border-b border-slate-800/60 text-slate-400 uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3 font-semibold">Manuscript</th>
                  <th className="px-5 py-3 font-semibold">Author</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Updated</th>
                  <th className="px-5 py-3 font-semibold text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-slate-300">
                {recentActivity.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-5 py-12 text-center text-slate-400">
                      No recent manuscripts recorded.
                    </td>
                  </tr>
                ) : (
                  recentActivity.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-5 py-3.5 max-w-[220px]">
                        <p className="font-medium text-white truncate">{item.title}</p>
                        <p className="text-[11px] text-slate-400 truncate">{item.category}</p>
                      </td>
                      <td className="px-5 py-3.5 text-slate-300 whitespace-nowrap">
                        {item.author}
                      </td>
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'PUBLISHED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : item.status === 'PENDING_REVIEW'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : item.status === 'REJECTED'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-[11px] whitespace-nowrap">
                        {new Date(item.updatedAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <Link
                          to={`/articles/${item.slug}`}
                          target="_blank"
                          className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center space-x-1"
                        >
                          <span>Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Backoffice Control Hub (1 col) */}
        <div className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-xs">
            <h3 className="text-sm font-semibold text-white mb-1">Administrative Control Hub</h3>
            <p className="text-xs text-slate-400 mb-4">Direct shortcuts to governance modules</p>

            <div className="space-y-2">
              <Link
                to="/admin/users"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition-colors">
                      User Directory
                    </p>
                    <p className="text-[10px] text-slate-400">Roles, statuses, suspensions</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
              </Link>

              <Link
                to="/admin/authors"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-purple-400 transition-colors">
                      Author Accreditation
                    </p>
                    <p className="text-[10px] text-slate-400">Review research credentials</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
              </Link>

              <Link
                to="/admin/tags"
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/50 transition-colors group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                    <Tags className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white group-hover:text-emerald-400 transition-colors">
                      Tag Merge Utility
                    </p>
                    <p className="text-[10px] text-slate-400">Resolve keyword duplication</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-200" />
              </Link>

              {isSuperAdmin && (
                <>
                  <Link
                    to="/admin/roles"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-purple-500/20 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-purple-200 group-hover:text-purple-100 transition-colors">
                          RBAC Matrix & Roles
                        </p>
                        <p className="text-[10px] text-purple-300/60">Super Admin exclusive</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </Link>

                  <Link
                    to="/admin/settings"
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/40 hover:bg-slate-800/50 border border-purple-500/20 transition-colors group"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-300">
                        <Settings className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-purple-200 group-hover:text-purple-100 transition-colors">
                          Platform Settings
                        </p>
                        <p className="text-[10px] text-purple-300/60">SEO, SMTP, Diagnostics</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-purple-400" />
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* System Security Notice */}
          <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4">
            <div className="flex items-start space-x-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-slate-200">Centralized RBAC Active</p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Resource ownership guards, anti-escalation barriers, and immutable audit logs are strictly enforced on all mutating endpoints.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
