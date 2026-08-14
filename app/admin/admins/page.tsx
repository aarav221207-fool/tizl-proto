'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  ShieldAlert,
  UserCheck,
  UserX,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';

interface AdminUser {
  id: string;
  profile_id: string;
  designation: 'super_admin' | 'admin' | 'support';
  permissions: Record<string, boolean>;
  created_at: string;
  profile?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    status: string;
    role: string;
    created_at: string;
  };
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'super_admin' | 'admin' | 'support'>('all');

  // Modal State
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteDesignation, setInviteDesignation] = useState<'super_admin' | 'admin' | 'support'>('admin');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Confirmation Modal State
  const [activeAction, setActiveAction] = useState<{
    type: 'promote' | 'demote' | 'suspend' | 'reactivate' | 'remove';
    admin: AdminUser;
    targetDesignation?: 'super_admin' | 'admin' | 'support';
  } | null>(null);

  const fetchAdmins = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/admins');
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to fetch admin users');
      }
      setAdmins(json.data?.admins || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error loading admin users');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadInitialAdmins() {
      try {
        const res = await fetch('/api/admin/admins');
        const json = await res.json();
        if (isMounted) {
          if (!res.ok || !json.success) {
            throw new Error(json.error?.message || 'Failed to fetch admin users');
          }
          setAdmins(json.data?.admins || []);
        }
      } catch (err: unknown) {
        if (isMounted) setError(err instanceof Error ? err.message : 'Error loading admin users');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadInitialAdmins();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteName,
          designation: inviteDesignation,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to add admin user');
      }

      setSuccessMsg(`Admin user '${inviteEmail}' created successfully.`);
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteName('');
      fetchAdmins();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!activeAction) return;
    const { type, admin, targetDesignation } = activeAction;
    setIsSubmitting(true);
    setError(null);

    try {
      if (type === 'remove') {
        const res = await fetch(`/api/admin/admins/${admin.id}`, { method: 'DELETE' });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Failed to remove admin user');
        }
        setSuccessMsg(`Admin privileges for '${admin.profile?.email}' removed.`);
      } else if (type === 'promote' || type === 'demote') {
        const res = await fetch(`/api/admin/admins/${admin.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ designation: targetDesignation }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Failed to update admin role');
        }
        setSuccessMsg(`Admin role updated to '${targetDesignation}'.`);
      } else if (type === 'suspend' || type === 'reactivate') {
        const newStatus = type === 'suspend' ? 'suspended' : 'active';
        const res = await fetch(`/api/admin/admins/${admin.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || 'Failed to update admin status');
        }
        setSuccessMsg(`Admin status changed to '${newStatus}'.`);
      }

      setActiveAction(null);
      fetchAdmins();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAdmins = admins.filter((a) => {
    const matchesSearch =
      (a.profile?.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.profile?.email || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || a.designation === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (designation: string) => {
    switch (designation) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <ShieldCheck className="w-3.5 h-3.5" />
            Operations Admin
          </span>
        );
      case 'support':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-3.5 h-3.5" />
            Support Staff
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-slate-800 text-slate-300">
            {designation}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-blue-500" />
            Admin User Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage system administrators, staff roles, explicit authorizations, and audit access logs.
          </p>
        </div>

        <button
          onClick={() => setIsInviteOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl shadow-md transition-all shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add / Invite Admin</span>
        </button>
      </div>

      {/* Toast Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-slate-400 hover:text-white">
            ✕
          </button>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search admins by name or email..."
            className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-4 h-4 text-slate-500 shrink-0" />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as 'all' | 'super_admin' | 'admin' | 'support')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="admin">Operations Admin</option>
            <option value="support">Support Staff</option>
          </select>

          <button
            onClick={fetchAdmins}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors shrink-0"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="p-4">Administrator</th>
                <th className="p-4">Role / Designation</th>
                <th className="p-4">Account Status</th>
                <th className="p-4">Added Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    <span className="inline-block w-6 h-6 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-2" />
                    <p>Loading administrative accounts...</p>
                  </td>
                </tr>
              ) : filteredAdmins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No admin accounts found matching search criteria.
                  </td>
                </tr>
              ) : (
                filteredAdmins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-medium text-white">{admin.profile?.full_name || 'Admin User'}</div>
                      <div className="text-slate-500 font-mono text-[11px]">{admin.profile?.email || 'N/A'}</div>
                    </td>
                    <td className="p-4">{getRoleBadge(admin.designation)}</td>
                    <td className="p-4">
                      {admin.profile?.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-rose-500/10 text-rose-400 border border-rose-500/20 font-medium">
                          <UserX className="w-3 h-3" /> Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          <UserCheck className="w-3 h-3" /> Active
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-slate-400">
                      {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {/* Change Role Dropdown / Action */}
                        {admin.designation !== 'super_admin' && (
                          <button
                            onClick={() =>
                              setActiveAction({
                                type: 'promote',
                                admin,
                                targetDesignation: 'super_admin',
                              })
                            }
                            className="px-2 py-1 bg-purple-600/20 hover:bg-purple-600/40 text-purple-300 rounded text-[11px] font-medium transition-colors"
                          >
                            Promote
                          </button>
                        )}

                        {admin.designation === 'super_admin' && (
                          <button
                            onClick={() =>
                              setActiveAction({
                                type: 'demote',
                                admin,
                                targetDesignation: 'admin',
                              })
                            }
                            className="px-2 py-1 bg-amber-600/20 hover:bg-amber-600/40 text-amber-300 rounded text-[11px] font-medium transition-colors"
                          >
                            Demote
                          </button>
                        )}

                        {admin.designation === 'admin' && (
                          <button
                            onClick={() =>
                              setActiveAction({
                                type: 'demote',
                                admin,
                                targetDesignation: 'support',
                              })
                            }
                            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded text-[11px] font-medium transition-colors"
                          >
                            To Support
                          </button>
                        )}

                        {/* Suspend / Reactivate */}
                        {admin.profile?.status === 'suspended' ? (
                          <button
                            onClick={() => setActiveAction({ type: 'reactivate', admin })}
                            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 rounded text-[11px] font-medium transition-colors"
                          >
                            Reactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => setActiveAction({ type: 'suspend', admin })}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition-colors"
                          >
                            Suspend
                          </button>
                        )}

                        {/* Remove */}
                        <button
                          onClick={() => setActiveAction({ type: 'remove', admin })}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded transition-colors"
                          title="Remove Admin"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite / Add Admin Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 relative">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-500" />
              Invite / Add Admin Account
            </h3>
            <p className="text-xs text-slate-400">
              Grant administrator or support access to an existing user profile or new team member.
            </p>

            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="staff@tizl.in"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Designation / Role *
                </label>
                <select
                  value={inviteDesignation}
                  onChange={(e) =>
                    setInviteDesignation(e.target.value as 'super_admin' | 'admin' | 'support')
                  }
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="admin">Operations Admin (Bookings, Cooks, Customers)</option>
                  <option value="support">Support Staff (Read-only View Access)</option>
                  <option value="super_admin">Super Admin (Full Access & Admin Mgmt)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-medium transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Adding...' : 'Add Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {activeAction && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <ShieldAlert className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-base">Confirm Action</h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to <strong>{activeAction.type}</strong> admin{' '}
              <span className="text-white font-mono">{activeAction.admin.profile?.email}</span>?
              {activeAction.targetDesignation && (
                <>
                  {' '}
                  Target Role: <strong className="text-blue-400">{activeAction.targetDesignation}</strong>
                </>
              )}
            </p>

            <div className="p-3 bg-slate-950 rounded-xl text-[11px] text-slate-400 border border-slate-800">
              This action will be permanently recorded in the immutable security audit log.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActiveAction(null)}
                disabled={isSubmitting}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={isSubmitting}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-medium transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Executing...' : 'Confirm & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
