import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  Image as ImageIcon,
  Search,
  Filter,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  HardDrive,
  Loader2,
  X,
  AlertTriangle
} from 'lucide-react';

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const [providerFilter, setProviderFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Fetch Media
  const { data, isLoading } = useQuery({
    queryKey: ['admin-media', { provider: providerFilter, search, page }],
    queryFn: async () => {
      const res = await adminApi.listMedia({ provider: providerFilter, search, page, limit: 18 });
      return res.data;
    }
  });

  const media = data?.media || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteMediaAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-media']);
      setAlertMsg({ type: 'success', text: 'Media asset deleted from database and storage provider.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete media asset' });
    }
  });

  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AdminLayout
      title="Digital Assets & Media Library"
      subtitle="Inspect uploaded photographs, illustrations, and figures across active storage providers"
    >
      <Helmet>
        <title>Media Library — Research Factors Admin</title>
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

      {/* Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media by filename, alt text, or caption..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(e) => {
            setProviderFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
        >
          <option value="">All Storage Providers</option>
          <option value="local">Local Disk</option>
          <option value="cloudinary">Cloudinary CDN</option>
          <option value="r2">Cloudflare R2</option>
        </select>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/60 rounded-2xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading digital assets...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="p-20 text-center bg-slate-900/60 rounded-2xl border border-slate-800">
          <ImageIcon className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-white">No Media Assets Found</h3>
          <p className="text-xs text-slate-400 mt-1">Uploaded manuscript figures and hero images will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {media.map((m) => (
            <div
              key={m.id}
              className="bg-slate-900/70 border border-slate-800/90 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-slate-700 transition-colors group"
            >
              {/* Image Preview Thumbnail */}
              <div className="aspect-video bg-slate-950 relative overflow-hidden flex items-center justify-center">
                <img
                  src={m.publicUrl}
                  alt={m.altText || m.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs text-slate-200 border border-white/10">
                  {m.provider}
                </span>
              </div>

              {/* Asset Metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-white truncate" title={m.originalName}>
                    {m.originalName}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1">
                    <span>{m.width && m.height ? `${m.width}x${m.height}` : 'Vector/WebP'}</span>
                    <span>·</span>
                    <span>{Math.round((m.sizeBytes || 0) / 1024)} KB</span>
                  </div>
                  {m.uploader && (
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Uploaded by {m.uploader.name}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCopyUrl(m.publicUrl, m.id)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Copy Public URL"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={m.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      title="Open Full Resolution"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <button
                    onClick={() => {
                      if (window.confirm(`Force delete asset '${m.originalName}' from both database and ${m.provider} storage?`)) {
                        deleteMutation.mutate(m.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                    title="Force Delete Asset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
          <span>Showing {media.length} of {pagination.total} assets</span>
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
    </AdminLayout>
  );
}
