'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  UserCheck,
  Search,
  Filter,
  Download,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ShieldAlert,
  Eye,
  UserX,
  RefreshCw,
  FileText,
  Award,
  DollarSign,
  Calendar,
  Star,
  MapPin,
  Phone,
  Mail,
  Building,
  X,
  ChevronRight,
  ChevronDown,
  Lock,
  ExternalLink,
  Ban,
  Check,
} from 'lucide-react';

interface Cook {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'rejected' | 'pending';
  created_at: string;
  cook_details: {
    id: string;
    cook_id: string;
    bio: string | null;
    experience_years: number;
    speciality: string[] | null;
    hourly_rate: number;
    is_verified: boolean;
    police_verification_status: string;
    aadhaar_number: string | null;
    bank_details: Record<string, any> | null;
  } | null;
  stats: {
    totalBookings: number;
    completedBookings: number;
    totalEarnings: number;
    avgRating: number;
    totalReviews: number;
  };
}

interface CookProfileDetail {
  profile: any;
  details: any;
  bookings: any[];
  reviews: any[];
  auditLogs: any[];
  summary: {
    totalBookings: number;
    completedBookings: number;
    totalEarnings: number;
    avgRating: number;
    totalReviews: number;
  };
}

export default function AdminCooksPage() {
  const [cooks, setCooks] = useState<Cook[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [verificationFilter, setVerificationFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [selectedCity, setSelectedCity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Multi-select for bulk exports
  const [selectedCookIds, setSelectedCookIds] = useState<string[]>([]);

  // Active Selected Cook Profile Drawer
  const [activeCookId, setActiveCookId] = useState<string | null>(null);
  const [cookProfile, setCookProfile] = useState<CookProfileDetail | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'documents' | 'bookings' | 'reviews' | 'audit'>('overview');

  // Modal Dialogs for Admin Actions
  const [actionModal, setActionModal] = useState<{
    type: 'approve' | 'reject' | 'request_docs' | 'suspend' | 'reactivate' | null;
    cookId: string | null;
    cookName: string;
  }>({ type: null, cookId: null, cookName: '' });

  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all cooks
  const fetchCooks = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/admin/cooks');
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to fetch cooks list');
      }
      const data = await res.json();
      setCooks(data.data?.cooks || data.cooks || []);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading cooks.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const loadCooks = async () => {
      try {
        setRefreshing(true);
        setError(null);
        const res = await fetch('/api/admin/cooks');
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.error?.message || 'Failed to fetch cooks list');
        }
        const data = await res.json();
        if (!ignore) {
          setCooks(data.data?.cooks || data.cooks || []);
        }
      } catch (err: any) {
        if (!ignore) setError(err.message || 'An error occurred while loading cooks.');
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };

    loadCooks();
    return () => {
      ignore = true;
    };
  }, []);

  // Fetch full cook profile when activeCookId changes
  useEffect(() => {
    if (!activeCookId) return;

    let ignore = false;
    const fetchCookProfile = async () => {
      try {
        setProfileLoading(true);
        const res = await fetch(`/api/admin/cooks/${activeCookId}`);
        if (!res.ok) throw new Error('Failed to fetch cook profile');
        const data = await res.json();
        if (!ignore) setCookProfile(data.data?.cookProfile || data.cookProfile);
      } catch (err: any) {
        console.error('Error fetching cook profile:', err);
      } finally {
        if (!ignore) setProfileLoading(false);
      }
    };

    fetchCookProfile();
    return () => {
      ignore = true;
    };
  }, [activeCookId]);

  // Derived filtered cooks list
  const filteredCooks = useMemo(() => {
    return cooks.filter((cook) => {
      // Search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const nameMatch = cook.full_name?.toLowerCase().includes(term);
        const phoneMatch = cook.phone?.toLowerCase().includes(term);
        const emailMatch = cook.email?.toLowerCase().includes(term);
        const specMatch = cook.cook_details?.speciality?.some((s) => s.toLowerCase().includes(term));
        if (!nameMatch && !phoneMatch && !emailMatch && !specMatch) return false;
      }

      // Verification Status filter
      if (verificationFilter !== 'all') {
        const isVerified = cook.cook_details?.is_verified;
        const policeStatus = cook.cook_details?.police_verification_status;
        if (verificationFilter === 'verified' && !isVerified) return false;
        if (verificationFilter === 'pending' && isVerified) return false;
        if (verificationFilter === 'pending_docs' && policeStatus !== 'pending_docs') return false;
        if (verificationFilter === 'rejected' && policeStatus !== 'rejected') return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        if (cook.status !== statusFilter) return false;
      }

      // Rating filter
      if (ratingFilter !== 'all') {
        const rating = cook.stats.avgRating;
        if (ratingFilter === '4.5+' && rating < 4.5) return false;
        if (ratingFilter === '4.0+' && rating < 4.0) return false;
        if (ratingFilter === '3.5+' && rating < 3.5) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'rating') return b.stats.avgRating - a.stats.avgRating;
      if (sortBy === 'experience') return (b.cook_details?.experience_years || 0) - (a.cook_details?.experience_years || 0);
      if (sortBy === 'earnings') return b.stats.totalEarnings - a.stats.totalEarnings;
      if (sortBy === 'rate') return (b.cook_details?.hourly_rate || 0) - (a.cook_details?.hourly_rate || 0);
      return 0;
    });
  }, [cooks, searchTerm, verificationFilter, statusFilter, ratingFilter, sortBy]);

  // Bulk selection toggles
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedCookIds(filteredCooks.map((c) => c.id));
    } else {
      setSelectedCookIds([]);
    }
  };

  const handleSelectCook = (id: string) => {
    if (selectedCookIds.includes(id)) {
      setSelectedCookIds(selectedCookIds.filter((item) => item !== id));
    } else {
      setSelectedCookIds([...selectedCookIds, id]);
    }
  };

  // Perform Admin Action
  const handleExecuteAction = async () => {
    if (!actionModal.type || !actionModal.cookId) return;

    try {
      setActionLoading(true);
      const payload: any = {
        cook_id: actionModal.cookId,
        action: actionModal.type,
      };

      if (actionModal.type === 'reject' || actionModal.type === 'suspend') {
        payload.reason = actionReason;
      } else if (actionModal.type === 'request_docs') {
        payload.notes = actionReason;
      }

      const res = await fetch('/api/admin/cooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error?.message || 'Failed to complete action');
      }

      // Refresh cook list and active drawer
      await fetchCooks();
      if (activeCookId === actionModal.cookId) {
        // Refresh active profile
        const profileRes = await fetch(`/api/admin/cooks/${actionModal.cookId}`);
        if (profileRes.ok) {
          const profileData = await profileRes.json();
          setCookProfile(profileData.data?.cookProfile || profileData.cookProfile);
        }
      }

      // Close modal
      setActionModal({ type: null, cookId: null, cookName: '' });
      setActionReason('');
    } catch (err: any) {
      alert(`Action error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // Export Trigger
  const handleExport = (format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({
      type: 'cooks',
      format,
    });
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  // Metrics summary
  const totalCount = cooks.length;
  const verifiedCount = cooks.filter((c) => c.cook_details?.is_verified).length;
  const pendingCount = cooks.filter((c) => !c.cook_details?.is_verified && c.status !== 'rejected').length;
  const suspendedCount = cooks.filter((c) => c.status === 'suspended').length;
  const avgRate = cooks.length > 0
    ? Math.round(cooks.reduce((sum, c) => sum + (c.cook_details?.hourly_rate || 0), 0) / cooks.length)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-blue-500" />
            Cook Verification & Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Review credentials, manage verification status, inspect documents, and enforce operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchCooks()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
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

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium">Total Registered Cooks</div>
          <div className="text-2xl font-extrabold text-white mt-1">{totalCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            Verified Cooks
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1">{verifiedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            Pending Verification
          </div>
          <div className="text-2xl font-extrabold text-amber-400 mt-1">{pendingCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            Suspended Cooks
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1">{suspendedCount}</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 col-span-2 md:col-span-1">
          <div className="text-xs text-slate-400 font-medium flex items-center gap-1">
            <DollarSign className="w-3.5 h-3.5 text-blue-400" />
            Avg Hourly Rate
          </div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1">₹{avgRate}/hr</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search cook name, phone, email, specialty..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
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

          {/* Verification Status Filter */}
          <div>
            <select
              value={verificationFilter}
              onChange={(e) => setVerificationFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Verification: All</option>
              <option value="verified">Verified Only</option>
              <option value="pending">Pending Verification</option>
              <option value="pending_docs">Docs Requested</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="all">Account Status: All</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="rejected">Rejected</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Secondary Filters & Sort */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1 font-medium">
              <Filter className="w-3.5 h-3.5" />
              Rating:
            </span>
            {['all', '4.5+', '4.0+', '3.5+'].map((r) => (
              <button
                key={r}
                onClick={() => setRatingFilter(r)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  ratingFilter === r
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {r === 'all' ? 'All Ratings' : r}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="newest">Newest First</option>
              <option value="rating">Highest Rated</option>
              <option value="experience">Most Experienced</option>
              <option value="earnings">Highest Earnings</option>
              <option value="rate">Highest Hourly Rate</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-500" />
            <p className="text-sm">Loading live cooks from Supabase...</p>
          </div>
        ) : filteredCooks.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <UserX className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-base font-semibold text-slate-200">No Cooks Found</h3>
            <p className="text-xs text-slate-500">
              Try adjusting your search criteria or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <input
                      type="checkbox"
                      checked={
                        filteredCooks.length > 0 &&
                        selectedCookIds.length === filteredCooks.length
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-900"
                    />
                  </th>
                  <th className="py-3 px-4">Cook Info</th>
                  <th className="py-3 px-4">Verification</th>
                  <th className="py-3 px-4">Experience & Specialties</th>
                  <th className="py-3 px-4">Hourly Rate</th>
                  <th className="py-3 px-4">Bookings & Rating</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredCooks.map((cook) => {
                  const details = cook.cook_details;
                  const isVerified = details?.is_verified;
                  const isSelected = selectedCookIds.includes(cook.id);

                  return (
                    <tr
                      key={cook.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-blue-950/20' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectCook(cook.id)}
                          className="rounded border-slate-700 text-blue-600 focus:ring-0 bg-slate-900"
                        />
                      </td>

                      {/* Cook Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 text-sm font-bold text-slate-300">
                            {cook.avatar_url ? (
                              <Image
                                src={cook.avatar_url}
                                alt={cook.full_name || 'Cook'}
                                width={40}
                                height={40}
                                className="w-full h-full object-cover"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              (cook.full_name || 'C').charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-100 flex items-center gap-2">
                              <span>{cook.full_name || 'Unnamed Cook'}</span>
                              {cook.status === 'suspended' && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                                  Suspended
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 flex items-center gap-3 mt-0.5">
                              <span>{cook.phone || 'No Phone'}</span>
                              <span>•</span>
                              <span>{cook.email || 'No Email'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4">
                        {isVerified ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Verified
                          </span>
                        ) : details?.police_verification_status === 'pending_docs' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            Docs Requested
                          </span>
                        ) : details?.police_verification_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                            <XCircle className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Review
                          </span>
                        )}
                      </td>

                      {/* Experience & Specialty */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs text-slate-200 font-medium">
                          {details?.experience_years ? `${details.experience_years} Years Exp.` : 'Fresher'}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1 max-w-xs">
                          {details?.speciality && details.speciality.length > 0 ? (
                            details.speciality.slice(0, 3).map((spec, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded border border-slate-700/60"
                              >
                                {spec}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-slate-500">General Cooking</span>
                          )}
                        </div>
                      </td>

                      {/* Hourly Rate */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-100">
                        ₹{details?.hourly_rate || 0}/hr
                      </td>

                      {/* Bookings & Rating */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>
                            {cook.stats.avgRating > 0 ? cook.stats.avgRating : 'New'}
                          </span>
                          <span className="text-slate-500 font-normal">
                            ({cook.stats.totalReviews})
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          {cook.stats.completedBookings} Completed Bookings
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2">
                        <button
                          onClick={() => setActiveCookId(cook.id)}
                          className="px-2.5 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 text-xs font-medium rounded-lg border border-blue-500/30 transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect Profile</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* COOK PROFILE DRAWER */}
      {activeCookId && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200 text-lg overflow-hidden">
                  {cookProfile?.profile?.avatar_url ? (
                    <Image
                      src={cookProfile.profile.avatar_url}
                      alt={cookProfile.profile.full_name || 'Cook'}
                      width={48}
                      height={48}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    (cookProfile?.profile?.full_name || 'C').charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>{cookProfile?.profile?.full_name || 'Cook Verification Details'}</span>
                    {cookProfile?.details?.is_verified && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    )}
                  </h2>
                  <p className="text-xs text-slate-400">
                    ID: {activeCookId} • Registered{' '}
                    {cookProfile?.profile?.created_at
                      ? new Date(cookProfile.profile.created_at).toLocaleDateString()
                      : ''}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCookId(null)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {profileLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm">Retrieving verified credentials and booking logs...</p>
              </div>
            ) : cookProfile ? (
              <>
                {/* Drawer Tab Navigation */}
                <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 text-xs font-medium">
                  {[
                    { id: 'overview', label: 'Overview & Stats' },
                    { id: 'documents', label: 'Documents & Banking' },
                    { id: 'bookings', label: `Bookings (${cookProfile.bookings.length})` },
                    { id: 'reviews', label: `Reviews (${cookProfile.reviews.length})` },
                    { id: 'audit', label: `Audit Log (${cookProfile.auditLogs.length})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-4 py-3 border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-blue-500 text-blue-400 font-semibold'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Drawer Body Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* OVERVIEW TAB */}
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      {/* Operational Banner Actions */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-400 font-medium">Current Status</div>
                          <div className="flex items-center gap-2 mt-1">
                            {cookProfile.details?.is_verified ? (
                              <span className="px-2.5 py-1 text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
                                VERIFIED COOK
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full">
                                UNVERIFIED / PENDING
                              </span>
                            )}
                            <span className="text-xs text-slate-400 uppercase font-mono">
                              Account: {cookProfile.profile.status}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {!cookProfile.details?.is_verified && (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'approve',
                                  cookId: activeCookId,
                                  cookName: cookProfile.profile.full_name || 'Cook',
                                })
                              }
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow transition-colors flex items-center gap-1.5"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Approve Cook
                            </button>
                          )}

                          <button
                            onClick={() =>
                              setActionModal({
                                type: 'request_docs',
                                cookId: activeCookId,
                                cookName: cookProfile.profile.full_name || 'Cook',
                              })
                            }
                            className="px-3 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 text-xs font-semibold rounded-lg border border-amber-500/30 transition-colors flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            Request Docs
                          </button>

                          <button
                            onClick={() =>
                              setActionModal({
                                type: 'reject',
                                cookId: activeCookId,
                                cookName: cookProfile.profile.full_name || 'Cook',
                              })
                            }
                            className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-colors flex items-center gap-1.5"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Reject
                          </button>

                          {cookProfile.profile.status === 'suspended' ? (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'reactivate',
                                  cookId: activeCookId,
                                  cookName: cookProfile.profile.full_name || 'Cook',
                                })
                              }
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow transition-colors"
                            >
                              Reactivate Account
                            </button>
                          ) : (
                            <button
                              onClick={() =>
                                setActionModal({
                                  type: 'suspend',
                                  cookId: activeCookId,
                                  cookName: cookProfile.profile.full_name || 'Cook',
                                })
                              }
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Suspend
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Stat Tiles */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                          <div className="text-[11px] text-slate-400">Total Bookings</div>
                          <div className="text-xl font-bold text-white mt-0.5">
                            {cookProfile.summary.totalBookings}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                          <div className="text-[11px] text-slate-400">Completed</div>
                          <div className="text-xl font-bold text-emerald-400 mt-0.5">
                            {cookProfile.summary.completedBookings}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                          <div className="text-[11px] text-slate-400">Total Earnings</div>
                          <div className="text-xl font-bold text-blue-400 mt-0.5">
                            ₹{cookProfile.summary.totalEarnings.toLocaleString()}
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-center">
                          <div className="text-[11px] text-slate-400">Avg Rating</div>
                          <div className="text-xl font-bold text-amber-400 mt-0.5 flex items-center justify-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400" />
                            {cookProfile.summary.avgRating > 0 ? cookProfile.summary.avgRating : 'N/A'}
                          </div>
                        </div>
                      </div>

                      {/* Contact & Professional Info */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Personal Information
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2 text-slate-300">
                              <Phone className="w-3.5 h-3.5 text-slate-500" />
                              <span>{cookProfile.profile.phone || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <Mail className="w-3.5 h-3.5 text-slate-500" />
                              <span>{cookProfile.profile.email || 'Not provided'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-300">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              <span>Joined {new Date(cookProfile.profile.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                            Cooking Profile
                          </h3>
                          <div className="space-y-2 text-xs">
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Experience:</span>
                              <span className="font-semibold">{cookProfile.details?.experience_years || 0} Years</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Hourly Rate:</span>
                              <span className="font-mono font-semibold text-emerald-400">₹{cookProfile.details?.hourly_rate || 0}/hr</span>
                            </div>
                            <div className="flex justify-between text-slate-300">
                              <span className="text-slate-500">Specialties:</span>
                              <span className="text-right">
                                {cookProfile.details?.speciality?.join(', ') || 'General'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Biography & Experience
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {cookProfile.details?.bio || 'No bio provided by cook.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* DOCUMENTS & BANKING TAB */}
                  {activeTab === 'documents' && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-slate-200">Verification Documents</h3>

                      <div className="grid grid-cols-2 gap-4">
                        {/* Aadhaar Card */}
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <FileText className="w-4 h-4 text-blue-400" />
                              Aadhaar Card
                            </span>
                            {cookProfile.details?.aadhaar_number ? (
                              <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                                Provided
                              </span>
                            ) : (
                              <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                                Missing
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-slate-200 pt-1">
                            {cookProfile.details?.aadhaar_number || '•••• •••• ••••'}
                          </div>
                        </div>

                        {/* Police Verification */}
                        <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                              <ShieldAlert className="w-4 h-4 text-amber-400" />
                              Police Verification
                            </span>
                            <span className="text-[10px] uppercase font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                              {cookProfile.details?.police_verification_status || 'Pending'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400">
                            Clearance status from local law enforcement agency.
                          </p>
                        </div>
                      </div>

                      {/* Bank Account Details */}
                      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-emerald-400" />
                          Bank Account Details for Payouts
                        </h4>

                        {cookProfile.details?.bank_details ? (
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <span className="text-slate-500">Bank Name:</span>
                              <div className="font-semibold text-slate-200">
                                {cookProfile.details.bank_details.bank_name || 'HDFC Bank'}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">Account Number:</span>
                              <div className="font-mono font-semibold text-slate-200">
                                {cookProfile.details.bank_details.account_number || '••••••••1234'}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">IFSC Code:</span>
                              <div className="font-mono font-semibold text-slate-200">
                                {cookProfile.details.bank_details.ifsc || 'HDFC0001234'}
                              </div>
                            </div>
                            <div>
                              <span className="text-slate-500">Account Holder:</span>
                              <div className="font-semibold text-slate-200">
                                {cookProfile.details.bank_details.account_holder || cookProfile.profile.full_name}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500">No bank account registered yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* BOOKINGS TAB */}
                  {activeTab === 'bookings' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Assigned Booking History</h3>
                      {cookProfile.bookings.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4">No bookings assigned to this cook yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {cookProfile.bookings.map((booking) => (
                            <div
                              key={booking.id}
                              className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-semibold text-slate-200 flex items-center gap-2">
                                  <span>{booking.booking_number}</span>
                                  <span className="text-slate-500">•</span>
                                  <span>{booking.service?.name || 'Cook Service'}</span>
                                </div>
                                <div className="text-slate-400 mt-1">
                                  Customer: {booking.customer?.full_name || 'Guest'} • Date:{' '}
                                  {booking.booking_date}
                                </div>
                              </div>

                              <div className="text-right">
                                <div className="font-mono font-bold text-emerald-400">
                                  ₹{booking.total_amount}
                                </div>
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

                  {/* REVIEWS TAB */}
                  {activeTab === 'reviews' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Customer Ratings & Feedback</h3>
                      {cookProfile.reviews.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4">No reviews submitted for this cook yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {cookProfile.reviews.map((rev) => (
                            <div key={rev.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-semibold text-slate-200">
                                  {rev.customer?.full_name || 'Customer'}
                                </span>
                                <div className="flex items-center text-amber-400 font-bold">
                                  <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" />
                                  {rev.rating}/5
                                </div>
                              </div>
                              <p className="text-xs text-slate-300">{rev.comment || 'No comment provided.'}</p>
                              <div className="text-[10px] text-slate-500">
                                {new Date(rev.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* AUDIT LOG TAB */}
                  {activeTab === 'audit' && (
                    <div className="space-y-3">
                      <h3 className="text-sm font-bold text-slate-200">Admin Decisions Audit Trail</h3>
                      {cookProfile.auditLogs.length === 0 ? (
                        <p className="text-xs text-slate-500 py-4">No administrative actions logged for this cook.</p>
                      ) : (
                        <div className="space-y-2">
                          {cookProfile.auditLogs.map((log) => (
                            <div key={log.id} className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-blue-400 font-mono">{log.action}</span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(log.created_at).toLocaleString()}
                                </span>
                              </div>
                              {log.new_data && (
                                <pre className="text-[11px] bg-slate-900 p-2 rounded text-slate-400 overflow-x-auto font-mono">
                                  {JSON.stringify(log.new_data, null, 2)}
                                </pre>
                              )}
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

      {/* ACTION MODAL DIALOG */}
      {actionModal.type && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                {actionModal.type === 'approve' && 'Approve Cook Verification'}
                {actionModal.type === 'reject' && 'Reject Cook Verification'}
                {actionModal.type === 'request_docs' && 'Request Additional Documents'}
                {actionModal.type === 'suspend' && 'Suspend Cook Account'}
                {actionModal.type === 'reactivate' && 'Reactivate Cook Account'}
              </h3>
              <button
                onClick={() => setActionModal({ type: null, cookId: null, cookName: '' })}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Target Cook: <span className="font-bold text-white">{actionModal.cookName}</span>
            </p>

            {(actionModal.type === 'reject' ||
              actionModal.type === 'suspend' ||
              actionModal.type === 'request_docs') && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">
                  {actionModal.type === 'request_docs'
                    ? 'Notes on missing / required documents:'
                    : 'Reason for action:'}
                </label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  placeholder="Enter details for audit trail..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 h-24"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActionModal({ type: null, cookId: null, cookName: '' })}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteAction}
                disabled={actionLoading}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 ${
                  actionModal.type === 'approve' || actionModal.type === 'reactivate'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : actionModal.type === 'request_docs'
                    ? 'bg-amber-600 hover:bg-amber-500'
                    : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
