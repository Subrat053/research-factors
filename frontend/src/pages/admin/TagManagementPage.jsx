import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  Tags,
  Plus,
  GitMerge,
  Search,
  Edit2,
  Trash2,
  X,
  Loader2,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

export default function TagManagementPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Modals
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [tagName, setTagName] = useState('');

  // Tag Merge Modal
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [sourceTagId, setSourceTagId] = useState('');
  const [targetTagId, setTargetTagId] = useState('');

  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Fetch Tags
  const { data, isLoading } = useQuery({
    queryKey: ['admin-tags', { search, page }],
    queryFn: async () => {
      const res = await adminApi.listTags({ search, page, limit: 30 });
      return res.data;
    }
  });

  const tags = data?.tags || [];
  const pagination = data?.pagination || { total: 0, totalPages: 1 };

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data) => adminApi.createTag(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tags']);
      setTagModalOpen(false);
      setTagName('');
      setAlertMsg({ type: 'success', text: 'Tag created successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to create tag' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateTag(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tags']);
      setTagModalOpen(false);
      setTagName('');
      setAlertMsg({ type: 'success', text: 'Tag updated successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update tag' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-tags']);
      setAlertMsg({ type: 'success', text: 'Tag deleted successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete tag' });
    }
  });

  const mergeMutation = useMutation({
    mutationFn: (payload) => adminApi.mergeTags(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-tags']);
      setMergeModalOpen(false);
      setSourceTagId('');
      setTargetTagId('');
      setAlertMsg({
        type: 'success',
        text: `Successfully merged tag '${res.data.deletedTag?.name}' into '${res.data.mergedInto?.name}'. Reassigned ${res.data.articlesReassigned} article(s).`
      });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to merge tags' });
    }
  });

  const handleOpenCreate = () => {
    setEditingTag(null);
    setTagName('');
    setTagModalOpen(true);
  };

  const handleOpenEdit = (t) => {
    setEditingTag(t);
    setTagName(t.name);
    setTagModalOpen(true);
  };

  const handleSaveTag = (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;
    if (editingTag) {
      updateMutation.mutate({ id: editingTag.id, data: { name: tagName.trim() } });
    } else {
      createMutation.mutate({ name: tagName.trim() });
    }
  };

  const handleMergeSubmit = (e) => {
    e.preventDefault();
    if (!sourceTagId || !targetTagId) return;
    if (sourceTagId === targetTagId) {
      setAlertMsg({ type: 'error', text: 'Source tag and target destination tag must be different.' });
      return;
    }
    mergeMutation.mutate({ sourceTagId, targetTagId });
  };

  return (
    <AdminLayout
      title="Keywords & Tag Management"
      subtitle="Refine metadata tags, inspect article frequency, and resolve redundant synonyms using the Tag Merge Tool"
      actions={
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setMergeModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
          >
            <GitMerge className="w-3.5 h-3.5 text-blue-400" />
            <span>Tag Merge Tool</span>
          </button>
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Tag</span>
          </button>
        </div>
      }
    >
      <Helmet>
        <title>Tags & Merge — Research Factors Admin</title>
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

      {/* Search Toolbar */}
      <div className="admin-toolbar mb-6">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tags by keyword or slug..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="admin-input w-full pl-10 pr-4 py-2 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Tags Grid / List */}
      <div className="admin-table-container">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading tags directory...</p>
          </div>
        ) : tags.length === 0 ? (
          <div className="p-16 text-center">
            <Tags className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Tags Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create tags to categorize research articles.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/80">
                  <th className="py-3.5 px-6">Tag Name</th>
                  <th className="py-3.5 px-6">Slug</th>
                  <th className="py-3.5 px-6">Referenced Manuscripts</th>
                  <th className="py-3.5 px-6">Created</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {tags.map((t) => (
                  <tr key={t.id} className="admin-table-row">
                    <td className="py-4 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white">
                        {t.name}
                      </span>
                    </td>

                    <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400 text-xs">{t.slug}</td>

                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                      {t.articlesCount} articles
                    </td>

                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-[11px]">
                      {new Date(t.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleOpenEdit(t)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                          title="Edit Tag"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete tag '#${t.name}'?`)) {
                              deleteMutation.mutate(t.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                          title="Delete Tag"
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
      </div>

      {/* Add / Edit Tag Modal */}
      {tagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal rounded-2xl max-w-sm w-full p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {editingTag ? 'Edit Tag' : 'Create Tag'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter a concise, descriptive keyword for content categorization.
            </p>

            <form onSubmit={handleSaveTag} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Tag Name</label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="e.g. quantum-computing"
                  className="admin-input w-full px-3 py-2 rounded-xl text-xs"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTagModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  {editingTag ? 'Save Changes' : 'Create Tag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAG MERGE TOOL MODAL (PRD SECTION 53) */}
      {mergeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 mb-1">
              <GitMerge className="w-4 h-4" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Tag Merge Tool</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Consolidate duplicate or synonymous tags. All articles tagged with the source tag will be atomically re-assigned to the target tag, and the source tag will be deleted.
            </p>

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Source Tag (Will be merged & deleted)
                </label>
                <select
                  value={sourceTagId}
                  onChange={(e) => setSourceTagId(e.target.value)}
                  className="admin-input w-full px-3 py-2 rounded-xl text-xs"
                  required
                >
                  <option value="">Select redundant tag...</option>
                  {tags.map((t) => (
                    <option key={t.id} value={t.id}>
                      #{t.name} ({t.articlesCount} articles)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Destination Tag (Will receive all articles)
                </label>
                <select
                  value={targetTagId}
                  onChange={(e) => setTargetTagId(e.target.value)}
                  className="admin-input w-full px-3 py-2 rounded-xl text-xs"
                  required
                >
                  <option value="">Select canonical target tag...</option>
                  {tags
                    .filter((t) => t.id !== sourceTagId)
                    .map((t) => (
                      <option key={t.id} value={t.id}>
                        #{t.name} ({t.articlesCount} articles)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMergeModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mergeMutation.isPending || !sourceTagId || !targetTagId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 shadow-xs cursor-pointer"
                >
                  {mergeMutation.isPending ? 'Merging Tags...' : 'Confirm & Execute Merge'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
