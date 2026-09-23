import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  UserCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Globe,
  Twitter,
  Linkedin,
  Github,
  Search,
  Eye,
  FileText,
  Clock,
  X,
  Loader2,
  Edit3
} from 'lucide-react';

export default function AuthorManagementPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'authors'
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  // Rejection Feedback Modal
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Edit Author Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [profileForm, setProfileForm] = useState({
    headline: '',
    biography: '',
    websiteUrl: '',
    twitterUrl: '',
    linkedinUrl: '',
    githubUrl: ''
  });

  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Pending Applications
  const { data: appsData, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-author-applications', page],
    queryFn: () => adminApi.listAuthorApplications({ page, limit: 15 }),
    enabled: activeTab === 'applications'
  });
  const applications = appsData?.data?.applications || [];

  // 2. Approved Authors Directory
  const { data: authorsData, isLoading: authorsLoading } = useQuery({
    queryKey: ['admin-authors-list', { search, page }],
    queryFn: () => adminApi.listAuthors({ search, page, limit: 15 }),
    enabled: activeTab === 'authors'
  });
  const authors = authorsData?.data?.authors || [];
  const pagination = (activeTab === 'applications' ? appsData?.data?.pagination : authorsData?.data?.pagination) || { total: 0, totalPages: 1 };

  // Mutations
  const approveMutation = useMutation({
    mutationFn: (id) => adminApi.approveAuthorApplication(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-author-applications']);
      queryClient.invalidateQueries(['admin-authors-list']);
      setAlertMsg({ type: 'success', text: 'Author application successfully approved!' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to approve author' });
    }
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => adminApi.rejectAuthorApplication(id, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-author-applications']);
      setRejectModalOpen(false);
      setRejectionReason('');
      setAlertMsg({ type: 'success', text: 'Author application returned with feedback.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to reject application' });
    }
  });

  const updateProfileMutation = useMutation({
    mutationFn: ({ id, data }) => adminApi.updateAuthorProfile(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-authors-list']);
      setEditModalOpen(false);
      setAlertMsg({ type: 'success', text: 'Author profile updated successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update author profile' });
    }
  });

  const handleOpenRejectModal = (app) => {
    setSelectedApplication(app);
    setRejectionReason('');
    setRejectModalOpen(true);
  };

  const handleOpenEditModal = (author) => {
    setEditingAuthor(author);
    setProfileForm({
      headline: author.headline || '',
      biography: author.biography || '',
      websiteUrl: author.websiteUrl || '',
      twitterUrl: author.twitterUrl || '',
      linkedinUrl: author.linkedinUrl || '',
      githubUrl: author.githubUrl || ''
    });
    setEditModalOpen(true);
  };

  return (
    <AdminLayout
      title="Author Accreditation & Lifecycle"
      subtitle="Review manuscript contributor applications, oversee verified authors, and inspect publication metrics"
    >
      <Helmet>
        <title>Author Management — Research Factors Admin</title>
      </Helmet>

      {/* Status Alerts */}
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

      {/* Tabs */}
      <div className="flex items-center space-x-4 border-b border-slate-200 dark:border-slate-800 mb-6">
        <button
          onClick={() => {
            setActiveTab('applications');
            setPage(1);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'applications'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Accreditation Queue</span>
          {applications.length > 0 && (
            <span className="ml-2 px-1.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-300 text-[10px]">
              {applications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('authors');
            setPage(1);
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider transition-colors relative ${
            activeTab === 'authors'
              ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-500'
              : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <span>Verified Authors Directory</span>
        </button>
      </div>

      {/* TAB 1: PENDING ACCREDITATION QUEUE */}
      {activeTab === 'applications' && (
        <div>
          {appsLoading ? (
            <div className="p-16 flex flex-col items-center justify-center space-y-3 admin-card">
              <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              <p className="text-xs text-slate-500 dark:text-slate-400">Loading accreditation queue...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-16 text-center admin-card">
              <UserCheck className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">All Applications Cleared</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                There are no pending author applications awaiting review.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="admin-card p-6 flex flex-col justify-between shadow-xs transition-colors"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                          {app.name?.[0] || 'A'}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{app.name}</h4>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">{app.email}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25">
                        Pending
                      </span>
                    </div>

                    {app.headline && (
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2 italic">"{app.headline}"</p>
                    )}

                    {app.biography && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 line-clamp-3 leading-relaxed">
                        {app.biography}
                      </p>
                    )}

                    {/* Portfolio Links */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {app.websiteUrl && (
                        <a
                          href={app.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Globe className="w-3 h-3 text-slate-400" />
                          <span>Website</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                        </a>
                      )}
                      {app.twitterUrl && (
                        <a
                          href={app.twitterUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Twitter className="w-3 h-3 text-sky-500" />
                          <span>Twitter</span>
                        </a>
                      )}
                      {app.linkedinUrl && (
                        <a
                          href={app.linkedinUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Linkedin className="w-3 h-3 text-blue-500" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {app.githubUrl && (
                        <a
                          href={app.githubUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-[11px] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors"
                        >
                          <Github className="w-3 h-3 text-slate-500" />
                          <span>GitHub</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800/80">
                    <button
                      onClick={() => handleOpenRejectModal(app)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors"
                    >
                      Return with Feedback
                    </button>
                    <button
                      onClick={() => approveMutation.mutate(app.id)}
                      disabled={approveMutation.isPending}
                      className="px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
                    >
                      Approve Author
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFIED AUTHORS DIRECTORY */}
      {activeTab === 'authors' && (
        <div>
          <div className="admin-toolbar mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search verified authors by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="admin-input pl-10 pr-4 py-2 text-xs"
              />
            </div>
          </div>

          <div className="admin-table-container">
            {authorsLoading ? (
              <div className="p-16 flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <p className="text-xs text-slate-500 dark:text-slate-400">Loading authors directory...</p>
              </div>
            ) : authors.length === 0 ? (
              <div className="p-16 text-center">
                <UserCheck className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Authors Found</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">No verified authors matched your search criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80">
                      <th className="py-3.5 px-6">Author</th>
                      <th className="py-3.5 px-6">Headline</th>
                      <th className="py-3.5 px-6">Publications</th>
                      <th className="py-3.5 px-6">Total Reads</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                    {authors.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold text-slate-700 dark:text-slate-200">
                              {a.name?.[0] || 'A'}
                            </div>
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-white">{a.name}</div>
                              <span className="text-[11px] text-slate-500 dark:text-slate-400">{a.email}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">
                          {a.headline || '—'}
                        </td>

                        <td className="py-4 px-6 font-semibold text-slate-900 dark:text-white">
                          <span className="inline-flex items-center space-x-1">
                            <FileText className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                            <span>{a.articlesCount}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          <span className="inline-flex items-center space-x-1">
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            <span>{a.totalViews.toLocaleString()}</span>
                          </span>
                        </td>

                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleOpenEditModal(a)}
                            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Profile</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Reject Application Modal */}
      {rejectModalOpen && selectedApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">Return Author Application</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Providing constructive feedback helps <strong className="text-slate-800 dark:text-slate-200">{selectedApplication.name}</strong> improve their submission.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Editorial Feedback Reason
              </label>
              <textarea
                rows="4"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Please provide published research writing samples or verify academic/industry credentials..."
                className="admin-input"
              />
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  rejectMutation.mutate({
                    id: selectedApplication.id,
                    reason: rejectionReason
                  })
                }
                disabled={rejectMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-red-600 hover:bg-red-700 shadow-xs transition-colors"
              >
                {rejectMutation.isPending ? 'Submitting...' : 'Return Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Author Profile Modal */}
      {editModalOpen && editingAuthor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Edit Author Profile — {editingAuthor.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Update public author credentials, editorial headline, or portfolio links.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Headline</label>
                <input
                  type="text"
                  value={profileForm.headline}
                  onChange={(e) => setProfileForm({ ...profileForm, headline: e.target.value })}
                  placeholder="e.g. Quantum Computing Architecture Analyst"
                  className="admin-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Biography</label>
                <textarea
                  rows="3"
                  value={profileForm.biography}
                  onChange={(e) => setProfileForm({ ...profileForm, biography: e.target.value })}
                  placeholder="Editorial biography..."
                  className="admin-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Website URL</label>
                  <input
                    type="url"
                    value={profileForm.websiteUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, websiteUrl: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Twitter / X URL</label>
                  <input
                    type="url"
                    value={profileForm.twitterUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, twitterUrl: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={profileForm.linkedinUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, linkedinUrl: e.target.value })}
                    className="admin-input"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">GitHub URL</label>
                  <input
                    type="url"
                    value={profileForm.githubUrl}
                    onChange={(e) => setProfileForm({ ...profileForm, githubUrl: e.target.value })}
                    className="admin-input"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateProfileMutation.mutate({
                    id: editingAuthor.id,
                    data: profileForm
                  })
                }
                disabled={updateProfileMutation.isPending}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors"
              >
                {updateProfileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
