import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ModalContext.jsx';
import { adminApi } from '../../services/admin.api.js';
import { mediaApi, normalizeMediaUrl } from '../../services/media.api.js';
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
  GitMerge,
  Sparkles,
  RotateCcw,
  Upload,
  Image as ImageIcon
} from 'lucide-react';

export default function CategoryManagementPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
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
    isActive: true,
    showInFooter: true,
    seoTitle: '',
    seoDescription: '',
    seoKeywords: '',
    canonicalUrl: ''
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

  const [customSeo, setCustomSeo] = useState({
    title: false,
    desc: false,
    keywords: false,
    canonical: false
  });

  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingImage(true);
      const res = await mediaApi.upload(file, { altText: `${formData.name || 'Category'} Flaticon` });
      if (res?.data?.publicUrl) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.publicUrl }));
        setAlertMsg({ type: 'success', text: 'Illustration uploaded successfully!' });
      }
    } catch (err) {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to upload category illustration' });
    } finally {
      setIsUploadingImage(false);
    }
  };

  const getGeneratedCategorySeo = (name, slug, desc) => {
    const cleanSlug = slug || (name ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : '');
    return {
      title: name ? `${name} Research, Analysis & Comparative Studies — Research Factors` : '',
      desc: desc || (name ? `Explore peer-reviewed empirical research, comparative benchmarks, and authoritative analyses in ${name} at Research Factors.` : ''),
      keywords: name ? `${name}, ${name} research, comparative studies, technical analysis, peer-reviewed, benchmarks` : '',
      canonical: cleanSlug ? `${window.location.origin}/categories/${cleanSlug}` : ''
    };
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setCustomSeo({ title: false, desc: false, keywords: false, canonical: false });
    setFormData({
      name: '',
      slug: '',
      description: '',
      imageUrl: '',
      parentId: '',
      isActive: true,
      showInFooter: true,
      seoTitle: '',
      seoDescription: '',
      seoKeywords: '',
      canonicalUrl: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    const hasCustomTitle = Boolean(cat.seoTitle);
    const hasCustomDesc = Boolean(cat.seoDescription);
    const hasCustomKeywords = Boolean(cat.seoKeywords);
    const hasCustomCanonical = Boolean(cat.canonicalUrl);

    setCustomSeo({
      title: hasCustomTitle,
      desc: hasCustomDesc,
      keywords: hasCustomKeywords,
      canonical: hasCustomCanonical
    });

    const gen = getGeneratedCategorySeo(cat.name, cat.slug, cat.description);

    setFormData({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
      imageUrl: cat.imageUrl || '',
      parentId: cat.parentId || '',
      isActive: cat.isActive !== undefined ? cat.isActive : true,
      showInFooter: cat.showInFooter !== undefined ? cat.showInFooter : true,
      seoTitle: hasCustomTitle ? cat.seoTitle : gen.title,
      seoDescription: hasCustomDesc ? cat.seoDescription : gen.desc,
      seoKeywords: hasCustomKeywords ? cat.seoKeywords : gen.keywords,
      canonicalUrl: hasCustomCanonical ? cat.canonicalUrl : gen.canonical
    });
    setModalOpen(true);
  };

  const handleNameChange = (newName) => {
    const cleanSlug = newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const gen = getGeneratedCategorySeo(newName, cleanSlug, formData.description);

    setFormData(prev => ({
      ...prev,
      name: newName,
      slug: cleanSlug,
      seoTitle: customSeo.title ? prev.seoTitle : gen.title,
      seoDescription: customSeo.desc ? prev.seoDescription : gen.desc,
      seoKeywords: customSeo.keywords ? prev.seoKeywords : gen.keywords,
      canonicalUrl: customSeo.canonical ? prev.canonicalUrl : gen.canonical
    }));
  };

  const handleDescriptionChange = (newDesc) => {
    const gen = getGeneratedCategorySeo(formData.name, formData.slug, newDesc);

    setFormData(prev => ({
      ...prev,
      description: newDesc,
      seoDescription: customSeo.desc ? prev.seoDescription : gen.desc
    }));
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
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
          }`}
        >
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="p-1 opacity-70 hover:opacity-100 transition-opacity">
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
                  <th className="py-3.5 px-6">Footer</th>
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

                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.showInFooter !== false
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {c.showInFooter !== false ? 'In Footer' : 'Hidden'}
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
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Delete Category',
                                message: `Delete category '${c.name}'? Safe deletion will prevent removing categories with existing articles.`,
                                confirmText: 'Delete Category',
                                cancelText: 'Cancel',
                                variant: 'danger'
                              });
                              if (ok) {
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setModalOpen(false);
          }}
        >
          <div className="admin-modal rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure category name, slug, description, and hierarchy nesting.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form id="category-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:px-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
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
                  onChange={(e) => {
                    setFormData({ ...formData, slug: e.target.value });
                    if (!customSeo.canonical) {
                      const gen = getGeneratedCategorySeo(formData.name, e.target.value, formData.description);
                      setFormData(prev => ({ ...prev, slug: e.target.value, canonicalUrl: gen.canonical }));
                    }
                  }}
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
                  onChange={(e) => handleDescriptionChange(e.target.value)}
                  placeholder="Brief editorial scope for this section..."
                  className="admin-input w-full p-3 rounded-xl text-xs"
                />
              </div>

              {/* Card Illustration / Flaticon Upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Card Illustration / Flaticon (Optional)
                </label>
                <div className="flex items-center space-x-3">
                  {formData.imageUrl ? (
                    <div className="relative w-14 h-14 rounded-xl border border-slate-200 dark:border-slate-700 p-1.5 bg-slate-50 dark:bg-slate-800 flex items-center justify-center shrink-0">
                      <img
                        src={normalizeMediaUrl(formData.imageUrl)}
                        alt="Preview"
                        className="w-full h-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600 transition-colors shadow-xs"
                        aria-label="Remove illustration"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-14 h-14 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 cursor-pointer transition-colors shrink-0">
                      {isUploadingImage ? (
                        <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                      <input
                        type="file"
                        accept="image/svg+xml,image/png,image/webp,image/jpeg"
                        onChange={handleImageFileChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="flex-1">
                    <input
                      type="text"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                      placeholder="Upload image or paste Flaticon SVG/PNG URL..."
                      className="admin-input w-full px-3 py-2 rounded-xl text-xs font-mono"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">
                      Appears in the upper-right corner of the card. If omitted, the system automatically uses a smart semantic Flaticon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="catActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 select-none">
                    Category is Active (Visible on public magazine)
                  </span>
                </label>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    id="catShowInFooter"
                    checked={formData.showInFooter}
                    onChange={(e) => setFormData({ ...formData, showInFooter: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 select-none">
                    Show in Footer (Display this category link in website footer)
                  </span>
                </label>
              </div>

              {/* SEO & Metadata Section */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    SEO & Search Metadata
                  </h4>
                  <span className="text-[10px] text-slate-400">Pre-populated & Live Synchronized</span>
                </div>

                {/* SEO Title */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      SEO Meta Title
                    </label>
                    <div className="flex items-center space-x-2">
                      {customSeo.title ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          Custom Override
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Auto-Generated (Live Sync)</span>
                        </span>
                      )}
                      {customSeo.title && (
                        <button
                          type="button"
                          onClick={() => {
                            const gen = getGeneratedCategorySeo(formData.name, formData.slug, formData.description);
                            setCustomSeo(prev => ({ ...prev, title: false }));
                            setFormData(prev => ({ ...prev, seoTitle: gen.title }));
                          }}
                          className="inline-flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Re-sync</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    type="text"
                    value={formData.seoTitle}
                    onChange={(e) => {
                      setCustomSeo(prev => ({ ...prev, title: true }));
                      setFormData(prev => ({ ...prev, seoTitle: e.target.value }));
                    }}
                    placeholder="e.g. Technology Research & Analysis"
                    className="admin-input w-full p-2.5 rounded-xl text-xs font-medium"
                  />
                </div>

                {/* SEO Description */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      SEO Meta Description
                    </label>
                    <div className="flex items-center space-x-2">
                      {customSeo.desc ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                          Custom Override
                        </span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 flex items-center space-x-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>Auto-Generated (Live Sync)</span>
                        </span>
                      )}
                      {customSeo.desc && (
                        <button
                          type="button"
                          onClick={() => {
                            const gen = getGeneratedCategorySeo(formData.name, formData.slug, formData.description);
                            setCustomSeo(prev => ({ ...prev, desc: false }));
                            setFormData(prev => ({ ...prev, seoDescription: gen.desc }));
                          }}
                          className="inline-flex items-center space-x-1 text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                          <span>Re-sync</span>
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    rows="2"
                    value={formData.seoDescription}
                    onChange={(e) => {
                      setCustomSeo(prev => ({ ...prev, desc: true }));
                      setFormData(prev => ({ ...prev, seoDescription: e.target.value }));
                    }}
                    placeholder="Brief description for search engines and social cards..."
                    className="admin-input w-full p-2.5 rounded-xl text-xs font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* SEO Keywords */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        SEO Keywords
                      </label>
                      <div className="flex items-center space-x-1.5">
                        {customSeo.keywords ? (
                          <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            Custom
                          </span>
                        ) : (
                          <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Auto
                          </span>
                        )}
                        {customSeo.keywords && (
                          <button
                            type="button"
                            onClick={() => {
                              const gen = getGeneratedCategorySeo(formData.name, formData.slug, formData.description);
                              setCustomSeo(prev => ({ ...prev, keywords: false }));
                              setFormData(prev => ({ ...prev, seoKeywords: gen.keywords }));
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="text"
                      value={formData.seoKeywords}
                      onChange={(e) => {
                        setCustomSeo(prev => ({ ...prev, keywords: true }));
                        setFormData(prev => ({ ...prev, seoKeywords: e.target.value }));
                      }}
                      placeholder="comma-separated keywords"
                      className="admin-input w-full p-2.5 rounded-xl text-xs font-medium"
                    />
                  </div>

                  {/* Canonical URL */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Canonical URL
                      </label>
                      <div className="flex items-center space-x-1.5">
                        {customSeo.canonical ? (
                          <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                            Custom
                          </span>
                        ) : (
                          <span className="px-1 py-0.5 rounded text-[9px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                            Auto
                          </span>
                        )}
                        {customSeo.canonical && (
                          <button
                            type="button"
                            onClick={() => {
                              const gen = getGeneratedCategorySeo(formData.name, formData.slug, formData.description);
                              setCustomSeo(prev => ({ ...prev, canonical: false }));
                              setFormData(prev => ({ ...prev, canonicalUrl: gen.canonical }));
                            }}
                            className="text-[10px] text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <input
                      type="url"
                      value={formData.canonicalUrl}
                      onChange={(e) => {
                        setCustomSeo(prev => ({ ...prev, canonical: true }));
                        setFormData(prev => ({ ...prev, canonicalUrl: e.target.value }));
                      }}
                      placeholder="https://researchfactors.com/..."
                      className="admin-input w-full p-2.5 rounded-xl text-xs font-mono text-[11px]"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer (Pinned) */}
            <div className="flex items-center justify-end space-x-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="category-form"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 shadow-xs cursor-pointer transition-colors"
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Category Modal */}
      {mergeModalOpen && mergeSourceCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget) setMergeModalOpen(false);
          }}
        >
          <div className="admin-modal rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
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
                aria-label="Close merge modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:px-6 space-y-4 overflow-y-auto flex-1">
              <div className="admin-card-inner rounded-xl p-3 text-xs space-y-1.5">
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

              <form id="merge-category-form" onSubmit={handleMergeSubmit} className="space-y-4">
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
              </form>
            </div>

            <div className="flex items-center justify-end space-x-3 px-5 sm:px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 shrink-0">
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
                form="merge-category-form"
                disabled={mergeMutation.isPending || !targetCategoryId}
                className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
              >
                {mergeMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{mergeMutation.isPending ? 'Merging...' : 'Confirm & Merge'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
