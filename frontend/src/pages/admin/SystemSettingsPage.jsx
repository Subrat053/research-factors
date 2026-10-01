import React, { useState, useEffect } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { recommendationsApi } from '../../services/recommendations.api.js';
import { useConfirm } from '../../context/ModalContext.jsx';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  Settings,
  Globe,
  Sliders,
  Mail,
  Activity,
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  Send,
  Loader2,
  X,
  Server,
  Sparkles
} from 'lucide-react';

export default function SystemSettingsPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  // Gracefully redirect legacy or bookmark URLs (?tab=sponsorship) to dedicated route
  if (tabParam === 'sponsorship') {
    return <Navigate to="/admin/sponsorship/packages" replace />;
  }

  const [activeTab, setActiveTab] = useState(
    ['general', 'seo', 'policies', 'email', 'recommendations', 'health'].includes(tabParam) ? tabParam : 'general'
  );

  useEffect(() => {
    if (tabParam && ['general', 'seo', 'policies', 'email', 'recommendations', 'health'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setSearchParams(tabId === 'general' ? {} : { tab: tabId });
  };

  // Settings Forms State
  const [generalForm, setGeneralForm] = useState({
    siteName: '',
    tagline: '',
    contactEmail: '',
    twitter: '',
    linkedin: '',
    github: ''
  });

  const [seoForm, setSeoForm] = useState({
    defaultTitle: 'Research Factors — Empirical Research & Peer-Reviewed Insights',
    defaultDescription: 'Discover empirical research, scholarly insights, and high-impact analysis across science, technology, economics, and medicine.',
    openGraphImage: typeof window !== 'undefined' ? `${window.location.origin}/images/og-default.png` : '/images/og-default.png'
  });

  const [policiesForm, setPoliciesForm] = useState({
    allowRegistration: true,
    requireEmailVerification: true,
    commentsEnabled: true,
    autoHideReportThreshold: 3
  });

  // Test Email State
  const [testEmailRecipient, setTestEmailRecipient] = useState('');
  const [testEmailResult, setTestEmailResult] = useState(null);

  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Fetch Settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const res = await adminApi.getSettings();
      return res.data;
    }
  });

  // 2. Fetch System Health
  const { data: healthData, isLoading: healthLoading, refetch: refetchHealth, error: healthError } = useQuery({
    queryKey: ['admin-system-health'],
    queryFn: async () => {
      const res = await adminApi.getSystemHealth();
      return res.data;
    },
    enabled: activeTab === 'health',
    refetchInterval: activeTab === 'health' ? 10000 : false // 10s auto-ping in health tab
  });

  // Populate form state when data loads
  useEffect(() => {
    if (settingsData?.settings) {
      const g = settingsData.settings.general || {};
      const s = settingsData.settings.seo || {};
      const p = settingsData.settings.policies || {};

      setGeneralForm({
        siteName: g.siteName || '',
        tagline: g.tagline || '',
        contactEmail: g.contactEmail || '',
        twitter: g.socialLinks?.twitter || '',
        linkedin: g.socialLinks?.linkedin || '',
        github: g.socialLinks?.github || ''
      });

      setSeoForm({
        defaultTitle: s.defaultTitle || 'Research Factors — Empirical Research & Peer-Reviewed Insights',
        defaultDescription: s.defaultDescription || 'Discover empirical research, scholarly insights, and high-impact analysis across science, technology, economics, and medicine.',
        openGraphImage: s.openGraphImage || (typeof window !== 'undefined' ? `${window.location.origin}/images/og-default.png` : '/images/og-default.png')
      });

      setPoliciesForm({
        allowRegistration: p.allowRegistration !== undefined ? p.allowRegistration : true,
        requireEmailVerification: p.requireEmailVerification !== undefined ? p.requireEmailVerification : true,
        commentsEnabled: p.commentsEnabled !== undefined ? p.commentsEnabled : true,
        autoHideReportThreshold: p.autoHideReportThreshold || 3
      });
    }
  }, [settingsData]);

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: (data) => adminApi.updateSettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-settings']);
      queryClient.invalidateQueries(['public-settings']);
      queryClient.invalidateQueries(['sponsorship-packages']);
      setAlertMsg({ type: 'success', text: 'System configuration updated successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update system settings' });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: (recipientEmail) => adminApi.testEmail({ recipientEmail }),
    onSuccess: (res) => {
      setTestEmailResult({ success: true, message: res.message || 'Test message dispatched successfully!' });
    },
    onError: (err) => {
      setTestEmailResult({ success: false, message: err.message || 'Failed to send test email' });
    }
  });

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      general: {
        siteName: generalForm.siteName,
        tagline: generalForm.tagline,
        contactEmail: generalForm.contactEmail,
        socialLinks: {
          twitter: generalForm.twitter,
          linkedin: generalForm.linkedin,
          github: generalForm.github
        }
      }
    });
  };

  const handleSaveSeo = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      seo: seoForm
    });
  };

  const handleSavePolicies = (e) => {
    e.preventDefault();
    updateSettingsMutation.mutate({
      policies: policiesForm
    });
  };

  const handleSendTestEmail = (e) => {
    e.preventDefault();
    if (!testEmailRecipient) return;
    setTestEmailResult(null);
    testEmailMutation.mutate(testEmailRecipient);
  };

  // Recommendations & AI Settings
  const [recommendationsForm, setRecommendationsForm] = useState({
    popupEnabled: true,
    dwellTimeSeconds: 30,
    scrollThresholdPercent: 50,
    cooldownDays: 7,
    weights: {
      interest: 0.35,
      category: 0.25,
      tag: 0.15,
      complementarity: 0.15,
      recency: 0.10
    }
  });

  const { data: recConfigData, isLoading: recConfigLoading } = useQuery({
    queryKey: ['admin-recommendation-config'],
    queryFn: () => recommendationsApi.getConfig(),
    enabled: activeTab === 'recommendations'
  });

  useEffect(() => {
    if (recConfigData?.data) {
      setRecommendationsForm(recConfigData.data);
    }
  }, [recConfigData]);

  const updateRecConfigMutation = useMutation({
    mutationFn: (cfg) => recommendationsApi.updateConfig(cfg),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-recommendation-config']);
      setAlertMsg({ type: 'success', text: 'Recommendation & Personalization settings updated.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update recommendation settings' });
    }
  });

  const handleSaveRecommendations = (e) => {
    e.preventDefault();
    updateRecConfigMutation.mutate(recommendationsForm);
  };

  return (
    <AdminLayout
      title="Platform Settings & Diagnostics"
      subtitle="Exclusive Super Admin control over site metadata, SEO defaults, community policies, and server health"
    >
      <Helmet>
        <title>System Settings — Research Factors Admin</title>
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

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-4 mb-8">
        {[
          { id: 'general', label: 'General Info', icon: Globe },
          { id: 'seo', label: 'Default SEO', icon: HardDrive },
          { id: 'policies', label: 'Policies & Safety', icon: Sliders },
          { id: 'email', label: 'Email SMTP Test', icon: Mail },
          { id: 'recommendations', label: 'Personalization & AI', icon: Sparkles },
          { id: 'health', label: 'System Diagnostics', icon: Activity }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-slate-900/60 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {settingsLoading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-3 admin-card">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-500 dark:text-slate-400">Loading system settings...</p>
        </div>
      ) : (
        <div className="max-w-6xl">
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveGeneral} className="admin-card p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Publication Identity & Social Coordinates
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Site Name</label>
                <input
                  type="text"
                  value={generalForm.siteName}
                  onChange={(e) => setGeneralForm({ ...generalForm, siteName: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Tagline / Motto</label>
                <input
                  type="text"
                  value={generalForm.tagline}
                  onChange={(e) => setGeneralForm({ ...generalForm, tagline: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Official Inquiries Contact Email</label>
                <input
                  type="email"
                  value={generalForm.contactEmail}
                  onChange={(e) => setGeneralForm({ ...generalForm, contactEmail: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">Social Footprint URLs</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">Twitter / X</label>
                    <input
                      type="url"
                      value={generalForm.twitter}
                      onChange={(e) => setGeneralForm({ ...generalForm, twitter: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">LinkedIn</label>
                    <input
                      type="url"
                      value={generalForm.linkedin}
                      onChange={(e) => setGeneralForm({ ...generalForm, linkedin: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">GitHub</label>
                    <input
                      type="url"
                      value={generalForm.github}
                      onChange={(e) => setGeneralForm({ ...generalForm, github: e.target.value })}
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save General Settings'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: DEFAULT SEO */}
          {activeTab === 'seo' && (
            <form onSubmit={handleSaveSeo} className="admin-card p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Global Metadata & Social Card Defaults
              </h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Default Page Title Template</label>
                <input
                  type="text"
                  value={seoForm.defaultTitle}
                  onChange={(e) => setSeoForm({ ...seoForm, defaultTitle: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Default Meta Description</label>
                <textarea
                  rows="3"
                  value={seoForm.defaultDescription}
                  onChange={(e) => setSeoForm({ ...seoForm, defaultDescription: e.target.value })}
                  className="admin-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Default OpenGraph Image URL</label>
                <input
                  type="url"
                  value={seoForm.openGraphImage}
                  onChange={(e) => setSeoForm({ ...seoForm, openGraphImage: e.target.value })}
                  className="admin-input"
                />
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save SEO Defaults'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: POLICIES & SAFETY */}
          {activeTab === 'policies' && (
            <form onSubmit={handleSavePolicies} className="admin-card p-6 shadow-xs space-y-6">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
                Community Access & Moderation Gates
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl admin-card-inner">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Allow Reader Registration</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      When disabled, new visitor account registrations are blocked.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policiesForm.allowRegistration}
                    onChange={(e) =>
                      setPoliciesForm({ ...policiesForm, allowRegistration: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl admin-card-inner">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Mandatory Email Verification</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Enforce that readers verify their email before posting comments.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policiesForm.requireEmailVerification}
                    onChange={(e) =>
                      setPoliciesForm({ ...policiesForm, requireEmailVerification: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl admin-card-inner">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Platform Comments Enabled</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      Global switch to enable or pause article commentary platform-wide.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={policiesForm.commentsEnabled}
                    onChange={(e) =>
                      setPoliciesForm({ ...policiesForm, commentsEnabled: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="p-4 rounded-xl admin-card-inner">
                  <label className="text-xs font-bold text-slate-900 dark:text-white block mb-1">
                    Auto-Hide Report Threshold
                  </label>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-3">
                    Comments receiving this number of independent reader reports are automatically hidden pending editorial review.
                  </span>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={policiesForm.autoHideReportThreshold}
                    onChange={(e) =>
                      setPoliciesForm({
                        ...policiesForm,
                        autoHideReportThreshold: parseInt(e.target.value, 10) || 3
                      })
                    }
                    className="w-24 admin-input"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updateSettingsMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {updateSettingsMutation.isPending ? 'Saving...' : 'Save Policy Settings'}
                </button>
              </div>
            </form>
             )}

          {/* TAB 4: EMAIL SMTP TEST */}
          {activeTab === 'email' && (
            <div className="admin-card p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  Outbound SMTP Delivery Diagnostics
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Verify outbound transactional email dispatch via configured mail server credentials.
                </p>
              </div>

              <form onSubmit={handleSendTestEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Test Recipient Email Address
                  </label>
                  <div className="flex gap-3">
                    <input
                      type="email"
                      placeholder="admin@example.com"
                      value={testEmailRecipient}
                      onChange={(e) => setTestEmailRecipient(e.target.value)}
                      className="flex-1 admin-input"
                      required
                    />
                    <button
                      type="submit"
                      disabled={testEmailMutation.isPending}
                      className="inline-flex items-center space-x-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-xs"
                    >
                      {testEmailMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>{testEmailMutation.isPending ? 'Dispatching...' : 'Send Test Mail'}</span>
                    </button>
                  </div>
                </div>
              </form>

              {testEmailResult && (
                <div
                  className={`p-4 rounded-xl border text-xs font-medium ${
                    testEmailResult.success
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                      : 'bg-red-500/10 text-red-700 dark:text-red-300 border-red-500/30'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {testEmailResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400" />
                    )}
                    <span className="font-bold">
                      {testEmailResult.success ? 'Delivery Confirmed' : 'Delivery Failed'}
                    </span>
                  </div>
                  <p className="text-[11px] opacity-90">{testEmailResult.message}</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: PERSONALIZATION & AI RECOMMENDATIONS */}
          {activeTab === 'recommendations' && (
            <form onSubmit={handleSaveRecommendations} className="admin-card p-6 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-1">
                  Personalization & Discovery Governance
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Configure behavior for the reader interest explorer, dwell/scroll triggers, and probabilistic journey algorithms.
                </p>
              </div>

              {/* Behavior & Triggers */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                  Reader Engagement Triggers
                </h4>

                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="popupEnabled"
                    checked={recommendationsForm.popupEnabled}
                    onChange={(e) => setRecommendationsForm({ ...recommendationsForm, popupEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-700 cursor-pointer"
                  />
                  <label htmlFor="popupEnabled" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                    Enable Context-Aware Interest Discovery Popup
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Dwell Time Trigger (Seconds)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="180"
                      value={recommendationsForm.dwellTimeSeconds}
                      onChange={(e) => setRecommendationsForm({ ...recommendationsForm, dwellTimeSeconds: parseInt(e.target.value, 10) || 30 })}
                      className="admin-input"
                      required
                    />
                    <span className="text-[11px] text-slate-500">Wait duration before non-intrusive drawer prompts.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Scroll Threshold (%)
                    </label>
                    <input
                      type="number"
                      min="10"
                      max="90"
                      value={recommendationsForm.scrollThresholdPercent}
                      onChange={(e) => setRecommendationsForm({ ...recommendationsForm, scrollThresholdPercent: parseInt(e.target.value, 10) || 50 })}
                      className="admin-input"
                      required
                    />
                    <span className="text-[11px] text-slate-500">Page scroll percentage required to trigger.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Dismissal Cooldown (Days)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="60"
                      value={recommendationsForm.cooldownDays}
                      onChange={(e) => setRecommendationsForm({ ...recommendationsForm, cooldownDays: parseInt(e.target.value, 10) || 7 })}
                      className="admin-input"
                      required
                    />
                    <span className="text-[11px] text-slate-500">Days to wait before re-prompting dismissed readers.</span>
                  </div>
                </div>
              </div>

              {/* Algorithm Scoring Weights */}
              <div className="space-y-4 pt-4">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800 pb-2">
                  Scoring Weights (Normalized Pipeline)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      User Interest Affinity ({Math.round((recommendationsForm.weights?.interest || 0.35) * 100)}%)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={recommendationsForm.weights?.interest || 0.35}
                      onChange={(e) =>
                        setRecommendationsForm({
                          ...recommendationsForm,
                          weights: { ...recommendationsForm.weights, interest: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Category Proximity ({Math.round((recommendationsForm.weights?.category || 0.25) * 100)}%)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={recommendationsForm.weights?.category || 0.25}
                      onChange={(e) =>
                        setRecommendationsForm({
                          ...recommendationsForm,
                          weights: { ...recommendationsForm.weights, category: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Tag Overlap ({Math.round((recommendationsForm.weights?.tag || 0.15) * 100)}%)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={recommendationsForm.weights?.tag || 0.15}
                      onChange={(e) =>
                        setRecommendationsForm({
                          ...recommendationsForm,
                          weights: { ...recommendationsForm.weights, tag: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Format Complementarity ({Math.round((recommendationsForm.weights?.complementarity || 0.15) * 100)}%)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={recommendationsForm.weights?.complementarity || 0.15}
                      onChange={(e) =>
                        setRecommendationsForm({
                          ...recommendationsForm,
                          weights: { ...recommendationsForm.weights, complementarity: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Recency Half-Life ({Math.round((recommendationsForm.weights?.recency || 0.10) * 100)}%)
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0"
                      max="1"
                      value={recommendationsForm.weights?.recency || 0.10}
                      onChange={(e) =>
                        setRecommendationsForm({
                          ...recommendationsForm,
                          weights: { ...recommendationsForm.weights, recency: parseFloat(e.target.value) || 0 }
                        })
                      }
                      className="admin-input"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={updateRecConfigMutation.isPending}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                >
                  {updateRecConfigMutation.isPending ? 'Saving...' : 'Save Personalization Settings'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 6: SYSTEM & STORAGE HEALTH */}
          {activeTab === 'health' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Live Infrastructure Telemetry
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Real-time status of PostgreSQL database, active storage adapter, and server runtime.
                  </p>
                </div>
                <button
                  onClick={() => refetchHealth()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white transition-colors"
                >
                  Refresh Probes
                </button>
              </div>

              {healthLoading ? (
                <div className="p-16 flex flex-col items-center justify-center space-y-3 admin-card">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pinging infrastructure...</p>
                </div>
              ) : healthError ? (
                <div className="admin-card p-6 border-red-500/30 bg-red-500/5 space-y-3">
                  <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <h4 className="text-xs font-bold uppercase tracking-wider">Failed to Retrieve Infrastructure Diagnostics</h4>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    {healthError?.message || 'Unable to connect to diagnostic probes or insufficient permissions.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => refetchHealth()}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 transition-colors shadow-xs"
                  >
                    <span>Retry Diagnostics</span>
                  </button>
                </div>
              ) : healthData ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Database Health Card */}
                  <div className="admin-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Database className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Database</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {healthData?.database?.status || 'Unknown'}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Engine:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{healthData?.database?.provider || 'PostgreSQL'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Latency:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">{healthData?.database?.latencyMs ?? 0} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Active Articles:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{healthData?.counts?.articles ?? 0}</span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Provider Health Card */}
                  <div className="admin-card p-5">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <HardDrive className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">File Storage</span>
                      </div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {healthData?.storage?.provider || 'local'}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Storage Provider:</span>
                        <span className="font-semibold text-slate-900 dark:text-white uppercase">{healthData?.storage?.provider || 'local'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Media Records Tracked:</span>
                        <span className="font-semibold text-slate-900 dark:text-white">{healthData?.storage?.totalAssetsTracked ?? 0} assets</span>
                      </div>
                    </div>
                  </div>

                  {/* System & Runtime Health Card */}
                  <div className="admin-card p-5 sm:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Server className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide">Node Runtime & Memory</span>
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        Node {healthData?.system?.nodeVersion || 'N/A'}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-xs pt-2">
                      <div className="p-3 admin-card-inner rounded-xl">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Heap Used</span>
                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                          {healthData?.system?.memory?.heapUsedMb ?? 0} MB
                        </span>
                      </div>
                      <div className="p-3 admin-card-inner rounded-xl">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Total Heap</span>
                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                          {healthData?.system?.memory?.heapTotalMb ?? 0} MB
                        </span>
                      </div>
                      <div className="p-3 admin-card-inner rounded-xl">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 block">System Uptime</span>
                        <span className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-1 block">
                          {Math.floor((healthData?.system?.uptimeSeconds || 0) / 60)} min
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </AdminLayout>
  );
}
