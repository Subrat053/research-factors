import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Helmet } from 'react-helmet-async';
import { adminApi } from '../../services/admin.api.js';
import { AdminLayout } from '../../components/admin/AdminLayout.jsx';
import {
  KeyRound,
  Shield,
  ShieldCheck,
  Plus,
  Trash2,
  Edit2,
  Check,
  AlertCircle,
  X,
  Loader2,
  Lock
} from 'lucide-react';

export default function RolesPermissionsPage() {
  const queryClient = useQueryClient();
  const [activeRoleId, setActiveRoleId] = useState(null);
  const [rolePermissionsState, setRolePermissionsState] = useState({});
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newRoleForm, setNewRoleForm] = useState({ name: '', description: '' });
  const [alertMsg, setAlertMsg] = useState(null);

  // 1. Fetch Roles
  const { data: rolesData, isLoading: rolesLoading } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const res = await adminApi.listRoles();
      return res.data;
    }
  });

  // 2. Fetch Permissions
  const { data: permsData, isLoading: permsLoading } = useQuery({
    queryKey: ['admin-permissions'],
    queryFn: async () => {
      const res = await adminApi.listPermissions();
      return res.data;
    }
  });

  const roles = rolesData || [];
  const permissionsGrouped = permsData?.grouped || {};

  // Set active role default
  React.useEffect(() => {
    if (roles.length > 0 && !activeRoleId) {
      const defaultRole = roles.find((r) => r.name === 'EDITOR') || roles[0];
      setActiveRoleId(defaultRole.id);
    }
  }, [roles, activeRoleId]);

  // Sync active role's permissions to state
  React.useEffect(() => {
    if (activeRoleId && roles.length > 0) {
      const currentRole = roles.find((r) => r.id === activeRoleId);
      if (currentRole) {
        const permSet = new Set(currentRole.permissions.map((p) => p.action));
        setRolePermissionsState(prev => ({
          ...prev,
          [activeRoleId]: permSet
        }));
      }
    }
  }, [activeRoleId, roles]);

  const activeRole = roles.find((r) => r.id === activeRoleId);
  const currentPerms = rolePermissionsState[activeRoleId] || new Set();

  // Mutations
  const updatePermissionsMutation = useMutation({
    mutationFn: ({ id, permissionActions }) =>
      adminApi.updateRolePermissions(id, { permissionActions }),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-roles']);
      setAlertMsg({ type: 'success', text: `Permissions for role '${activeRole?.name}' saved successfully.` });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to update permissions' });
    }
  });

  const createRoleMutation = useMutation({
    mutationFn: (data) => adminApi.createRole(data),
    onSuccess: (res) => {
      queryClient.invalidateQueries(['admin-roles']);
      setCreateModalOpen(false);
      setNewRoleForm({ name: '', description: '' });
      setActiveRoleId(res.data.id);
      setAlertMsg({ type: 'success', text: `Custom role '${res.data.name}' created successfully.` });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to create role' });
    }
  });

  const deleteRoleMutation = useMutation({
    mutationFn: (id) => adminApi.deleteRole(id),
    onSuccess: () => {
      queryClient.invalidateQueries(['admin-roles']);
      setActiveRoleId(roles[0]?.id);
      setAlertMsg({ type: 'success', text: 'Custom role deleted successfully.' });
    },
    onError: (err) => {
      setAlertMsg({ type: 'error', text: err.message || 'Failed to delete role' });
    }
  });

  const togglePermission = (action) => {
    if (!activeRoleId) return;
    const nextSet = new Set(currentPerms);
    if (nextSet.has(action)) {
      nextSet.delete(action);
    } else {
      nextSet.add(action);
    }
    setRolePermissionsState({
      ...rolePermissionsState,
      [activeRoleId]: nextSet
    });
  };

  const handleSavePermissions = () => {
    if (!activeRoleId) return;
    updatePermissionsMutation.mutate({
      id: activeRoleId,
      permissionActions: Array.from(currentPerms)
    });
  };

  return (
    <AdminLayout
      title="Roles & Authorization Matrix"
      subtitle="Exclusive Super Admin control over platform roles and fine-grained atomic permissions"
      actions={
        <button
          onClick={() => setCreateModalOpen(true)}
          className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          <span>New Custom Role</span>
        </button>
      }
    >
      <Helmet>
        <title>Roles & Permissions — Research Factors Admin</title>
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

      {rolesLoading || permsLoading ? (
        <div className="p-20 flex flex-col items-center justify-center space-y-3 bg-slate-900/60 rounded-2xl border border-slate-800">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          <p className="text-xs text-slate-400">Loading RBAC authorization catalog...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Roles Selector Sidebar */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Configured Roles ({roles.length})
            </h3>
            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = r.id === activeRoleId;
                return (
                  <div
                    key={r.id}
                    onClick={() => setActiveRoleId(r.id)}
                    className={`p-3.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-blue-600/15 border-blue-500 text-white shadow-xs'
                        : 'bg-slate-900/70 border-slate-800/80 text-slate-300 hover:bg-slate-800/50'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold uppercase tracking-wide">{r.name}</span>
                        {r.isSystem && (
                          <span title="System Protected Role">
                            <Lock className="w-3 h-3 text-slate-500" />
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {r.userCount} assigned account(s)
                      </span>
                    </div>

                    {!r.isSystem && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Are you sure you want to delete role '${r.name}'?`)) {
                            deleteRoleMutation.mutate(r.id);
                          }
                        }}
                        className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        title="Delete Role"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permissions Matrix for Active Role */}
          <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 shadow-xs">
            {activeRole ? (
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-800 mb-6">
                  <div>
                    <div className="flex items-center space-x-2">
                      <h2 className="text-lg font-bold text-white font-serif">{activeRole.name}</h2>
                      {activeRole.isSystem ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-slate-800 text-slate-400 border border-slate-700">
                          System Role
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Custom Role
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {activeRole.description || 'Configured access privileges for this role.'}
                    </p>
                  </div>

                  <button
                    onClick={handleSavePermissions}
                    disabled={updatePermissionsMutation.isPending}
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition-colors self-start sm:self-auto"
                  >
                    {updatePermissionsMutation.isPending ? 'Saving Matrix...' : 'Save Matrix Changes'}
                  </button>
                </div>

                {/* Modules Grid */}
                <div className="space-y-6">
                  {Object.entries(permissionsGrouped).map(([moduleName, permsList]) => (
                    <div key={moduleName} className="bg-slate-950/40 rounded-xl p-4 border border-slate-800/60">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center justify-between">
                        <span>{moduleName} Module</span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {permsList.filter((p) => currentPerms.has(p.action)).length} of {permsList.length} enabled
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {permsList.map((p) => {
                          const isChecked = currentPerms.has(p.action);
                          return (
                            <label
                              key={p.id}
                              onClick={() => togglePermission(p.action)}
                              className={`p-3 rounded-lg border flex items-start space-x-3 cursor-pointer select-none transition-colors ${
                                isChecked
                                  ? 'bg-blue-600/10 border-blue-500/30 text-white'
                                  : 'bg-slate-900/40 border-slate-800/80 text-slate-400 hover:bg-slate-900'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                              />
                              <div>
                                <span className="text-xs font-bold font-mono block text-slate-200">
                                  {p.action}
                                </span>
                                <span className="text-[11px] text-slate-400 block mt-0.5">
                                  {p.description || 'Allow action.'}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                Select a role to inspect or update permissions.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Custom Role Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-base font-serif font-bold text-white mb-1">Create Custom Role</h3>
            <p className="text-xs text-slate-400 mb-4">
              Define a new role for specialized staff or partner contributors.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Role Name</label>
                <input
                  type="text"
                  value={newRoleForm.name}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, name: e.target.value })}
                  placeholder="e.g. FACT_CHECKER or SENIOR_ANALYST"
                  className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows="3"
                  value={newRoleForm.description}
                  onChange={(e) => setNewRoleForm({ ...newRoleForm, description: e.target.value })}
                  placeholder="Responsibilities and purpose of this role..."
                  className="w-full p-3 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => createRoleMutation.mutate(newRoleForm)}
                disabled={createRoleMutation.isPending || !newRoleForm.name.trim()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 shadow-xs"
              >
                {createRoleMutation.isPending ? 'Creating...' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
