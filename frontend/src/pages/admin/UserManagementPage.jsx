import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { normalizeMediaUrl } from '../../services/media.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useConfirm } from '../../context/ModalContext.jsx';
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldCheck,
  Ban,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  UserPlus,
  ChevronRight,
  MoreVertical,
  X,
  Loader2,
  Eye,
  Copy,
  Check,
  ExternalLink,
  FileText,
  MessageSquare,
  Bookmark,
  Calendar,
  Clock,
  Globe,
  Mail,
  ShieldAlert,
  History
} from 'lucide-react';

/**
 * Production-ready User Avatar component with resilient image error fallback,
 * lazy loading, and consistent visual styling.
 */
function UserAvatar({ src, name, size = 'md', className = '', rounded = 'rounded-full' }) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const initial = (name || 'U').trim().charAt(0).toUpperCase() || 'U';

  const sizeStyles = {
    sm: 'w-7 h-7 text-xs',
    md: 'w-9 h-9 text-xs',
    lg: 'w-14 h-14 text-xl'
  };

  const resolvedSize = sizeStyles[size] || sizeStyles.md;
  const normalizedUrl = src ? normalizeMediaUrl(src) : null;

  if (normalizedUrl && !imageFailed) {
    return (
      <div
        className={`${resolvedSize} ${rounded} overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 shadow-2xs ${className}`}
      >
        <img
          src={normalizedUrl}
          alt={name ? `${name}'s profile avatar` : 'User profile avatar'}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`${resolvedSize} ${rounded} ${
        size === 'lg'
          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md'
          : 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200'
      } flex items-center justify-center font-bold shrink-0 select-none ${className}`}
    >
      {initial}
    </div>
  );
}

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const { user: currentUser, hasPermission } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN') || false;
  const canCreateUser = isSuperAdmin || (hasPermission && hasPermission('user.create'));
  const canToggleRegistration = isSuperAdmin || (hasPermission && (hasPermission('setting.manage') || hasPermission('user.create')));

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Modals & Selected User
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // User Profile & Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailUserId, setSelectedDetailUserId] = useState(null);
  const [activeDetailTab, setActiveDetailTab] = useState('overview');
  const [copiedId, setCopiedId] = useState(false);

  // Fetch full user details dynamically
  const {
    data: detailData,
    isLoading: isLoadingDetail,
    error: detailError
  } = useQuery({
    queryKey: ['admin-user-detail', selectedDetailUserId],
    queryFn: () => adminApi.getUserDetails(selectedDetailUserId),
    enabled: !!selectedDetailUserId && detailModalOpen
  });

  const detailUser = detailData?.data?.user;
  const recentArticles = detailData?.data?.recentArticles || [];
  const recentComments = detailData?.data?.recentComments || [];
  const auditHistory = detailData?.data?.auditHistory || [];

  const handleOpenDetailModal = (userId) => {
    setSelectedDetailUserId(userId);
    setActiveDetailTab('overview');
    setDetailModalOpen(true);
  };

  const handleCopyId = (id) => {
    if (!id) return;
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Helper with auto-dismiss after 5 seconds
  const showFeedback = (msg) => {
    setFeedbackMsg(msg);
    if (msg) {
      setTimeout(() => {
        setFeedbackMsg((prev) => (prev === msg ? null : prev));
      }, 5000);
    }
  };

  // 1. Fetch Users
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', { search, role: roleFilter, status: statusFilter, page }],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, status: statusFilter, page, limit: 15 }),
    keepPreviousData: true
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { total: 0, totalPages: 1 };

  // 2. Fetch Registration Status
  const { data: regData, isLoading: regLoading } = useQuery({
    queryKey: ['admin-registration-status'],
    queryFn: () => adminApi.getRegistrationStatus(),
    enabled: !!canToggleRegistration
  });
  const allowRegistration = regData?.data?.allowRegistration ?? true;

  const toggleRegMutation = useMutation({
    mutationFn: (nextState) => adminApi.updateRegistrationStatus({ allowRegistration: nextState }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-registration-status']);
      showFeedback({
        type: 'success',
        text: `Public registration is now ${res.data?.allowRegistration ? 'Active (Open for public signup)' : 'Paused (Staff-only onboarding)'}`
      });
    },
    onError: (err) => {
      showFeedback({ type: 'error', text: err.message || 'Failed to update registration status' });
    }
  });

  // 3. Create User Modal State & Mutation
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    bio: '',
    roleNames: ['USER'],
    emailVerified: true
  });
  const [createFormError, setCreateFormError] = useState(null);

  const createUserMutation = useMutation({
    mutationFn: (payload) => adminApi.createUser(payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      setCreateModalOpen(false);
      setCreateForm({
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        bio: '',
        roleNames: ['USER'],
        emailVerified: true
      });
      setCreateFormError(null);
      showFeedback({
        type: 'success',
        text: `User account created for ${res.data?.fullName || res.data?.email} with [${res.data?.roles?.join(', ')}] role(s).`
      });
    },
    onError: (err) => {
      setCreateFormError(err.message || 'Failed to create user account');
    }
  });

  // 4. Fetch Roles Catalog for role modal & create modal
  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: () => adminApi.listRoles(),
    enabled: isSuperAdmin || canCreateUser
  });
  const availableRoles = rolesData?.data || [];

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => adminApi.updateUserStatus(id, { status, reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-user-detail']);
      setStatusModalOpen(false);
      setStatusReason('');
      showFeedback({ type: 'success', text: res.message || 'User status updated successfully' });
    },
    onError: (err) => {
      showFeedback({ type: 'error', text: err.message || 'Failed to update user status' });
    }
  });

  const bulkStatusMutation = useMutation({
    mutationFn: ({ userIds, status, reason }) =>
      adminApi.bulkUpdateUserStatus({ userIds, status, reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      setSelectedUserIds([]);
      showFeedback({
        type: 'success',
        text: res.message || `Successfully updated ${res.data?.updatedCount || 0} user account(s).`
      });
    },
    onError: (err) => {
      showFeedback({
        type: 'error',
        text: err.response?.data?.error?.message || err.message || 'Failed to update users in bulk'
      });
    }
  });

  const handleBulkActivate = async () => {
    if (selectedUserIds.length === 0) return;
    const ok = await confirm({
      title: `Activate ${selectedUserIds.length} User Account(s)`,
      message: `Are you sure you want to activate ${selectedUserIds.length} selected user account(s)? They will regain immediate access to sign in, comment, and publish.`,
      confirmText: 'Activate Users',
      cancelText: 'Cancel',
      variant: 'info'
    });
    if (ok) {
      bulkStatusMutation.mutate({ userIds: selectedUserIds, status: 'ACTIVE' });
    }
  };

  const handleBulkSuspend = async () => {
    if (selectedUserIds.length === 0) return;
    const ok = await confirm({
      title: `Suspend ${selectedUserIds.length} User Account(s)`,
      message: `Are you sure you want to suspend ${selectedUserIds.length} selected user account(s)? Suspended users cannot log in or participate in the community.`,
      confirmText: 'Suspend Accounts',
      cancelText: 'Cancel',
      variant: 'danger'
    });
    if (ok) {
      bulkStatusMutation.mutate({
        userIds: selectedUserIds,
        status: 'SUSPENDED',
        reason: 'Bulk administrative suspension'
      });
    }
  };

  const roleMutation = useMutation({
    mutationFn: ({ id, roleNames }) => adminApi.assignUserRoles(id, { roleNames }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      queryClient.invalidateQueries(['admin-user-detail']);
      setRoleModalOpen(false);
      showFeedback({ type: 'success', text: 'Roles updated successfully' });
    },
    onError: (err) => {
      showFeedback({ type: 'error', text: err.message || 'Failed to update user roles' });
    }
  });

  const handleOpenStatusModal = (u, newStatus) => {
    setSelectedUser(u);
    setTargetStatus(newStatus);
    setStatusReason('');
    setStatusModalOpen(true);
    setFeedbackMsg(null);
  };

  const handleOpenRoleModal = (u) => {
    setSelectedUser(u);
    setSelectedRoles(u.roles || []);
    setRoleModalOpen(true);
    setFeedbackMsg(null);
  };

  const toggleRoleSelection = (roleName) => {
    if (selectedRoles.includes(roleName)) {
      setSelectedRoles(selectedRoles.filter(r => r !== roleName));
    } else {
      setSelectedRoles([...selectedRoles, roleName]);
    }
  };

  return (
    <AdminLayout
      title="User Management"
      subtitle="Manage reader accounts, staff credentials, suspension states, and role allocations"
      actions={
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          {canToggleRegistration && (
            <div className="flex items-center justify-between sm:justify-start space-x-2.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl px-3 py-1.5 shadow-2xs">
              <div className="flex items-center space-x-1.5 text-xs font-medium">
                <span className={`w-2 h-2 rounded-full ${allowRegistration ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-slate-600 dark:text-slate-300">Public Signup:</span>
                <span className={allowRegistration ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-amber-600 dark:text-amber-400 font-semibold'}>
                  {allowRegistration ? 'Active' : 'Paused'}
                </span>
              </div>
              <button
                type="button"
                disabled={toggleRegMutation.isPending || regLoading}
                onClick={() => toggleRegMutation.mutate(!allowRegistration)}
                title={allowRegistration ? 'Pause public signups' : 'Enable public signups'}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden disabled:opacity-50 ${
                  allowRegistration ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
                    allowRegistration ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          )}

          {canCreateUser && (
            <button
              onClick={() => {
                setCreateModalOpen(true);
                setCreateFormError(null);
              }}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all shadow-xs cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Create User</span>
            </button>
          )}
        </div>
      }
    >
      <Helmet>
        <title>User Management — Research Factors Admin</title>
      </Helmet>

      {/* Alerts */}
      {feedbackMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
              : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800/60'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 opacity-70 hover:opacity-100 transition-opacity">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="admin-toolbar mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search users by name or email address..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="admin-input pl-10 pr-4 py-2 text-xs"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input px-3 py-2 text-xs"
          >
            <option value="">All Roles</option>
            <option value="SUPER_ADMIN">Super Admin</option>
            <option value="ADMIN">Admin</option>
            <option value="EDITOR">Editor</option>
            <option value="AUTHOR">Author</option>
            <option value="USER">User</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="admin-input px-3 py-2 text-xs"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedUserIds.length > 0 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xs animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {selectedUserIds.length}
            </span>
            <span>Account{selectedUserIds.length > 1 ? 's' : ''} Selected</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleBulkActivate}
              disabled={bulkStatusMutation.isPending}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Activate</span>
            </button>

            <button
              onClick={handleBulkSuspend}
              disabled={bulkStatusMutation.isPending}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Suspend</span>
            </button>

            <button
              onClick={() => setSelectedUserIds([])}
              className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="admin-table-container">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400">Loading user catalog...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-slate-400 dark:text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Users Found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/80">
                  <th className="py-3.5 px-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={users.length > 0 && selectedUserIds.length === users.length}
                      onChange={() => {
                        if (selectedUserIds.length === users.length) {
                          setSelectedUserIds([]);
                        } else {
                          setSelectedUserIds(users.map((u) => u.id));
                        }
                      }}
                      className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Select all on this page"
                    />
                  </th>
                  <th className="py-3.5 px-6">User / Account</th>
                  <th className="py-3.5 px-6">Roles</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Activity</th>
                  <th className="py-3.5 px-6">Joined</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-xs text-slate-700 dark:text-slate-300">
                {users.map((u) => {
                  const isUserSuperAdmin = u.roles.includes('SUPER_ADMIN');
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <tr
                      key={u.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors ${
                        isSelected ? 'bg-blue-50/70 dark:bg-blue-900/20' : ''
                      }`}
                    >
                      <td className="py-4 px-4 w-10 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedUserIds((prev) =>
                              prev.includes(u.id) ? prev.filter((id) => id !== u.id) : [...prev, u.id]
                            );
                          }}
                          className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                      <td className="py-4 px-6">
                        <div
                          onClick={() => handleOpenDetailModal(u.id)}
                          className="flex items-center space-x-3 cursor-pointer group/user"
                          title="Click to view full user profile & activity"
                        >
                          <UserAvatar
                            src={u.avatarUrl}
                            name={u.fullName || `${u.firstName} ${u.lastName}`}
                            size="md"
                            className="group-hover/user:border-blue-500 group-hover/user:text-blue-600 transition-colors"
                          />
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center space-x-1.5 group-hover/user:text-blue-600 dark:group-hover/user:text-blue-400 transition-colors">
                              <span>{u.fullName || `${u.firstName} ${u.lastName}`}</span>
                              {isUserSuperAdmin && (
                                <span title="Super Administrator">
                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 inline" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <div className="flex flex-wrap gap-1.5">
                          {u.roles.map((r, rIdx) => (
                            <span
                              key={rIdx}
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                r === 'SUPER_ADMIN'
                                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25'
                                  : r === 'ADMIN'
                                  ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25'
                                  : r === 'AUTHOR'
                                  ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                              }`}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-4 px-6">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                            u.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                              : u.status === 'SUSPENDED'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              u.status === 'ACTIVE' ? 'bg-emerald-500 dark:bg-emerald-400' : 'bg-red-500 dark:bg-red-400'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-[11px]">
                        <span>{u.counts?.articles || 0} articles</span> · <span>{u.counts?.comments || 0} comments</span>
                      </td>

                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleOpenDetailModal(u.id)}
                            className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            title="View User Profile & Activity"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Details</span>
                          </button>

                          {isSuperAdmin && (
                            <button
                              onClick={() => handleOpenRoleModal(u)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
                              title="Assign Roles"
                            >
                              Roles
                            </button>
                          )}

                          {u.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'SUSPENDED')}
                              disabled={isUserSuperAdmin && !isSuperAdmin}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors disabled:opacity-30"
                              title="Suspend User"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'ACTIVE')}
                              disabled={isUserSuperAdmin && !isSuperAdmin}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 transition-colors disabled:opacity-30"
                              title="Reactivate User"
                            >
                              Activate
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/40">
            <span>
              Showing {users.length} of {pagination.total} users
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Previous
              </button>
              <span className="font-semibold text-slate-900 dark:text-white">
                {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status Modal (Suspend / Activate) */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {targetStatus === 'SUSPENDED' ? 'Suspend Account' : 'Reactivate Account'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Target user: <strong className="text-slate-800 dark:text-slate-200">{selectedUser.email}</strong>
            </p>

            {targetStatus === 'SUSPENDED' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Reason for Suspension (Audit requirement)
                </label>
                <textarea
                  rows="3"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Terms violation, aggressive commenting, or security review"
                  className="admin-input"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  statusMutation.mutate({
                    id: selectedUser.id,
                    status: targetStatus,
                    reason: statusReason
                  })
                }
                disabled={statusMutation.isPending}
                className={`px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-xs transition-colors ${
                  targetStatus === 'SUSPENDED'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {statusMutation.isPending ? 'Processing...' : `Confirm ${targetStatus}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Assignment Modal (Super Admin Exclusive) */}
      {roleModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Role Allocation Matrix</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select roles to assign to <strong className="text-slate-800 dark:text-slate-200">{selectedUser.email}</strong>.
            </p>

            <div className="space-y-2 mb-6">
              {['SUPER_ADMIN', 'ADMIN', 'EDITOR', 'AUTHOR', 'USER'].map((r) => {
                const isSelected = selectedRoles.includes(r);
                return (
                  <div
                    key={r}
                    onClick={() => toggleRoleSelection(r)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-600/10 border-blue-300 dark:border-blue-500/40 text-blue-900 dark:text-white'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide block">{r}</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                        {r === 'SUPER_ADMIN'
                          ? 'Full system custodian with permission & config rights'
                          : r === 'ADMIN'
                          ? 'Staff administrator with moderation & user rights'
                          : r === 'AUTHOR'
                          ? 'Accredited writer capable of publishing research'
                          : r === 'EDITOR'
                          ? 'Manuscript reviewer and publishing manager'
                          : 'Standard community reader and commenter'}
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setRoleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  roleMutation.mutate({
                    id: selectedUser.id,
                    roleNames: selectedRoles
                  })
                }
                disabled={roleMutation.isPending || selectedRoles.length === 0}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 shadow-xs transition-colors"
              >
                {roleMutation.isPending ? 'Saving...' : 'Update Roles'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="admin-modal max-w-4xl w-full p-6 sm:p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Create User Account</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Directly provision reader, author, or staff credentials</p>
                </div>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createFormError && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-600 dark:text-red-300 flex items-center justify-between">
                <span>{createFormError}</span>
                <button onClick={() => setCreateFormError(null)} className="p-1 hover:opacity-75 cursor-pointer">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setCreateFormError(null);
                if (!createForm.firstName.trim() || !createForm.lastName.trim()) {
                  setCreateFormError('First and last name are required');
                  return;
                }
                if (!createForm.email.trim()) {
                  setCreateFormError('Valid email address is required');
                  return;
                }
                if (createForm.password.length < 8) {
                  setCreateFormError('Password must be at least 8 characters long');
                  return;
                }
                if (createForm.roleNames.length === 0) {
                  setCreateFormError('Please select at least one role for this account');
                  return;
                }
                createUserMutation.mutate(createForm);
              }}
              className="space-y-5"
            >
              {/* Responsive 2-Column Horizontal Layout on Desktop */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Column 1: Identity & Credentials */}
                <div className="space-y-3.5">
                  <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    <span>Identity & Credentials</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.firstName}
                        onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                        placeholder="Eleanor"
                        className="admin-input"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={createForm.lastName}
                        onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                        placeholder="Vance"
                        className="admin-input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={createForm.email}
                      onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                      placeholder="name@institution.edu"
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Initial Password *
                    </label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={createForm.password}
                      onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                      placeholder="Minimum 8 characters"
                      className="admin-input"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Brief Bio / Academic Focus (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={createForm.bio}
                      onChange={(e) => setCreateForm({ ...createForm, bio: e.target.value })}
                      placeholder="e.g. Theoretical physicist focusing on quantum optics..."
                      className="admin-input resize-none"
                    />
                  </div>
                </div>

                {/* Column 2: Role Allocation & Access Control */}
                <div className="space-y-3.5">
                  <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-slate-800/80">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    <span>Role Allocation & Privileges *</span>
                  </div>

                  <div className="space-y-1.5">
                    {['USER', 'AUTHOR', 'EDITOR', 'ADMIN', 'SUPER_ADMIN'].map((r) => {
                      const isRestricted = !isSuperAdmin && ['ADMIN', 'SUPER_ADMIN'].includes(r);
                      const isSelected = createForm.roleNames.includes(r);
                      return (
                        <div
                          key={r}
                          onClick={() => {
                            if (isRestricted) return;
                            const newRoles = isSelected
                              ? createForm.roleNames.filter((item) => item !== r)
                              : [...createForm.roleNames, r];
                            setCreateForm({ ...createForm, roleNames: newRoles });
                          }}
                          className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                            isRestricted
                              ? 'opacity-40 cursor-not-allowed bg-slate-100 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                              : isSelected
                              ? 'bg-blue-50 dark:bg-blue-600/15 border-blue-300 dark:border-blue-500/40 text-blue-900 dark:text-white cursor-pointer'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 cursor-pointer'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              disabled={isRestricted}
                              checked={isSelected}
                              onChange={() => {}}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="font-semibold text-xs">{r}</span>
                            {isRestricted && (
                              <span className="text-[10px] text-amber-500 dark:text-amber-400 ml-1">
                                (Super Admin Required)
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            {r === 'USER' && 'Community reader'}
                            {r === 'AUTHOR' && 'Accredited writer'}
                            {r === 'EDITOR' && 'Publishing manager'}
                            {r === 'ADMIN' && 'Staff administrator'}
                            {r === 'SUPER_ADMIN' && 'Principal system custodian'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {isSuperAdmin ? (
                    <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/60 dark:bg-slate-800/30">
                      <label className="flex items-start space-x-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={createForm.emailVerified}
                          onChange={(e) => setCreateForm({ ...createForm, emailVerified: e.target.checked })}
                          className="rounded text-blue-600 focus:ring-blue-500 mt-0.5"
                        />
                        <div className="text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-semibold block text-[11px]">Mark email as pre-verified</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400">
                            Instantly activates account without requiring email token confirmation.
                          </span>
                        </div>
                      </label>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl admin-card-inner text-[11px] text-slate-500 dark:text-slate-400">
                      Accounts created by non-super-admin staff will require the user to verify their email address before access is granted.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  {createUserMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating User...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* User Profile & Details Inspection Modal */}
      {detailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs">
          <div className="admin-modal max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex items-start justify-between gap-4">
              {isLoadingDetail ? (
                <div className="flex items-center space-x-3 py-2">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Loading user profile...</span>
                </div>
              ) : detailUser ? (
                <div className="flex items-start space-x-4 min-w-0">
                  <UserAvatar
                    src={detailUser.avatarUrl}
                    name={detailUser.fullName || `${detailUser.firstName} ${detailUser.lastName}`}
                    size="lg"
                    rounded="rounded-2xl"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                        {detailUser.fullName || `${detailUser.firstName} ${detailUser.lastName}`}
                      </h2>
                      {detailUser.roles?.includes('SUPER_ADMIN') && (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                          <ShieldCheck className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span>Super Admin</span>
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          detailUser.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                            : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            detailUser.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'
                          }`}
                        />
                        {detailUser.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400 mt-1.5">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-700 dark:text-slate-300 font-medium">{detailUser.email}</span>
                        {detailUser.isEmailVerified ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" title="Email Verified" />
                        ) : (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" title="Email Unverified" />
                        )}
                      </span>

                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <span>ID: {detailUser.id?.slice(0, 8)}...</span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(detailUser.id)}
                          className="p-0.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Copy Full UUID"
                        >
                          {copiedId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  User Profile
                </div>
              )}

              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            {detailUser && !isLoadingDetail && (
              <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-5 sm:px-6 bg-slate-50/40 dark:bg-slate-900/40 overflow-x-auto text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('overview')}
                  className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap ${
                    activeDetailTab === 'overview'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Overview & Profile
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('articles')}
                  className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                    activeDetailTab === 'articles'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Articles</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {detailUser.counts?.articles ?? recentArticles.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('comments')}
                  className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                    activeDetailTab === 'comments'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Comments</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {detailUser.counts?.comments ?? recentComments.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveDetailTab('audit')}
                  className={`py-3 px-3.5 border-b-2 transition-colors cursor-pointer whitespace-nowrap flex items-center space-x-1.5 ${
                    activeDetailTab === 'audit'
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <span>Audit History</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {auditHistory.length}
                  </span>
                </button>
              </div>
            )}

            {/* Modal Body / Tab Content */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
              {isLoadingDetail ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-3">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  <p className="text-xs text-slate-500 dark:text-slate-400">Loading comprehensive profile details...</p>
                </div>
              ) : detailError ? (
                <div className="py-16 text-center">
                  <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Failed to load user details</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{detailError?.message || 'Unable to retrieve user record'}</p>
                </div>
              ) : detailUser ? (
                <>
                  {/* TAB 1: OVERVIEW & PROFILE */}
                  {activeDetailTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Metric Stat Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
                            <FileText className="w-3.5 h-3.5 text-blue-500" />
                            <span>Articles</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                            {detailUser.counts?.articles ?? 0}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Comments</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                            {detailUser.counts?.comments ?? 0}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
                            <Bookmark className="w-3.5 h-3.5 text-amber-500" />
                            <span>Bookmarks</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                            {detailUser.counts?.bookmarks ?? 0}
                          </p>
                        </div>
                        <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                          <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 text-xs">
                            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                            <span>Reports Filed</span>
                          </div>
                          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                            {detailUser.counts?.reportsFiled ?? 0}
                          </p>
                        </div>
                      </div>

                      {/* Account Details Card */}
                      <div className="p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/40 space-y-4">
                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Account Profile & Credentials
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <span className="text-slate-500 dark:text-slate-400 block mb-1">Biography</span>
                            <p className="text-slate-800 dark:text-slate-200 italic bg-white dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                              {detailUser.bio || 'No personal biography provided.'}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div>
                              <span className="text-slate-500 dark:text-slate-400 block mb-1">Assigned Roles</span>
                              <div className="flex flex-wrap gap-1.5">
                                {detailUser.roles?.map((r, rIdx) => (
                                  <span
                                    key={rIdx}
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                      r === 'SUPER_ADMIN'
                                        ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25'
                                        : r === 'ADMIN'
                                        ? 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/25'
                                        : r === 'AUTHOR'
                                        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                                    }`}
                                  >
                                    {r}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block">Registration Date</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {detailUser.createdAt ? new Date(detailUser.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 dark:text-slate-400 block">Last Profile Update</span>
                                <span className="font-medium text-slate-800 dark:text-slate-200">
                                  {detailUser.updatedAt ? new Date(detailUser.updatedAt).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Author Accreditation Section (If Present) */}
                      {detailUser.authorProfile && (
                        <div className="p-4 sm:p-5 rounded-xl border border-amber-200 dark:border-amber-800/60 bg-amber-50/30 dark:bg-amber-950/20 space-y-3">
                          <div className="flex items-center justify-between">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Author Accreditation & Byline Portfolio</span>
                            </h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              detailUser.authorProfile.isApproved
                                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            }`}>
                              {detailUser.authorProfile.isApproved ? 'Accredited & Approved' : 'Accreditation Pending'}
                            </span>
                          </div>

                          {detailUser.authorProfile.headline && (
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">
                              {detailUser.authorProfile.headline}
                            </p>
                          )}

                          {detailUser.authorProfile.biography && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              {detailUser.authorProfile.biography}
                            </p>
                          )}

                          <div className="flex flex-wrap gap-3 pt-2 text-xs">
                            {detailUser.authorProfile.websiteUrl && (
                              <a
                                href={detailUser.authorProfile.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <Globe className="w-3.5 h-3.5" />
                                <span>Website</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {detailUser.authorProfile.twitterUrl && (
                              <a
                                href={detailUser.authorProfile.twitterUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <span>Twitter/X</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {detailUser.authorProfile.linkedinUrl && (
                              <a
                                href={detailUser.authorProfile.linkedinUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <span>LinkedIn</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                            {detailUser.authorProfile.githubUrl && (
                              <a
                                href={detailUser.authorProfile.githubUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                              >
                                <span>GitHub</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: ARTICLES */}
                  {activeDetailTab === 'articles' && (
                    <div className="space-y-4">
                      {recentArticles.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <FileText className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Articles Authored</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">This user has not drafted or published any research articles yet.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {recentArticles.map(art => (
                            <div
                              key={art.id}
                              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 flex items-center justify-between gap-3"
                            >
                              <div className="min-w-0">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {art.title}
                                </h4>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                  <span className={`px-2 py-0.2 rounded-full font-semibold text-[10px] ${
                                    art.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' :
                                    art.status === 'IN_REVIEW' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20' :
                                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                                  }`}>
                                    {art.status}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" /> {art.viewCount || 0} views
                                  </span>
                                  <span>{new Date(art.createdAt).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div className="flex items-center space-x-1.5 shrink-0">
                                <a
                                  href={`/rf/admin/editor/${art.id}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                                  title="Open in Article Editor"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 3: COMMENTS */}
                  {activeDetailTab === 'comments' && (
                    <div className="space-y-4">
                      {recentComments.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <MessageSquare className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Comments Posted</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">This user has not contributed to article discussions.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {recentComments.map(com => (
                            <div
                              key={com.id}
                              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/20 space-y-1.5"
                            >
                              <div className="flex items-center justify-between text-[11px]">
                                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-md">
                                  Article: {com.article?.title || 'Unknown Article'}
                                </span>
                                <span className={`px-2 py-0.2 rounded-full font-semibold text-[10px] ${
                                  com.status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                  com.status === 'PENDING' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                  'bg-red-500/10 text-red-600 dark:text-red-400'
                                }`}>
                                  {com.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                                "{com.content}"
                              </p>
                              <span className="text-[10px] text-slate-400 block">
                                {new Date(com.createdAt).toLocaleString()}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: AUDIT HISTORY */}
                  {activeDetailTab === 'audit' && (
                    <div className="space-y-4">
                      {auditHistory.length === 0 ? (
                        <div className="p-8 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                          <History className="w-8 h-8 text-slate-400 dark:text-slate-500 mx-auto mb-2" />
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No Audit Trail</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">No administrative operations have been logged for this account.</p>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {auditHistory.map((log, idx) => (
                            <div
                              key={log.id || idx}
                              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-850/20 text-xs space-y-1"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-wide">
                                  {log.action?.replace(/_/g, ' ') || 'ACTION'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {new Date(log.createdAt).toLocaleString()}
                                </span>
                              </div>
                              {log.reason && (
                                <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                                  <strong className="font-semibold text-slate-700 dark:text-slate-200">Reason:</strong> {log.reason}
                                </p>
                              )}
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 pt-0.5">
                                <span>Actor:</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">
                                  {log.actor ? `${log.actor.firstName || ''} ${log.actor.lastName || ''} (${log.actor.email})` : 'System Automated'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {isSuperAdmin && detailUser && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleOpenRoleModal(detailUser);
                    }}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Manage Roles
                  </button>
                )}

                {detailUser && (
                  detailUser.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      disabled={detailUser.roles?.includes('SUPER_ADMIN') && !isSuperAdmin}
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleOpenStatusModal(detailUser, 'SUSPENDED');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 border border-red-200 dark:border-red-500/20 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      Suspend Account
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={detailUser.roles?.includes('SUPER_ADMIN') && !isSuperAdmin}
                      onClick={() => {
                        setDetailModalOpen(false);
                        handleOpenStatusModal(detailUser, 'ACTIVE');
                      }}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 transition-colors disabled:opacity-30 cursor-pointer"
                    >
                      Reactivate Account
                    </button>
                  )
                )}
              </div>

              <button
                type="button"
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
