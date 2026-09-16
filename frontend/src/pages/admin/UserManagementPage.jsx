import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
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
  ChevronRight,
  MoreVertical,
  X,
  Loader2
} from 'lucide-react';

export default function UserManagementPage() {
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuth();
  const isSuperAdmin = currentUser?.roles?.includes('SUPER_ADMIN') || false;

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // Modals & Selected User
  const [selectedUser, setSelectedUser] = useState(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [targetStatus, setTargetStatus] = useState('SUSPENDED');
  const [statusReason, setStatusReason] = useState('');

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  // 1. Fetch Users
  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', { search, role: roleFilter, status: statusFilter, page }],
    queryFn: () => adminApi.getUsers({ search, role: roleFilter, status: statusFilter, page, limit: 15 }),
    keepPreviousData: true
  });

  const users = data?.data?.users || [];
  const pagination = data?.data?.pagination || { total: 0, totalPages: 1 };

  // 2. Fetch Roles Catalog for role modal
  const { data: rolesData } = useQuery({
    queryKey: ['admin-roles-list'],
    queryFn: () => adminApi.listRoles(),
    enabled: isSuperAdmin
  });
  const availableRoles = rolesData?.data || [];

  // Mutations
  const statusMutation = useMutation({
    mutationFn: ({ id, status, reason }) => adminApi.updateUserStatus(id, { status, reason }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      setStatusModalOpen(false);
      setStatusReason('');
      setFeedbackMsg({ type: 'success', text: res.message || 'User status updated successfully' });
    },
    onError: (err) => {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update user status' });
    }
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, roleNames }) => adminApi.assignUserRoles(id, { roleNames }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-users']);
      setRoleModalOpen(false);
      setFeedbackMsg({ type: 'success', text: 'Roles updated successfully' });
    },
    onError: (err) => {
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update user roles' });
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
      title="User Directory & Governance"
      subtitle="Manage reader accounts, staff credentials, suspension states, and role allocations"
    >
      <Helmet>
        <title>User Management — Research Factors Admin</title>
      </Helmet>

      {/* Alerts */}
      {feedbackMsg && (
        <div
          className={`mb-6 p-4 rounded-xl flex items-center justify-between text-xs font-medium border ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-red-500/10 text-red-300 border-red-500/30'
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
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
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-white placeholder-slate-400 focus:outline-hidden focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
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
            className="px-3 py-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-xs text-slate-200 focus:outline-hidden focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DEACTIVATED">Deactivated</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
            <p className="text-xs text-slate-400">Loading user catalog...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 text-center">
            <Users className="w-10 h-10 text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Users Found</h3>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search criteria or role filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400 bg-slate-900/80">
                  <th className="py-3.5 px-6">User / Account</th>
                  <th className="py-3.5 px-6">Roles</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Activity</th>
                  <th className="py-3.5 px-6">Joined</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs text-slate-300">
                {users.map((u) => {
                  const isUserSuperAdmin = u.roles.includes('SUPER_ADMIN');
                  return (
                    <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                            {u.firstName?.[0] || 'U'}
                          </div>
                          <div>
                            <div className="font-semibold text-white flex items-center space-x-1.5">
                              <span>{u.fullName || `${u.firstName} ${u.lastName}`}</span>
                              {isUserSuperAdmin && (
                                <span title="Super Administrator">
                                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400 inline" />
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
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
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : r === 'ADMIN'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : r === 'AUTHOR'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
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
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : u.status === 'SUSPENDED'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                              : 'bg-slate-800 text-slate-400 border border-slate-700'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              u.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'
                            }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="py-4 px-6 text-slate-400 text-[11px]">
                        <span>{u.counts?.articles || 0} articles</span> · <span>{u.counts?.comments || 0} comments</span>
                      </td>

                      <td className="py-4 px-6 text-slate-400 text-[11px]">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleOpenRoleModal(u)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                              title="Assign Roles"
                            >
                              Roles
                            </button>
                          )}

                          {u.status === 'ACTIVE' ? (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'SUSPENDED')}
                              disabled={isUserSuperAdmin && !isSuperAdmin}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors disabled:opacity-30"
                              title="Suspend User"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenStatusModal(u, 'ACTIVE')}
                              disabled={isUserSuperAdmin && !isSuperAdmin}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 border border-emerald-500/20 transition-colors disabled:opacity-30"
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
          <div className="px-6 py-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/40">
            <span>
              Showing {users.length} of {pagination.total} users
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 disabled:opacity-30"
              >
                Previous
              </button>
              <span className="font-semibold text-white">
                {page} / {pagination.totalPages}
              </span>
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

      {/* Status Modal (Suspend / Activate) */}
      {statusModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-serif font-bold text-white mb-2">
              {targetStatus === 'SUSPENDED' ? 'Suspend Account' : 'Reactivate Account'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Target user: <strong className="text-slate-200">{selectedUser.email}</strong>
            </p>

            {targetStatus === 'SUSPENDED' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Reason for Suspension (Audit requirement)
                </label>
                <textarea
                  rows="3"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="e.g. Terms violation, aggressive commenting, or security review"
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-red-500"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
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
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-serif font-bold text-white mb-1">Role Allocation Matrix</h3>
            <p className="text-xs text-slate-400 mb-4">
              Select roles to assign to <strong className="text-slate-200">{selectedUser.email}</strong>.
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
                        ? 'bg-blue-600/10 border-blue-500/40 text-white'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wide block">{r}</span>
                      <span className="text-[10px] text-slate-400">
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
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
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
    </AdminLayout>
  );
}
