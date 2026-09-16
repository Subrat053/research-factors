import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  ScrollText,
  Search,
  Filter,
  Eye,
  Shield,
  Clock,
  X,
  Loader2,
  Code
} from 'lucide-react';

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page],
    queryFn: async () => {
      const res = await adminApi.getAuditLogs({ page, limit: 25 });
      return res.data;
    }
  });

  const logs = data || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  return (
    <AdminLayout
      title="Immutable Security Audit Trail"
      subtitle="Complete chronological record of all administrative actions, editorial approvals, and security state modifications"
    >
      <Helmet>
        <title>Audit Logs — Research Factors Admin</title>
      </Helmet>

      {/* Audit Logs Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-20 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading audit records...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-20 text-center">
            <ScrollText className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Audit Records Logged</h3>
            <p className="text-xs text-slate-400 mt-1">Sensitive operations will automatically record audit events here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Staff Actor</th>
                  <th className="py-3.5 px-6">Action Triggered</th>
                  <th className="py-3.5 px-6">Target Entity</th>
                  <th className="py-3.5 px-6">Target ID</th>
                  <th className="py-3.5 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 text-slate-400 text-[11px] font-mono whitespace-nowrap">
                      {new Date(l.createdAt).toLocaleString()}
                    </td>

                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300">
                          {l.actor?.[0] || 'S'}
                        </div>
                        <span className="font-semibold text-white">{l.actor}</span>
                      </div>
                    </td>

                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-mono font-bold bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        {l.action}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-slate-300 font-semibold">{l.entityType}</td>

                    <td className="py-4 px-6 text-slate-400 font-mono text-[11px] truncate max-w-[120px]" title={l.entityId}>
                      {l.entityId}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => setSelectedLog(l)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                        title="Inspect Metadata Payload"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
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
            <span>Showing page {page} of {pagination.totalPages}</span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-30"
              >
                Previous
              </button>
              <span className="font-semibold text-white">{page}</span>
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

      {/* Audit Metadata JSON Drawer / Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <Code className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-serif font-bold text-white">
                  Audit Event Payload — {selectedLog.action}
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Actor:</span>
                <span className="font-semibold text-white">{selectedLog.actor}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Resource:</span>
                <span className="font-semibold text-white">{selectedLog.entityType} ({selectedLog.entityId})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Logged At:</span>
                <span className="font-mono text-slate-300">{new Date(selectedLog.createdAt).toUTCString()}</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 p-4 rounded-xl border border-slate-800/80 font-mono text-[11px] text-slate-300">
              <pre>{JSON.stringify(selectedLog.metadata || {}, null, 2)}</pre>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700"
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
