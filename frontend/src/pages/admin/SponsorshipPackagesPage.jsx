import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { useConfirm } from '../../context/ModalContext.jsx';
import { DEFAULT_SPONSORSHIP_TIERS } from '../../data/defaultSponsorship.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { getAppUrl, getAppPath } from '../../utils/url.js';
import {
  Handshake,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  RotateCcw,
  Check,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Info
} from 'lucide-react';

const slugify = (text) => {
  return (text || '')
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export default function SponsorshipPackagesPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const [sponsorshipPackages, setSponsorshipPackages] = useState(DEFAULT_SPONSORSHIP_TIERS);
  const [editingPackage, setEditingPackage] = useState(null);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [newFeatureInput, setNewFeatureInput] = useState('');
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  // Fetch Settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await adminApi.getSettings();
      return res.data;
    }
  });

  // Populate form state when data loads
  useEffect(() => {
    if (settingsData?.settings) {
      const sp = settingsData.settings.sponsorship_packages;
      if (Array.isArray(sp) && sp.length > 0) {
        setSponsorshipPackages(sp);
      }
    }
  }, [settingsData]);

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (data) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings']);
      queryClient.invalidateQueries(['public-settings']);
      queryClient.invalidateQueries(['sponsorship-packages']);
      setAlertMsg({ type: 'success', text: 'Sponsorship packages updated successfully.' });
      setTimeout(() => setAlertMsg(null), 4000);
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update sponsorship packages' });
    }
  });

  const handleSaveSponsorshipPackages = (packagesToSave) => {
    const toSave = packagesToSave || sponsorshipPackages;
    updateSettingsMutation.mutate({
      sponsorship_packages: toSave
    });
  };

  const handleOpenAddPackage = () => {
    setSlugManuallyEdited(false);
    setEditingPackage({
      id: '',
      name: '',
      kicker: 'Custom Scope',
      price: '₹19,999',
      period: 'Custom Research Package',
      description: '',
      features: ['1 Sponsored technical publication with peer review'],
      cta: 'Inquire Scope',
      isPopular: false,
      isActive: true,
      _isNew: true
    });
    setNewFeatureInput('');
    setIsPackageModalOpen(true);
  };

  const handleOpenEditPackage = (pkg, index) => {
    setSlugManuallyEdited(true); // Treat existing packages as having a set slug
    setEditingPackage({
      ...pkg,
      features: Array.isArray(pkg.features) ? [...pkg.features] : [],
      _index: index,
      _isNew: false
    });
    setNewFeatureInput('');
    setIsPackageModalOpen(true);
  };

  const handleNameChange = (nameVal) => {
    if (!editingPackage) return;
    const nextPkg = { ...editingPackage, name: nameVal };
    // Auto-generate slug if it's a new package and the user hasn't manually edited the slug
    if (editingPackage._isNew && !slugManuallyEdited) {
      nextPkg.id = slugify(nameVal);
    }
    setEditingPackage(nextPkg);
  };

  const handleSlugChange = (slugVal) => {
    if (!editingPackage) return;
    setSlugManuallyEdited(true);
    setEditingPackage({
      ...editingPackage,
      id: slugVal.toLowerCase().replace(/[^a-z0-9-_]/g, '-')
    });
  };

  const handleRegenerateSlug = () => {
    if (!editingPackage) return;
    setSlugManuallyEdited(false);
    setEditingPackage({
      ...editingPackage,
      id: slugify(editingPackage.name)
    });
  };

  const handleMovePackage = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= sponsorshipPackages.length) return;
    const reordered = [...sponsorshipPackages];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIdx, 0, moved);
    setSponsorshipPackages(reordered);
    handleSaveSponsorshipPackages(reordered);
  };

  const handleTogglePackageActive = (index) => {
    const updated = [...sponsorshipPackages];
    updated[index] = {
      ...updated[index],
      isActive: updated[index].isActive === false ? true : false
    };
    setSponsorshipPackages(updated);
    handleSaveSponsorshipPackages(updated);
  };

  const handleTogglePackagePopular = (index) => {
    const updated = sponsorshipPackages.map((pkg, i) => ({
      ...pkg,
      isPopular: i === index ? !pkg.isPopular : false
    }));
    setSponsorshipPackages(updated);
    handleSaveSponsorshipPackages(updated);
  };

  const handleDeletePackage = async (index) => {
    const pkg = sponsorshipPackages[index];
    const ok = await confirm({
      title: `Delete Package "${pkg.name || 'Tier'}"?`,
      message: 'Are you sure you want to permanently delete this sponsorship package? This will immediately remove it from public inquiry forms and pricing displays.',
      confirmText: 'Delete Package',
      confirmVariant: 'danger'
    });
    if (!ok) return;

    const filtered = sponsorshipPackages.filter((_, i) => i !== index);
    setSponsorshipPackages(filtered);
    handleSaveSponsorshipPackages(filtered);
  };

  const handleResetToDefaults = async () => {
    const ok = await confirm({
      title: 'Reset to Canonical Packages?',
      message: 'This will restore the 3 default Research Factors sponsorship tiers (Quarterly Column Sponsor, Issue Underwriter, Research Brief Partner). Any customized packages will be overwritten.',
      confirmText: 'Reset to Defaults',
      confirmVariant: 'danger'
    });
    if (!ok) return;

    setSponsorshipPackages(DEFAULT_SPONSORSHIP_TIERS);
    handleSaveSponsorshipPackages(DEFAULT_SPONSORSHIP_TIERS);
  };

  const handleAddFeatureToEditingPackage = () => {
    if (!newFeatureInput.trim() || !editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      features: [...(editingPackage.features || []), newFeatureInput.trim()]
    });
    setNewFeatureInput('');
  };

  const handleRemoveFeatureFromEditingPackage = (featureIndex) => {
    if (!editingPackage) return;
    setEditingPackage({
      ...editingPackage,
      features: editingPackage.features.filter((_, idx) => idx !== featureIndex)
    });
  };

  const handleMoveFeatureInEditingPackage = (featureIndex, direction) => {
    if (!editingPackage?.features) return;
    const targetIdx = featureIndex + direction;
    if (targetIdx < 0 || targetIdx >= editingPackage.features.length) return;
    const reordered = [...editingPackage.features];
    const [moved] = reordered.splice(featureIndex, 1);
    reordered.splice(targetIdx, 0, moved);
    setEditingPackage({ ...editingPackage, features: reordered });
  };

  const handleModalSavePackage = (e) => {
    e.preventDefault();
    if (!editingPackage.name.trim() || !editingPackage.id.trim()) {
      setAlertMsg({ type: 'error', text: 'Package Name and Identifier / Slug are required.' });
      return;
    }

    const cleanedPackage = {
      id: editingPackage.id.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      name: editingPackage.name.trim(),
      kicker: (editingPackage.kicker || 'Package').trim(),
      price: (editingPackage.price || '₹0').trim(),
      period: (editingPackage.period || 'Package').trim(),
      description: (editingPackage.description || '').trim(),
      features: (editingPackage.features || []).filter((f) => f && f.trim().length > 0),
      cta: (editingPackage.cta || 'Inquire Now').trim(),
      isPopular: Boolean(editingPackage.isPopular),
      isActive: editingPackage.isActive !== false
    };

    let updatedPackages = [...sponsorshipPackages];

    if (cleanedPackage.isPopular) {
      updatedPackages = updatedPackages.map((p) => ({ ...p, isPopular: false }));
    }

    if (editingPackage._isNew) {
      // Check for duplicate ID
      const exists = updatedPackages.some((p) => p.id === cleanedPackage.id);
      if (exists) {
        cleanedPackage.id = `${cleanedPackage.id}-${Date.now().toString().slice(-4)}`;
      }
      updatedPackages.push(cleanedPackage);
    } else if (typeof editingPackage._index === 'number') {
      updatedPackages[editingPackage._index] = cleanedPackage;
    }

    setSponsorshipPackages(updatedPackages);
    setIsPackageModalOpen(false);
    setEditingPackage(null);
    handleSaveSponsorshipPackages(updatedPackages);
  };

  return (
    <AdminLayout
      title="Sponsorship Packages & Plans"
      subtitle="Configure commercial sponsorship tiers, deliverables, pricing, and visibility on the public sponsorship portal."
      actions={
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleResetToDefaults}
            disabled={updateSettingsMutation.isPending}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddPackage}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Package</span>
          </button>
          <button
            type="button"
            onClick={() => handleSaveSponsorshipPackages()}
            disabled={updateSettingsMutation.isPending}
            className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 transition-colors shadow-xs cursor-pointer"
          >
            {updateSettingsMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-3.5 h-3.5" />
            )}
            <span>Save All Changes</span>
          </button>
        </div>
      }
    >
      <Helmet>
        <title>Sponsorship Packages | Admin Studio</title>
      </Helmet>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Status / Alert Banner */}
        {alertMsg && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
              alertMsg.type === 'success'
                ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/20'
                : 'bg-red-500/10 text-red-800 dark:text-red-200 border-red-500/20'
            }`}
          >
            <div className="flex items-center space-x-2">
              {alertMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <span>{alertMsg.text}</span>
            </div>
            <button
              onClick={() => setAlertMsg(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Intro Info Banner */}
        {/* <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-300 flex items-start space-x-3">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Live Public Portal Synchronization</p>
            <p className="text-[11px] text-blue-700 dark:text-blue-300/80">
              Changes saved here instantly reflect on the public{' '}
              <a
                href={getAppUrl('/sponsorship')}
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-blue-600 dark:hover:text-blue-200"
              >
                {getAppPath('/sponsorship')}
              </a>{' '}
              page and dynamically populate the sponsorship package options in the inquiry form dropdown.
            </p>
          </div>
        </div> */}

        {/* Packages Cards Grid */}
        {settingsLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3 admin-card">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading sponsorship tiers...</p>
          </div>
        ) : sponsorshipPackages.length === 0 ? (
          <div className="admin-card p-12 text-center space-y-4">
            <Handshake className="w-12 h-12 text-slate-400 mx-auto opacity-40" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Packages Configured</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No sponsorship packages are currently defined. Click Add Package to create a custom tier or restore the canonical Research Factors defaults.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Restore Defaults
              </button>
              <button
                type="button"
                onClick={handleOpenAddPackage}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500"
              >
                Create Package
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {sponsorshipPackages.map((pkg, idx) => {
              const isPopular = Boolean(pkg.isPopular);
              const isActive = pkg.isActive !== false;

              return (
                <div
                  key={pkg.id || idx}
                  className={`admin-card p-5 relative flex flex-col justify-between transition-all duration-200 ${
                    !isActive ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/30 border-dashed' : ''
                  } ${
                    isPopular ? 'ring-2 ring-blue-500/50 shadow-md dark:ring-blue-400/40' : ''
                  }`}
                >
                  {/* Card Header & Controls */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <span className="text-sm font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                          #{idx + 1}
                        </span>
                        {isPopular && (
                          <span className="inline-flex items-center space-x-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-xs">
                            <Sparkles className="w-3 h-3" />
                            <span>Most Popular</span>
                          </span>
                        )}
                        {!isActive && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                            Hidden / Inactive
                          </span>
                        )}
                      </div>

                      {/* Move & Status Actions */}
                      <div className="flex items-center space-x-0.5">
                        <button
                          type="button"
                          onClick={() => handleMovePackage(idx, -1)}
                          disabled={idx === 0}
                          title="Move Left / Earlier"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5 sm:rotate-[-90deg]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMovePackage(idx, 1)}
                          disabled={idx === sponsorshipPackages.length - 1}
                          title="Move Right / Later"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-20 cursor-pointer"
                        >
                          <ChevronDown className="w-3.5 h-3.5 sm:rotate-[-90deg]" />
                        </button>
                      </div>
                    </div>

                    {/* Kicker & Package Title */}
                    <div className="space-y-1 mb-2">
                      <p className="text-[10px] font-bold tracking-widest text-blue-600 dark:text-blue-400 uppercase">
                        {pkg.kicker || 'Scope'}
                      </p>
                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                        {pkg.name}
                      </h4>
                      <p className="text-sm font-mono text-slate-400 dark:text-slate-500">
                        slug: {pkg.id}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="my-3 py-2 border-y border-slate-100 dark:border-slate-800/80">
                      <div className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {pkg.price}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {pkg.period || 'per package'}
                      </div>
                    </div>

                    {/* Description */}
                    {pkg.description && (
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 line-clamp-2">
                        {pkg.description}
                      </p>
                    )}

                    {/* Feature bullets count */}
                    <div className="space-y-1.5 mb-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                        Deliverables ({pkg.features?.length || 0})
                      </p>
                      <ul className="space-y-1">
                        {(pkg.features || []).slice(0, 4).map((f, fIdx) => (
                          <li key={fIdx} className="text-sm text-slate-600 dark:text-slate-300 flex items-start space-x-2">
                            <span className="text-blue-500 font-bold">•</span>
                            <span className="truncate">{f}</span>
                          </li>
                        ))}
                        {(pkg.features || []).length > 4 && (
                          <li className="text-[10px] text-slate-400 italic">
                            + {pkg.features.length - 4} more deliverables
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>

                  {/* Card Bottom Quick Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-1">
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePackagePopular(idx)}
                        title={isPopular ? 'Unset Popular Badge' : 'Set as Most Popular Badge'}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isPopular
                            ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30'
                            : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePackageActive(idx)}
                        title={isActive ? 'Deactivate / Hide from public' : 'Activate / Show on public'}
                        className={`p-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isActive
                            ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30'
                            : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30'
                        }`}
                      >
                        {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEditPackage(pkg, idx)}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(idx)}
                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                        title="Delete Tier"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal: Add / Edit Package */}
        {isPackageModalOpen && editingPackage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
            <div className="admin-card w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-scaleUp overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Handshake className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingPackage._isNew ? 'Create New Sponsorship Plan' : `Edit Package: ${editingPackage.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsPackageModalOpen(false);
                    setEditingPackage(null);
                  }}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleModalSavePackage} className="p-6 space-y-4 overflow-y-auto flex-1">
                {/* Package Name & Slug */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Package / Plan Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPackage.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                      placeholder="e.g. Authority Research Desk"
                      className="admin-input w-full"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Identifier / Slug *
                      </label>
                      {editingPackage._isNew && (
                        <button
                          type="button"
                          onClick={handleRegenerateSlug}
                          title="Re-sync slug from name"
                          className="inline-flex items-center space-x-1 text-[10px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <RefreshCw className="w-2.5 h-2.5" />
                          <span>Sync</span>
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={editingPackage.id}
                        onChange={(e) => handleSlugChange(e.target.value)}
                        placeholder="e.g. authority-research-desk"
                        className="admin-input w-full font-mono text-xs"
                      />
                    </div>
                    
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Kicker Badge
                    </label>
                    <input
                      type="text"
                      value={editingPackage.kicker}
                      onChange={(e) => setEditingPackage({ ...editingPackage, kicker: e.target.value })}
                      placeholder="e.g. Starter, Growth, Scale"
                      className="admin-input w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Display Price *
                    </label>
                    <input
                      type="text"
                      required
                      value={editingPackage.price}
                      onChange={(e) => setEditingPackage({ ...editingPackage, price: e.target.value })}
                      placeholder="e.g. ₹34,999 or Custom"
                      className="admin-input w-full font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Billing Period / Scope
                    </label>
                    <input
                      type="text"
                      value={editingPackage.period}
                      onChange={(e) => setEditingPackage({ ...editingPackage, period: e.target.value })}
                      placeholder="e.g. 3-Part Research Package"
                      className="admin-input w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Editorial Description
                  </label>
                  <textarea
                    rows={3}
                    value={editingPackage.description}
                    onChange={(e) => setEditingPackage({ ...editingPackage, description: e.target.value })}
                    placeholder="Brief summary explaining who this tier is designed for..."
                    className="admin-input w-full"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CTA Button Text
                  </label>
                  <input
                    type="text"
                    value={editingPackage.cta}
                    onChange={(e) => setEditingPackage({ ...editingPackage, cta: e.target.value })}
                    placeholder="e.g. Choose Growth"
                    className="admin-input w-full"
                  />
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl admin-card-inner border border-slate-200 dark:border-slate-800">
                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(editingPackage.isPopular)}
                      onChange={(e) => setEditingPackage({ ...editingPackage, isPopular: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Highlight as "Most Popular" Tier
                    </span>
                  </label>

                  <label className="flex items-center space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingPackage.isActive !== false}
                      onChange={(e) => setEditingPackage({ ...editingPackage, isActive: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Active & Visible on Public Site
                    </span>
                  </label>
                </div>

                {/* Features / Deliverables Builder */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Deliverables & Feature Bullets ({editingPackage.features?.length || 0})
                    </label>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Add, reorder, or edit bullet points
                    </span>
                  </div>

                  {/* Feature add input */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      value={newFeatureInput}
                      onChange={(e) => setNewFeatureInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFeatureToEditingPackage();
                        }
                      }}
                      placeholder="Add deliverable (e.g., 2 Editorial revision rounds with direct desk review)..."
                      className="admin-input flex-1 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddFeatureToEditingPackage}
                      disabled={!newFeatureInput.trim()}
                      className="px-3 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 transition-colors shrink-0 cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  {/* Features list */}
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(editingPackage.features || []).map((feat, fIdx) => (
                      <div
                        key={fIdx}
                        className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                      >
                        <div className="flex flex-col space-y-0.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleMoveFeatureInEditingPackage(fIdx, -1)}
                            disabled={fIdx === 0}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveFeatureInEditingPackage(fIdx, 1)}
                            disabled={fIdx === (editingPackage.features.length - 1)}
                            className="text-slate-400 hover:text-slate-700 dark:hover:text-white disabled:opacity-20 cursor-pointer"
                          >
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        </div>
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => {
                            const updatedFeats = [...editingPackage.features];
                            updatedFeats[fIdx] = e.target.value;
                            setEditingPackage({ ...editingPackage, features: updatedFeats });
                          }}
                          className="flex-1 bg-transparent text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveFeatureFromEditingPackage(fIdx)}
                          className="p-1 text-slate-400 hover:text-red-500 transition-colors shrink-0 cursor-pointer"
                          title="Remove bullet point"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPackageModalOpen(false);
                      setEditingPackage(null);
                    }}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSettingsMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs cursor-pointer"
                  >
                    {updateSettingsMutation.isPending ? 'Saving...' : 'Apply & Save Tier'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
