import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useConfirm } from '../../context/ModalContext.jsx';
import {
  Image as ImageIcon,
  Search,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  X,
  LayoutGrid,
  List,
  Table as TableIcon,
  Layers,
  FileText,
  Folder,
  User,
  Sparkles,
  ArrowUpRight,
  Info,
  ShieldAlert,
  Calendar,
  HardDrive
} from 'lucide-react';

export default function MediaLibraryPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  // View mode: 'grid' | 'list' | 'table'
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('rf_admin_media_view_mode') || 'grid';
  });

  const [providerFilter, setProviderFilter] = useState('');
  const [usageFilter, setUsageFilter] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);
  const [selectedUsageMedia, setSelectedUsageMedia] = useState(null);

  // Persist view mode preference
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('rf_admin_media_view_mode', mode);
  };

  // 1. Fetch Media List
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-media', { provider: providerFilter, usageFilter, search, page }],
    queryFn: async () => {
      const res = await adminApi.listMedia({
        provider: providerFilter,
        usageFilter,
        search,
        page,
        limit: viewMode === 'table' ? 20 : 16
      });
      return res.data;
    }
  });

  const media = data?.media || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // 2. Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteMediaAsset(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-media']);
      if (selectedUsageMedia) setSelectedUsageMedia(null);
      setAlertMsg({ type: 'success', text: 'Media asset permanently deleted from database and storage provider.' });
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

  const formatFileSize = (bytes = 0) => {
    if (!bytes) return '0 KB';
    if (bytes >= 1024 * 1024) {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <AdminLayout
      title="Digital Assets & Media Library"
      subtitle="Inspect uploaded photographs, illustrations, and figures across active storage providers and track their usage across content"
    >
      <Helmet>
        <title>Media Library — Research Factors Admin</title>
      </Helmet>

      {/* Alerts */}
      {alertMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium border animate-in fade-in duration-150 ${
            alertMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="p-1 opacity-70 hover:opacity-100 transition-opacity cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800/60 text-xs">
          Failed to load media assets: {error?.message || 'Server error'}. Please refresh or try again.
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-toolbar mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Search */}
        <div className="flex-1 relative min-w-[240px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search media by filename, alt text, or caption..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="admin-input w-full pl-10 pr-4 py-2 rounded-xl text-xs"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls & View Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Compact Storage Provider Select */}
          <div className="w-auto">
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setPage(1);
              }}
              className="admin-input w-36 sm:w-40 px-3 py-2 rounded-xl text-xs cursor-pointer"
              title="Filter by Storage Provider"
            >
              <option value="">All Providers</option>
              <option value="local">Local Disk</option>
              <option value="cloudinary">Cloudinary</option>
              <option value="r2">Cloudflare R2</option>
            </select>
          </div>

          {/* Usage Status Filter */}
          <div className="w-auto">
            <select
              value={usageFilter}
              onChange={(e) => {
                setUsageFilter(e.target.value);
                setPage(1);
              }}
              className="admin-input w-36 sm:w-40 px-3 py-2 rounded-xl text-xs cursor-pointer"
              title="Filter by Content Usage"
            >
              <option value="">All Usages</option>
              <option value="used">Used in Content</option>
              <option value="unused">Unused / Orphaned</option>
            </select>
          </div>

          {/* View Mode Toggle Buttons */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80">
            <button
              onClick={() => handleViewModeChange('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              onClick={() => handleViewModeChange('list')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">List</span>
            </button>

            <button
              onClick={() => handleViewModeChange('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Tabular / Table View"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="admin-card rounded-2xl p-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading digital assets and resolving content references...</p>
        </div>
      ) : media.length === 0 ? (
        <div className="admin-card rounded-2xl p-20 text-center">
          <ImageIcon className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Media Assets Found</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {search || providerFilter || usageFilter
              ? 'No digital assets match your current search and filter criteria. Try clearing filters.'
              : 'Uploaded manuscript figures and hero images will appear here.'}
          </p>
          {(search || providerFilter || usageFilter) && (
            <button
              onClick={() => {
                setSearch('');
                setProviderFilter('');
                setUsageFilter('');
                setPage(1);
              }}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ================= 1. GRID VIEW ================= */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {media.map((m) => (
            <div
              key={m.id}
              className="admin-card rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between hover:border-blue-500/40 transition-colors group"
            >
              {/* Image Preview Thumbnail */}
              <div className="aspect-video bg-slate-100 dark:bg-slate-950 relative overflow-hidden flex items-center justify-center border-b border-slate-200 dark:border-slate-800">
                <img
                  src={m.publicUrl}
                  alt={m.altText || m.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                {/* Storage Provider Pill */}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-xs text-slate-200 border border-white/10">
                  {m.provider}
                </span>

                {/* Content Usage Pill */}
                <button
                  onClick={() => setSelectedUsageMedia(m)}
                  className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide flex items-center gap-1 backdrop-blur-xs cursor-pointer transition-transform hover:scale-105 ${
                    m.usageCount > 0
                      ? 'bg-emerald-600/90 hover:bg-emerald-600 text-white border border-emerald-400/30'
                      : 'bg-black/60 text-slate-300 border border-white/10'
                  }`}
                  title={m.usageCount > 0 ? `Used in ${m.usageCount} location(s) - click to inspect` : 'Unused asset'}
                >
                  <Layers className="w-3 h-3" />
                  <span>{m.usageCount > 0 ? `${m.usageCount} Used` : 'Unused'}</span>
                </button>
              </div>

              {/* Asset Metadata */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={m.originalName}>
                    {m.originalName}
                  </h4>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    <span>{m.width && m.height ? `${m.width}x${m.height}` : 'WebP'}</span>
                    <span>·</span>
                    <span>{formatFileSize(m.sizeBytes)}</span>
                  </div>
                  {m.uploader && (
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-1 truncate">
                      Uploaded by {m.uploader.name}
                    </span>
                  )}
                </div>

                {/* Actions Row */}
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-200 dark:border-slate-800/80">
                  <button
                    onClick={() => setSelectedUsageMedia(m)}
                    className="flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                    title="Where is this image used?"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Usages</span>
                  </button>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => handleCopyUrl(m.publicUrl, m.id)}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Copy Public URL"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <a
                      href={m.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      title="Open Full Resolution"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Force Delete Asset',
                          message: `Force delete asset '${m.originalName}' from database and ${m.provider} storage? This file will be permanently removed.`,
                          confirmText: 'Delete Asset',
                          cancelText: 'Cancel',
                          variant: 'danger'
                        });
                        if (ok) {
                          deleteMutation.mutate(m.id);
                        }
                      }}
                      className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                      title="Force Delete Asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        /* ================= 2. LIST VIEW ================= */
        <div className="space-y-3">
          {media.map((m) => (
            <div
              key={m.id}
              className="admin-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:border-blue-500/40 transition-colors"
            >
              {/* Left: Thumbnail & Details */}
              <div className="flex items-center space-x-4 min-w-0">
                <div className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 relative">
                  <img
                    src={m.publicUrl}
                    alt={m.altText || m.originalName}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-black/70 text-slate-200">
                    {m.provider}
                  </span>
                </div>

                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white truncate" title={m.originalName}>
                    {m.originalName}
                  </h4>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>{m.width && m.height ? `${m.width}×${m.height}` : 'WebP'}</span>
                    <span>·</span>
                    <span>{formatFileSize(m.sizeBytes)}</span>
                    {m.uploader && (
                      <>
                        <span>·</span>
                        <span className="text-slate-400 dark:text-slate-500 truncate">By {m.uploader.name}</span>
                      </>
                    )}
                  </div>

                  {/* Usage Summary Row */}
                  <div className="mt-2 flex items-center gap-2">
                    {m.usageCount > 0 ? (
                      <button
                        onClick={() => setSelectedUsageMedia(m)}
                        className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 cursor-pointer transition-colors"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Used in {m.usageCount} location(s):</span>
                        <span className="font-semibold max-w-[200px] truncate">
                          {m.usagesSummary?.slice(0, 1).join(', ')}
                          {m.usagesSummary?.length > 1 ? ` +${m.usagesSummary.length - 1} more` : ''}
                        </span>
                        <ArrowUpRight className="w-3 h-3 opacity-70" />
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 italic flex items-center gap-1">
                        <Info className="w-3 h-3" /> Unused asset
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Actions */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                <button
                  onClick={() => setSelectedUsageMedia(m)}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
                  title="Inspect Usages"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Inspect Usages</span>
                </button>

                <button
                  onClick={() => handleCopyUrl(m.publicUrl, m.id)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Copy URL"
                >
                  {copiedId === m.id ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>

                <a
                  href={m.publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                  title="Open Full Resolution"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>

                <button
                  onClick={async () => {
                    const ok = await confirm({
                      title: 'Force Delete Asset',
                      message: `Force delete asset '${m.originalName}'? It will be permanently removed from storage.`,
                      confirmText: 'Delete Asset',
                      cancelText: 'Cancel',
                      variant: 'danger'
                    });
                    if (ok) {
                      deleteMutation.mutate(m.id);
                    }
                  }}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                  title="Force Delete Asset"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* ================= 3. TABULAR / TABLE VIEW ================= */
        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xs">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3.5 px-4">Digital Asset</th>
                <th className="py-3.5 px-4">Provider</th>
                <th className="py-3.5 px-4">Dimensions</th>
                <th className="py-3.5 px-4">Size</th>
                <th className="py-3.5 px-4">Content Usage</th>
                <th className="py-3.5 px-4">Uploader</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {media.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  {/* Asset */}
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <img
                        src={m.publicUrl}
                        alt={m.altText || m.originalName}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0"
                        loading="lazy"
                      />
                      <div className="min-w-0 max-w-[220px]">
                        <p className="font-semibold text-slate-900 dark:text-white truncate" title={m.originalName}>
                          {m.originalName}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {m.altText || m.caption || 'No alt text'}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Provider */}
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {m.provider}
                    </span>
                  </td>

                  {/* Dimensions */}
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {m.width && m.height ? `${m.width}×${m.height}` : 'WebP'}
                  </td>

                  {/* Size */}
                  <td className="py-3 px-4 text-slate-600 dark:text-slate-300 font-mono text-[11px]">
                    {formatFileSize(m.sizeBytes)}
                  </td>

                  {/* Content Usage */}
                  <td className="py-3 px-4">
                    {m.usageCount > 0 ? (
                      <button
                        onClick={() => setSelectedUsageMedia(m)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800/60 cursor-pointer transition-colors"
                        title="Click to see where this asset is used"
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span>Used in {m.usageCount} item{m.usageCount > 1 ? 's' : ''}</span>
                        <ArrowUpRight className="w-3 h-3 opacity-70" />
                      </button>
                    ) : (
                      <span className="text-slate-400 dark:text-slate-500 text-xs italic">
                        Unused
                      </span>
                    )}
                  </td>

                  {/* Uploader */}
                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs truncate max-w-[150px]">
                    {m.uploader?.name || 'System'}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end space-x-1.5">
                      <button
                        onClick={() => setSelectedUsageMedia(m)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-blue-100 dark:bg-slate-800 dark:hover:bg-blue-950 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 transition-colors cursor-pointer"
                        title="Inspect Content Usages"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleCopyUrl(m.publicUrl, m.id)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Copy Public URL"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <a
                        href={m.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                        title="Open Full Resolution"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Force Delete Asset',
                            message: `Force delete asset '${m.originalName}'? It will be removed from storage and database.`,
                            confirmText: 'Delete Asset',
                            cancelText: 'Cancel',
                            variant: 'danger'
                          });
                          if (ok) {
                            deleteMutation.mutate(m.id);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                        title="Force Delete Asset"
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
        <div className="mt-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/40 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
          <span>Showing {media.length} of {pagination.total} assets</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              Previous
            </button>
            <span className="font-semibold text-slate-900 dark:text-white">{page} / {pagination.totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page === pagination.totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Asset Usage Inspector Modal */}
      {selectedUsageMedia && (
        <AssetUsageModal
          media={selectedUsageMedia}
          onClose={() => setSelectedUsageMedia(null)}
          onDelete={async (id, name) => {
            const ok = await confirm({
              title: 'Force Delete Asset',
              message: `Force delete asset '${name}'? This action cannot be undone.`,
              confirmText: 'Delete Asset',
              cancelText: 'Cancel',
              variant: 'danger'
            });
            if (ok) {
              deleteMutation.mutate(id);
            }
          }}
        />
      )}
    </AdminLayout>
  );
}

/**
 * Modal to inspect where a digital asset is used in articles, content blocks,
 * categories, user avatars, or SEO metadata.
 */
function AssetUsageModal({ media, onClose, onDelete }) {
  const [copied, setCopied] = useState(false);

  // Fetch granular usages from backend
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-media-usages', media.id],
    queryFn: async () => {
      const res = await adminApi.getMediaUsages(media.id);
      return res.data;
    }
  });

  const usages = data?.usages || [];
  const totalUsages = data?.totalUsages ?? 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(media.publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getEntityIcon = (type) => {
    switch (type) {
      case 'article':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'article_block':
        return <Layers className="w-4 h-4 text-indigo-500" />;
      case 'category':
        return <Folder className="w-4 h-4 text-amber-500" />;
      case 'user':
        return <User className="w-4 h-4 text-emerald-500" />;
      case 'seo':
        return <Sparkles className="w-4 h-4 text-purple-500" />;
      default:
        return <FileText className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="admin-modal rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Content Usage & References
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-md">
                Tracking content fields referencing <span className="font-semibold text-slate-700 dark:text-slate-300">{media.originalName}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {/* Asset Summary Card */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center gap-4">
            <div className="w-24 h-16 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shrink-0 relative">
              <img
                src={media.publicUrl}
                alt={media.originalName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1 w-full sm:w-auto">
              <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={media.originalName}>
                {media.originalName}
              </h4>
              <div className="flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="uppercase font-bold text-slate-600 dark:text-slate-300">{media.provider}</span>
                <span>·</span>
                <span>{media.width && media.height ? `${media.width}×${media.height}` : 'WebP'}</span>
                <span>·</span>
                <span>{Math.round((media.sizeBytes || 0) / 1024)} KB</span>
              </div>
              <div className="flex items-center space-x-2 mt-2">
                <input
                  type="text"
                  readOnly
                  value={media.publicUrl}
                  className="text-[11px] font-mono bg-white dark:bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 flex-1 truncate text-slate-600 dark:text-slate-300 select-all"
                />
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Usage Status Banner */}
          {isLoading ? (
            <div className="py-10 flex flex-col items-center justify-center space-y-2 text-slate-500 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <p className="text-xs">Analyzing content items and database references...</p>
            </div>
          ) : isError ? (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-700 dark:text-red-300">
              Failed to inspect usage references. Please try again.
            </div>
          ) : totalUsages === 0 ? (
            /* Empty / Unused State */
            <div className="p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center bg-slate-50/50 dark:bg-slate-900/30 space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                <Info className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
                Orphaned Digital Asset (Unused)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                This asset is not currently referenced in any article covers, content manuscript blocks, category illustrations, author profiles, or SEO metadata.
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Safe to delete or retain for future editorial publications.
              </p>
            </div>
          ) : (
            /* Used References List */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Referenced in {totalUsages} Location{totalUsages > 1 ? 's' : ''}
                </h4>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Active in Publication
                </span>
              </div>

              <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                {usages.map((u, idx) => (
                  <div
                    key={u.id || idx}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-start space-x-3 min-w-0">
                      <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                        {getEntityIcon(u.itemType)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {u.itemTypeLabel || u.itemType}
                          </span>
                          <span className="text-xs font-semibold text-slate-900 dark:text-white truncate" title={u.title}>
                            {u.title}
                          </span>
                        </div>

                        {/* Content Field Badge */}
                        <div className="mt-1.5 flex items-center flex-wrap gap-2 text-xs">
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                            <span>Field:</span>
                            <span className="font-semibold">{u.fieldLabel || u.field}</span>
                          </span>
                          {u.extra && (
                            <span className="text-[11px] text-slate-400 dark:text-slate-500">
                              {u.extra}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Links */}
                    <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                      {u.viewUrl && (
                        <a
                          href={u.viewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Public Page"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {u.adminUrl && (
                        <Link
                          to={u.adminUrl}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 transition-colors flex items-center gap-1"
                          title="Open Editor"
                        >
                          <span>Edit</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <button
            onClick={() => onDelete(media.id, media.originalName)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Force Delete Asset</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
