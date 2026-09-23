import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext.jsx';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  FolderTree,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  AlertTriangle,
  X,
  Loader2,
  ChevronRight,
  Layers,
  GitMerge
} from 'lucide-react';

export default function CategoryManagementPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = useAuth();

  // Dynamic RBAC Permission Checks (no hardcoded roles)
  const canManage = hasPermission('category.manage');
  const canMerge = hasPermission('category.merge') || hasPermission('category.manage');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    imageUrl: '',
    parentId: '',
    isActive: true
  });
  const [alertMsg, setAlertMsg] = useState(null);

  // Merge Category Modal State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergeSourceCategory, setMergeSourceCategory] = useState(null);
  const [targetCategoryId, setTargetCategoryId] = useState('');

  // 1. Fetch all categories
  const { data, isLoading } = useQuery({
    queryKey: ['admin-categories-all'],
    queryFn: async () => {
      const res = await adminApi.getAllCategories();
      return res.data;
    }
  });

  const categories = data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (catData) => adminApi.createCategory(catData),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories-all']);
      setModalOpen(false);
      setAlertMsg({ type: 'success', text: 'Category created successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to create category' });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, catData }) => adminApi.updateCategory(id, catData),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories-all']);
      setModalOpen(false);
      setAlertMsg({ type: 'success', text: 'Category updated successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update category' });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => adminApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-categories-all']);
      setAlertMsg({ type: 'success', text: 'Category deleted successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete category (Ensure no articles or children are assigned)' });
    }
  });

  const mergeMutation = useMutation({
    mutationFn: ({ sourceCategoryId, targetCategoryId }) =>
      adminApi.mergeCategories({ sourceCategoryId, targetCategoryId }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-categories-all']);
      setMergeModalOpen(false);
      setMergeSourceCategory(null);
      setTargetCategoryId('');
      setAlertMsg({
        type: 'success',
        text: `Categories merged successfully! ${res?.data?.articlesReassigned || 0} article(s) reassigned to '${res?.data?.mergedInto?.name}'.`
      });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to merge categories' });
    }
  });

  const handleOpenMerge = (cat) => {
    setMergeSourceCategory(cat);
    const availableTargets = categories.filter((c) => c.id !== cat.id);
    setTargetCategoryId(availableTargets.length > 0 ? availableTargets[0].id : '');
    setMergeModalOpen(true);
  };

  const handleMergeSubmit = (e) => {
    e.preventDefault();
    if (!mergeSourceCategory || !targetCategoryId) return;
    mergeMutation.mutate({
      sourceCategoryId: mergeSourceCategory.id,
      targetCategoryId
    });
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      parentId: '',
      isActive: true
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentId || '',
      isActive: cat.isActive !== undefined ? cat.isActive : true
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      parentId: formData.parentId ? formData.parentId : null
    };

    if (editingCategory) {
      updateMutation.mutate({ id: editingCategory.id, catData: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <AdminLayout
      title="Editorial Category Taxonomy"
      subtitle="Organize publication sections, manage parent-child hierarchies, and configure taxonomy SEO"
      actions={
        canManage ? (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>New Category</span>
          </button>
        ) : null
      }
    >
      <Helmet>
        <title>Categories — Research Factors Admin</title>
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

      {/* Categories Table */}
      <div className="admin-table-container">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-16 text-center">
            <FolderTree className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Categories Configured</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Create your first editorial taxonomy category.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-100/70 dark:bg-slate-900/80">
                  <th className="py-3.5 px-6">Section / Category</th>
                  <th className="py-3.5 px-6">Slug</th>
                  <th className="py-3.5 px-6">Parent Level</th>
                  <th className="py-3.5 px-6">Articles</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {categories.map((c) => (
                  <tr key={c.id} className="admin-table-row">
                    <td className="py-4 px-6">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">{c.name}</span>
                        {c.description && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 block max-w-sm truncate mt-0.5">
                            {c.description}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-4 px-6 font-mono text-slate-500 dark:text-slate-400 text-xs">{c.slug}</td>

                    <td className="py-4 px-6 text-slate-500 dark:text-slate-400">
                      {c.parent ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                          <Layers className="w-3 h-3 mr-1 text-slate-400" />
                          {c.parent.name}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 dark:text-slate-500">Root Category</span>
                      )}
                    </td>

                    <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                      {c._count?.articles || 0}
                    </td>

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.isActive
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {c.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>

                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {canManage && (
                          <button
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                            title="Edit Category"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canMerge && categories.length > 1 && (
                          <button
                            onClick={() => handleOpenMerge(c)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-amber-500/20 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 transition-colors cursor-pointer"
                            title="Merge Category into Another"
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canManage && (
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete category '${c.name}'? Safe deletion will prevent removing categories with existing articles.`)) {
                                deleteMutation.mutate(c.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-100 dark:bg-slate-800 dark:hover:bg-red-500/20 text-slate-500 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors cursor-pointer"
                            title="Delete Category"
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
      </div>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal rounded-2xl max-w-lg w-full p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              {editingCategory ? 'Edit Category' : 'Create Category'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Configure category name, slug, description, and hierarchy nesting.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Semiconductors"
                  className="admin-input w-full px-3 py-2 rounded-xl text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Slug (Optional, auto-generated)</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  placeholder="e.g. semiconductors"
                  className="admin-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Parent Category (Optional)</label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="admin-input w-full px-3 py-2 rounded-xl text-xs"
                >
                  <option value="">None (Top-Level Category)</option>
                  {categories
                    .filter((c) => !editingCategory || c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Editorial Description</label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief editorial scope for this section..."
                  className="admin-input w-full p-3 rounded-xl text-xs"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="catActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="catActive" className="text-xs text-slate-700 dark:text-slate-300 select-none cursor-pointer">
                  Category is Active (Visible on public magazine)
                </label>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs cursor-pointer"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Merge Category Modal */}
      {mergeModalOpen && mergeSourceCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <GitMerge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Merge Category</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Migrate content to consolidated section</p>
                </div>
              </div>
              <button
                onClick={() => setMergeModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="admin-card-inner rounded-xl p-3 mb-4 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Source Category:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{mergeSourceCategory.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Articles to Reassign:</span>
                <span className="font-semibold text-amber-600 dark:text-amber-400">{mergeSourceCategory._count?.articles || 0}</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800/80 leading-relaxed">
                All articles and subcategories linked to <strong className="text-slate-800 dark:text-white">"{mergeSourceCategory.name}"</strong> will be safely repointed to the destination category, and the source category will be deleted.
              </p>
            </div>

            <form onSubmit={handleMergeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Select Target Destination Category
                </label>
                <select
                  value={targetCategoryId}
                  onChange={(e) => setTargetCategoryId(e.target.value)}
                  className="admin-input w-full px-3 py-2.5 rounded-xl text-xs"
                  required
                >
                  {categories
                    .filter((c) => c.id !== mergeSourceCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c._count?.articles || 0} articles)
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMergeModalOpen(false)}
                  disabled={mergeMutation.isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={mergeMutation.isPending || !targetCategoryId}
                  className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                >
                  {mergeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{mergeMutation.isPending ? 'Merging...' : 'Confirm & Merge'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
