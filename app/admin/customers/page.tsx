'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Ban,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Mail,
  Calendar,
  MapPin,
  DollarSign,
  Utensils,
  Star,
  Clock,
  Building,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

interface Customer {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  customer_details: {
    dietary_preferences: string[] | null;
    allergies: string[] | null;
    house_type: string | null;
    kitchen_type: string | null;
  } | null;
  stats: {
    totalBookings: number;
    activeBookings: number;
    totalSpend: number;
  };
}

interface CustomerProfileDetail {
  profile: any;
  details: any;
  bookings: any[];
  addresses: any[];
  reviews: any[];
  auditLogs: any[];
  summary: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    totalSpend: number;
    totalReviews: number;
    savedAddresses: number;
  };
}

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('spend');

  // Selected Customer Drawer
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerProfileDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'addresses' | 'bookings' | 'reviews' | 'audit'>('overview');

  // Action Modal
  const [actionModal, setActionModal] = useState<{
    type: 'suspend' | 'reactivate' | null;
    customerId: string | null;
    customerName: string;
  }>({ type: null, customerId: null, customerName: '' });
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Customers List
  const fetchCustomers = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/admin/customers');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to fetch customer list');
      }
      const data = await res.json();
      setCustomers(data.data?.customers || data.customers || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading customers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      try {
        setRefreshing(true);
        setError(null);
        const res = await fetch('/api/admin/customers');
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || 'Failed to fetch customer list');
        }
        const data = await res.json();
        if (!ignore) setCustomers(data.data?.customers || data.customers || []);
      } catch (err: any) {
        if (!ignore) setError(err.message || 'An error occurred while loading customers.');
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch single customer profile drawer
  useEffect(() => {
    if (!activeCustomerId) return;
    let ignore = false;

    const fetchCustomerProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await fetch(`/api/admin/customers/${activeCustomerId}`);
        if (!res.ok) throw new Error('Failed to fetch customer profile');
        const data = await res.json();
        if (!ignore) setCustomerProfile(data.data?.customerProfile || data.customerProfile);
      } catch (err: any) {
        console.error('Error fetching customer profile:', err);
      } finally {
        if (!ignore) setProfileLoading(false);
      }
    };

    fetchCustomerProfile();
    return () => {
      ignore = true;
    };
  }, [activeCustomerId]);

  // Derived filtered customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((cust) => {
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const nameMatch = cust.full_name?.toLowerCase().includes(term);
          const phoneMatch = cust.phone?.toLowerCase().includes(term);
          const emailMatch = cust.email?.toLowerCase().includes(term);
          if (!nameMatch && !phoneMatch && !emailMatch) return false;
        }

        if (statusFilter !== 'all') {
          if (cust.status !== statusFilter) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'spend') return b.stats.totalSpend - a.stats.totalSpend;
        if (sortBy === 'bookings') return b.stats.totalBookings - a.stats.totalBookings;
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        return 0;
      });
  }, [customers, searchTerm, statusFilter, sortBy]);

  // Toggle customer account status
  const handleToggleStatus = async () => {
    if (!actionModal.type || !actionModal.customerId) return;

    try {
      setActionLoading(true);
      const newStatus = actionModal.type === 'suspend' ? 'suspended' : 'active';
      const res = await fetch('/api/admin/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_id: actionModal.customerId,
          status: newStatus,
          reason: actionReason,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to update customer status');
      }

      await fetchCustomers();
      if (activeCustomerId === actionModal.customerId) {
        const profileRes = await fetch(`/api/admin/customers/${actionModal.customerId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCustomerProfile(profileData.data?.customerProfile || profileData.customerProfile);
        }
      }

      setActionModal({ type: null, customerId: null, customerName: '' });
      setActionReason('');
    } catch (err: any) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = (format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({
      type: 'customers',
      format,
    });
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  const totalCount = customers.length;
  const activeCount = customers.filter((c) => c.status === 'active').length;
  const suspendedCount = customers.filter((c) => c.status === 'suspended').length;
  const totalRevenue = customers.reduce((sum, c) => sum + c.stats.totalSpend, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-emerald-500" />
            Customer Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor customer accounts, inspect lifetime spend, saved addresses, and manage account statuses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCustomers()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="flex items-center bg-slate-800 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => handleExport('xlsx')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-slate-700 rounded-md transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-400 hover:bg-slate-700 rounded-md transition-colors border-l border-slate-700"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Total Registered Customers</div>
          <div className="text-2xl font-extrabold text-white mt-1">{totalCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium text-emerald-400">Active Accounts</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{activeCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium text-rose-400">Suspended Customers</div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{suspendedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium text-blue-400">Total GMV Spend</div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">₹{totalRevenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by customer name, phone, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="all">Account Status: All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 text-xs">
          <div className="text-slate-400">
            Showing <span className="text-white font-semibold">{filteredCustomers.length}</span> of {totalCount} customers
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            >
              <option value="spend">Highest Total Spend</option>
              <option value="bookings">Most Bookings</option>
              <option value="newest">Newest First</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
            <p className="text-sm">Loading live customers from Supabase...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <Users className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-base font-semibold text-slate-200">No Customers Found</h3>
            <p className="text-xs text-slate-500">Try adjusting your search filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Contact Info</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4">Bookings</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-300 shrink-0 text-sm">
                          {(customer.full_name || 'C').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{customer.full_name || 'Customer'}</div>
                          <div className="text-[11px] text-slate-500">
                            Joined {new Date(customer.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-200">{customer.phone || 'No phone'}</div>
                      <div className="text-slate-400 mt-0.5">{customer.email || 'No email'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {customer.status === 'suspended' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                          <Ban className="w-3.5 h-3.5" />
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      ₹{customer.stats.totalSpend.toLocaleString()}
                    </td>

                    <td className="py-3.5 px-4 text-xs">
                      <div className="text-slate-200 font-semibold">{customer.stats.totalBookings} Total</div>
                      {customer.stats.activeBookings > 0 && (
                        <div className="text-amber-400 font-medium text-[11px] mt-0.5">
                          {customer.stats.activeBookings} Active
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => setActiveCustomerId(customer.id)}
                        className="px-2.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-medium rounded-lg border border-emerald-500/30 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Profile</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CUSTOMER PROFILE DRAWER */}
      {activeCustomerId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-base">
                  {(customerProfile?.profile?.full_name || 'C').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">
                    {customerProfile?.profile?.full_name || 'Customer Profile'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    ID: {activeCustomerId} • Registered{' '}
                    {customerProfile?.profile?.created_at
                      ? new Date(customerProfile.profile.created_at).toLocaleDateString()
                      : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCustomerId(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm">Fetching customer details and history...</p>
              </div>
            ) : customerProfile ? (
              <>
                {/* Navigation Tabs */}
                <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 text-xs font-medium">
                  {[
                    { id: 'overview', label: 'Overview' },
                    { id: 'addresses', label: `Saved Addresses (${customerProfile.addresses.length})` },
                    { id: 'bookings', label: `Bookings (${customerProfile.bookings.length})` },
                    { id: 'reviews', label: `Reviews (${customerProfile.reviews.length})` },
                    { id: 'audit', label: `Audit Log (${customerProfile.auditLogs.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-emerald-500 text-emerald-400 font-semibold'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* OVERVIEW */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Action Bar */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Account Status</div>
                          <div className="flex items-center gap-2 mt-1">
                            {customerProfile.profile.status === 'suspended' ? (
                              <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
                                SUSPENDED
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                ACTIVE
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          {customerProfile.profile.status === 'suspended' ? (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'reactivate',
                                  customerId: activeCustomerId,
                                  customerName: customerProfile.profile.full_name || 'Customer',
                                })
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
                            >
                              Reactivate Account
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'suspend',
                                  customerId: activeCustomerId,
                                  customerName: customerProfile.profile.full_name || 'Customer',
                                })
                              }
                              className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors flex items-center gap-1.5"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Suspend Account
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Summary Cards */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                          <div className="text-[11px] text-slate-400">Total Spend</div>
                          <div className="text-lg font-bold text-emerald-400 mt-0.5">
                            ₹{customerProfile.summary.totalSpend.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                          <div className="text-[11px] text-slate-400">Total Bookings</div>
                          <div className="text-lg font-bold text-white mt-0.5">
                            {customerProfile.summary.totalBookings}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                          <div className="text-[11px] text-slate-400">Active Bookings</div>
                          <div className="text-lg font-bold text-amber-400 mt-0.5">
                            {customerProfile.summary.activeBookings}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Contact Details
                        </h3>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2 text-slate-300">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            <span>{customerProfile.profile.phone || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span>{customerProfile.profile.email || 'Not provided'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-300">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Joined {new Date(customerProfile.profile.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Dietary & Kitchen Preferences */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-amber-400" />
                          Dietary & Kitchen Preferences
                        </h3>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-slate-500">Dietary Preferences:</span>
                            <div className="text-slate-200 font-medium mt-0.5">
                              {customerProfile.details?.dietary_preferences?.join(', ') || 'No restrictions'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Allergies:</span>
                            <div className="text-slate-200 font-medium mt-0.5">
                              {customerProfile.details?.allergies?.join(', ') || 'None reported'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">House Type:</span>
                            <div className="text-slate-200 font-medium mt-0.5">
                              {customerProfile.details?.house_type || 'Standard Apartment'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-500">Kitchen Setup:</span>
                            <div className="text-slate-200 font-medium mt-0.5">
                              {customerProfile.details?.kitchen_type || 'Fully equipped'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ADDRESSES */}
                  {activeTab === 'addresses' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Saved Delivery Addresses</h3>
                      {customerProfile.addresses.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4">No saved addresses for this customer.</p>
                      ) : (
                        <div className="space-y-2">
                          {customerProfile.addresses.map((addr) => (
                            <div
                              key={addr.id}
                              className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1"
                            >
                              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                                <span>{addr.house_number}, {addr.street}</span>
                              </div>
                              <div className="text-slate-400 pl-5">
                                {addr.locality}, {addr.city?.name} - {addr.pincode}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* BOOKINGS */}
                  {activeTab === 'bookings' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Booking History</h3>
                      {customerProfile.bookings.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4">No bookings made yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {customerProfile.bookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-semibold text-slate-200 flex items-center gap-2">
                                  <span>{booking.booking_number}</span>
                                  <span className="text-slate-500">•</span>
                                  <span>{booking.service?.name || 'Chef Service'}</span>
                                </div>
                                <div className="text-slate-400 mt-1">
                                  Cook: {booking.cook?.full_name || 'Unassigned'} • Date: {booking.booking_date}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-bold text-emerald-400">₹{booking.total_amount}</div>
                                <span className="inline-block px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-slate-800 text-slate-300 mt-1">
                                  {booking.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* REVIEWS */}
                  {activeTab === 'reviews' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Customer Reviews Left</h3>
                      {customerProfile.reviews.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4">No reviews submitted yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {customerProfile.reviews.map((rev) => (
                            <div key={rev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-200">
                                  Cook: {rev.cook?.full_name || 'Cook'}
                                </span>
                                <div className="flex items-center gap-1 text-amber-400 font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                                  <span>{rev.rating}/5</span>
                                </div>
                              </div>
                              <p className="text-slate-300 italic">&quot;{rev.comment}&quot;</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AUDIT LOG */}
                  {activeTab === 'audit' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Audit Trail</h3>
                      {customerProfile.auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4">No recorded audit logs for this customer.</p>
                      ) : (
                        <div className="space-y-2">
                          {customerProfile.auditLogs.map((log) => (
                            <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1 font-mono">
                              <div className="flex justify-between text-slate-400">
                                <span className="text-emerald-400 font-bold">{log.action}</span>
                                <span>{new Date(log.created_at).toLocaleString()}</span>
                              </div>
                              <div className="text-slate-300 text-[11px] truncate">
                                Details: {JSON.stringify(log.new_data || log.old_data || {})}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* SUSPEND / REACTIVATE MODAL */}
      {actionModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Confirm Account {actionModal.type === 'suspend' ? 'Suspension' : 'Reactivation'}
            </h3>

            <p className="text-sm text-slate-300">
              Are you sure you want to {actionModal.type} <strong>{actionModal.customerName}</strong>?
            </p>

            <textarea
              placeholder="Enter reason for audit record..."
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 h-24"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setActionModal({ type: null, customerId: null, customerName: '' })}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleToggleStatus}
                disabled={actionLoading}
                className={`px-4 py-2 text-white text-xs font-semibold rounded-lg shadow disabled:opacity-50 ${
                  actionModal.type === 'suspend'
                    ? 'bg-rose-600 hover:bg-rose-500'
                    : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {actionLoading ? 'Processing...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
