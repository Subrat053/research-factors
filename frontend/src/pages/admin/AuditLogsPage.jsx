import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  ScrollText,
  ShieldCheck,
  Eye,
  Loader2,
  X,
  Code,
  User,
  Users,
  FileText,
  MessageSquare,
  FolderTree,
  Tag,
  Mail,
  Image as ImageIcon,
  Settings,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Sparkles
} from 'lucide-react';

function formatRelativeTime(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffInSecs = Math.floor((now - date) / 1000);
  if (diffInSecs < 60) return 'Just now';
  const diffInMins = Math.floor(diffInSecs / 60);
  if (diffInMins < 60) return `${diffInMins}m ago`;
  const diffInHours = Math.floor(diffInMins / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays}d ago`;
  return date.toLocaleDateString();
}

function getBadgeClasses(variant) {
  switch (variant) {
    case 'danger':
      return 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20';
    case 'warning':
      return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
    case 'success':
      return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
    case 'purple':
      return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
    case 'info':
      return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
    case 'neutral':
    default:
      return 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/20';
  }
}

function getEntityIcon(type) {
  const t = (type || '').toLowerCase();
  switch (t) {
    case 'user':
    case 'author':
      return <User className="w-3.5 h-3.5" />;
    case 'article':
      return <FileText className="w-3.5 h-3.5" />;
    case 'comment':
      return <MessageSquare className="w-3.5 h-3.5" />;
    case 'category':
      return <FolderTree className="w-3.5 h-3.5" />;
    case 'tag':
      return <Tag className="w-3.5 h-3.5" />;
    case 'contactmessage':
    case 'contact':
      return <Mail className="w-3.5 h-3.5" />;
    case 'media':
      return <ImageIcon className="w-3.5 h-3.5" />;
    case 'role':
      return <ShieldCheck className="w-3.5 h-3.5" />;
    case 'systemsetting':
    case 'system':
      return <Settings className="w-3.5 h-3.5" />;
    default:
      return <ScrollText className="w-3.5 h-3.5" />;
  }
}

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showRawJson, setShowRawJson] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', { page }],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({ page, limit: 20 });
      return res.data;
    }
  });

  const logs = Array.isArray(data?.data)
    ? data.data
    : Array.isArray(data?.logs)
    ? data.logs
    : Array.isArray(data)
    ? data
    : [];
  const pagination = data?.pagination || { total: logs.length, totalPages: 1 };

  const handleCopyJson = (payload) => {
    navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AdminLayout
      title="Immutable Security & Audit Trail"
      subtitle="Universal human-readable audit ledger recording administrative actions, editorial changes, and security events"
    >
      <Helmet>
        <title>Audit Logs — Research Factors Admin</title>
      </Helmet>

      {/* Audit Logs Table */}
      <div className="admin-table-container">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center">
            <ScrollText className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Audit Records Logged</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Sensitive operations will automatically record audit events here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/80">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Staff Actor</th>
                  <th className="py-3.5 px-6">Action & Narrative</th>
                  <th className="py-3.5 px-6">Entity</th>
                  <th className="py-3.5 px-6">Target Resource</th>
                  <th className="py-3.5 px-6 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {logs.map((l) => {
                  const actor = typeof l.actor === 'object' && l.actor !== null
                    ? l.actor
                    : { name: l.actor || 'System', initials: (l.actor?.[0] || 'S').toUpperCase(), email: null };

                  const target = l.target || {
                    name: l.entityId || 'Resource',
                    subtitle: null,
                    link: null,
                    isBulk: false,
                    items: []
                  };

                  const badgeClass = getBadgeClasses(l.badgeVariant);

                  return (
                    <tr key={l.id} className="admin-table-row transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                      {/* Timestamp */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900 dark:text-white text-xs">
                            {formatRelativeTime(l.createdAt)}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                            {new Date(l.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      {/* Staff Actor */}
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200 shrink-0">
                            {actor.initials}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-slate-900 dark:text-white truncate">
                              {actor.name}
                            </span>
                            {actor.email && (
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                                {actor.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Action & Narrative */}
                      <td className="py-4 px-6 max-w-[280px]">
                        <div className="flex flex-col items-start gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${badgeClass}`}>
                            {l.actionLabel || l.action}
                          </span>
                          {l.narrative && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug line-clamp-1" title={l.narrative}>
                              {l.narrative}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Entity Type Badge */}
                      <td className="py-4 px-6 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                          {getEntityIcon(l.entityType)}
                          <span>{l.entityType}</span>
                        </span>
                      </td>

                      {/* Target Resource */}
                      <td className="py-4 px-6 max-w-[240px]">
                        <div className="flex flex-col min-w-0">
                          {target.isBulk ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                                <Users className="w-3 h-3 mr-1" />
                                {target.name}
                              </span>
                            </div>
                          ) : target.link ? (
                            <Link
                              to={target.link}
                              className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 truncate text-xs group"
                              title={target.name}
                            >
                              <span className="truncate">{target.name}</span>
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            </Link>
                          ) : (
                            <span className="font-semibold text-slate-900 dark:text-white truncate text-xs" title={target.name}>
                              {target.name}
                            </span>
                          )}

                          {target.subtitle && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate" title={target.subtitle}>
                              {target.subtitle}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Inspect Button */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <button
                          onClick={() => {
                            setSelectedLog(l);
                            setShowRawJson(false);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors cursor-pointer text-xs font-medium"
                          title="Inspect Human-Readable Audit Details"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/80 dark:bg-slate-900/40">
            <span>Showing page {page} of {pagination.totalPages} ({pagination.total} audit events recorded)</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-900 dark:text-white px-2">{page}</span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Human-Friendly Audit Inspector Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {selectedLog.actionLabel || selectedLog.action}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getBadgeClasses(selectedLog.badgeVariant)}`}>
                      {selectedLog.actionCategory || 'Security'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Logged {new Date(selectedLog.createdAt).toLocaleString()} ({new Date(selectedLog.createdAt).toUTCString()})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
              {/* Plain-English Narrative Banner */}
              {selectedLog.narrative && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-3">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-900 dark:text-blue-200 leading-relaxed font-medium">
                    {selectedLog.narrative}
                  </div>
                </div>
              )}

              {/* Actor & Target Resource Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Staff Actor Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    Initiator / Staff Actor
                  </span>
                  <div className="flex items-center space-x-3 pt-1">
                    <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                      {selectedLog.actor?.initials || selectedLog.actor?.[0] || 'S'}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-slate-900 dark:text-white truncate text-xs">
                        {selectedLog.actor?.name || selectedLog.actor || 'System'}
                      </span>
                      {selectedLog.actor?.email ? (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {selectedLog.actor.email}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">
                          Automated Platform Engine
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Target Resource Card */}
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Target Resource ({selectedLog.entityType})
                    </span>
                    <div className="pt-1.5 flex flex-col">
                      <span className="font-semibold text-slate-900 dark:text-white text-xs">
                        {selectedLog.target?.name || selectedLog.entityId}
                      </span>
                      {selectedLog.target?.subtitle && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {selectedLog.target.subtitle}
                        </span>
                      )}
                    </div>
                  </div>

                  {selectedLog.target?.link && (
                    <div className="pt-2">
                      <Link
                        to={selectedLog.target.link}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-medium text-xs transition-colors cursor-pointer w-fit"
                      >
                        <span>Open Target Resource</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>

              {/* State Changes & Transitions (Diff View) */}
              {selectedLog.changes && Object.keys(selectedLog.changes).length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    State Transitions & Policy Changes
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {/* Status Change */}
                    {selectedLog.changes.status && (
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">Status:</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                            {selectedLog.changes.status.from || 'ANY'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold border border-blue-500/20">
                            {selectedLog.changes.status.to}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Roles Change */}
                    {selectedLog.changes.roles && (
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">Roles:</span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[10px]">
                            {selectedLog.changes.roles.from || 'Default'}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold border border-purple-500/20">
                            {selectedLog.changes.roles.to}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Merged Destination */}
                    {selectedLog.changes.mergedInto && (
                      <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between col-span-full">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">Merged Into Category:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {selectedLog.changes.mergedInto}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Reason Quote */}
                  {selectedLog.changes.reason && (
                    <div className="p-3 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 dark:text-slate-500 font-medium block mb-1">
                        Reason Provided:
                      </span>
                      <p className="italic text-slate-800 dark:text-slate-200">
                        "{selectedLog.changes.reason}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Bulk Operation: Affected Items Roster */}
              {selectedLog.target?.isBulk && selectedLog.target?.items?.length > 0 && (
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Affected Items ({selectedLog.target.items.length} Total)
                    </span>
                    <span className="text-[10px] text-slate-400">Click any item to inspect directly</span>
                  </div>

                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-800/50 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">
                          <th className="py-2 px-3">Name / Title</th>
                          <th className="py-2 px-3">Identifier / Details</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {selectedLog.target.items.map((item, idx) => (
                          <tr key={item.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                            <td className="py-2 px-3 font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">
                              {item.name}
                            </td>
                            <td className="py-2 px-3 text-slate-500 dark:text-slate-400 text-[11px] truncate max-w-[180px]">
                              {item.email}
                            </td>
                            <td className="py-2 px-3">
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {item.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right">
                              {item.link ? (
                                <Link
                                  to={item.link}
                                  className="text-blue-600 dark:text-blue-400 hover:underline font-medium text-[11px] inline-flex items-center gap-0.5"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </Link>
                              ) : (
                                <span className="text-slate-400 text-[10px] font-mono">{item.id.slice(0, 8)}...</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Technical Metadata Drawer (Collapsible) */}
              <div className="pt-2">
                <button
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors cursor-pointer text-xs font-semibold"
                >
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-slate-500" />
                    <span>View Raw Technical Payload (JSON)</span>
                  </div>
                  {showRawJson ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showRawJson && (
                  <div className="mt-2 relative">
                    <div className="absolute top-2 right-2 z-10">
                      <button
                        onClick={() => handleCopyJson(selectedLog.metadata || {})}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[11px] transition-colors cursor-pointer"
                      >
                        {copied ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-slate-100 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 font-mono text-[11px] text-slate-800 dark:text-slate-300 overflow-x-auto max-h-60">
                      <pre>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400">
                Log ID: {selectedLog.id}
              </span>
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
