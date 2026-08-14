'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  UserPlus,
  XCircle,
  Clock,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  MapPin,
  User,
  ChefHat,
  Phone,
  Layers,
  ChevronLeft,
  ChevronRight,
  Printer,
  MessageSquare,
  Eye,
  SlidersHorizontal,
  DollarSign,
  ArrowUpDown,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface CustomerProfile {
  full_name?: string;
  phone?: string;
  email?: string;
}

interface CookProfile {
  full_name?: string;
  phone?: string;
}

interface ServiceData {
  id: string;
  name: string;
  category: string;
}

interface AddressData {
  house_number?: string;
  street?: string;
  locality?: string;
  pincode?: string;
  city_id?: string;
}

interface BookingRecord {
  id: string;
  booking_number: string;
  customer_id: string;
  cook_id: string | null;
  service_id: string;
  address_id: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  guest_count: number;
  cooking_notes: string | null;
  status: string;
  hourly_rate: number;
  subtotal: number;
  discount_amount: number;
  tax_amount: number;
  platform_fee: number;
  total_amount: number;
  created_at: string;
  customer?: CustomerProfile;
  cook?: CookProfile;
  services?: ServiceData;
  addresses?: AddressData;
}

interface DetailedBooking extends BookingRecord {
  booking_timeline?: { id: string; event_title: string; event_description: string | null; created_at: string }[];
  booking_history?: { id: string; old_status: string | null; new_status: string; changed_by: string | null; remarks: string | null; created_at: string }[];
  booking_cancellations?: { id: string; cancelled_by: string | null; reason: string | null; refund_required: boolean; cancelled_at: string }[];
  notes?: { id: string; note: string; created_at: string; author?: { full_name?: string } }[];
}

interface CookOption {
  id: string;
  full_name: string | null;
  phone: string | null;
  cook_details?: { is_verified?: boolean }[] | { is_verified?: boolean };
}

export default function AdminBookingsPage() {
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [cooks, setCooks] = useState<CookOption[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [cities, setCities] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

  // Selection for export
  const [selectedBookingIds, setSelectedBookingIds] = useState<Set<string>>(new Set());

  // Modal / Drawer state
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [detailedBooking, setDetailedBooking] = useState<DetailedBooking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Action Modals
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedCookId, setSelectedCookId] = useState('');

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [overrideStatus, setOverrideStatus] = useState('accepted');
  const [statusRemarks, setStatusRemarks] = useState('');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const [newNote, setNewNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Fetch all bookings
  const fetchBookings = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/bookings');
      if (!res.ok) throw new Error('Failed to load bookings');
      const data = await res.json();
      setBookings(data.data?.bookings || []);
      setCooks(data.data?.cooks || []);
      setServices(data.data?.services || []);
      setCities(data.data?.cities || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      if (!ignore) {
        await fetchBookings();
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, [fetchBookings]);

  // Auto Refresh Interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchBookings(true);
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchBookings]);

  // Fetch Booking Details when Drawer opens
  const openDetails = async (id: string) => {
    setSelectedBookingId(id);
    setDetailLoading(true);
    setActionSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/bookings/${id}`);
      if (!res.ok) throw new Error('Failed to fetch details');
      const data = await res.json();
      setDetailedBooking(data.data?.booking || null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to load details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Filtered & Searched Data
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = b.booking_number?.toLowerCase().includes(q);
        const matchesCustomer = b.customer?.full_name?.toLowerCase().includes(q);
        const matchesCook = b.cook?.full_name?.toLowerCase().includes(q);
        const matchesPhone =
          b.customer?.phone?.includes(q) || b.cook?.phone?.includes(q);

        if (!matchesNumber && !matchesCustomer && !matchesCook && !matchesPhone) {
          return false;
        }
      }

      // Status Filter
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false;
      }

      // Service Filter
      if (serviceFilter !== 'all' && b.service_id !== serviceFilter) {
        return false;
      }

      // City Filter
      if (cityFilter !== 'all' && b.addresses?.city_id !== cityFilter) {
        return false;
      }

      // Date Range Filter
      if (startDate && b.booking_date < startDate) return false;
      if (endDate && b.booking_date > endDate) return false;

      return true;
    }).sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
  }, [bookings, searchQuery, statusFilter, serviceFilter, cityFilter, startDate, endDate, sortOrder]);

  // Paginated Data
  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage) || 1;
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBookings.slice(start, start + itemsPerPage);
  }, [filteredBookings, currentPage, itemsPerPage]);

  // Select all handler
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedBookingIds(new Set(paginatedBookings.map((b) => b.id)));
    } else {
      setSelectedBookingIds(new Set());
    }
  };

  const handleSelectOne = (id: string) => {
    const next = new Set(selectedBookingIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedBookingIds(next);
  };

  // Export helper
  const handleExport = (format: 'xlsx' | 'csv', mode: 'filtered' | 'all') => {
    const params = new URLSearchParams();
    params.set('type', 'bookings');
    params.set('format', format);

    if (mode === 'filtered') {
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (serviceFilter !== 'all') params.set('serviceId', serviceFilter);
      if (cityFilter !== 'all') params.set('cityId', cityFilter);
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
    }

    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  // Actions
  const handleAssignCook = async () => {
    if (!selectedBookingId || !selectedCookId) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'assign_cook', cook_id: selectedCookId }),
      });
      if (!res.ok) throw new Error('Failed to assign cook');
      setActionSuccessMsg('Cook assigned successfully!');
      setAssignModalOpen(false);
      fetchBookings(true);
      openDetails(selectedBookingId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error assigning cook');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedBookingId) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_status', status: overrideStatus, remarks: statusRemarks }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setActionSuccessMsg('Booking status updated!');
      setStatusModalOpen(false);
      setStatusRemarks('');
      fetchBookings(true);
      openDetails(selectedBookingId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error updating status');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!selectedBookingId || !cancelReason) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason }),
      });
      if (!res.ok) throw new Error('Failed to cancel booking');
      setActionSuccessMsg('Booking cancelled successfully');
      setCancelModalOpen(false);
      setCancelReason('');
      fetchBookings(true);
      openDetails(selectedBookingId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error cancelling booking');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !newNote.trim()) return;
    setSubmittingAction(true);
    try {
      const res = await fetch(`/api/admin/bookings/${selectedBookingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add_note', note: newNote }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      setNewNote('');
      openDetails(selectedBookingId);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error adding note');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handlePrintInvoice = () => {
    if (!detailedBooking) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html lang="en">
        <head>
          <title>TIZL Invoice - ${detailedBooking.booking_number}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #334155; padding-bottom: 20px; }
            .title { font-size: 24px; font-weight: bold; color: #2563eb; }
            .table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            .table th, .table td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
            .table th { background-color: #f8fafc; }
            .total { text-align: right; margin-top: 20px; font-size: 18px; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">TIZL COOKING SERVICES</div>
              <div>Official Operations Invoice</div>
            </div>
            <div>
              <strong>Invoice #:</strong> ${detailedBooking.booking_number}<br/>
              <strong>Date:</strong> ${new Date(detailedBooking.created_at).toLocaleDateString()}
            </div>
          </div>
          <div style="margin-top:20px;">
            <p><strong>Customer:</strong> ${detailedBooking.customer?.full_name || 'N/A'} (${detailedBooking.customer?.phone || 'N/A'})</p>
            <p><strong>Assigned Cook:</strong> ${detailedBooking.cook?.full_name || 'Unassigned'}</p>
            <p><strong>Service Date:</strong> ${detailedBooking.booking_date} at ${detailedBooking.start_time}</p>
          </div>
          <table class="table">
            <thead>
              <tr>
                <th>Item Description</th>
                <th>Hours</th>
                <th>Rate</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>${detailedBooking.services?.name || 'Cook Service'}</td>
                <td>${detailedBooking.duration_hours} hrs</td>
                <td>₹${detailedBooking.hourly_rate}/hr</td>
                <td>₹${detailedBooking.subtotal}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align:right;">Tax Amount</td>
                <td>₹${detailedBooking.tax_amount}</td>
              </tr>
              <tr>
                <td colspan="3" style="text-align:right;">Platform Fee</td>
                <td>₹${detailedBooking.platform_fee}</td>
              </tr>
            </tbody>
          </table>
          <div class="total">Total Paid: ₹${detailedBooking.total_amount}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Status Badge Styling Helper
  const renderStatusBadge = (status: string) => {
    const map: Record<string, { label: string; bg: string; text: string }> = {
      pending_confirmation: { label: 'Pending', bg: 'bg-amber-500/10', text: 'text-amber-400 border-amber-500/20' },
      searching: { label: 'Searching', bg: 'bg-blue-500/10', text: 'text-blue-400 border-blue-500/20' },
      cook_assigned: { label: 'Assigned', bg: 'bg-indigo-500/10', text: 'text-indigo-400 border-indigo-500/20' },
      cook_arriving: { label: 'Arriving', bg: 'bg-purple-500/10', text: 'text-purple-400 border-purple-500/20' },
      cooking: { label: 'Cooking', bg: 'bg-cyan-500/10', text: 'text-cyan-400 border-cyan-500/20' },
      completed: { label: 'Completed', bg: 'bg-emerald-500/10', text: 'text-emerald-400 border-emerald-500/20' },
      cancelled: { label: 'Cancelled', bg: 'bg-red-500/10', text: 'text-red-400 border-red-500/20' },
    };

    const conf = map[status] || { label: status, bg: 'bg-slate-800', text: 'text-slate-300 border-slate-700' };
    return (
      <span
        className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${conf.bg} ${conf.text} capitalize`}
      >
        {conf.label}
      </span>
    );
  };

  // Grouped Kanban Columns
  const kanbanColumns = [
    { key: 'pending_confirmation', title: 'Pending' },
    { key: 'searching', title: 'Searching' },
    { key: 'cook_assigned', title: 'Assigned' },
    { key: 'cook_arriving', title: 'Arriving' },
    { key: 'cooking', title: 'Cooking' },
    { key: 'completed', title: 'Completed' },
    { key: 'cancelled', title: 'Cancelled' },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header & View Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">Booking Management</h1>
            <span className="px-2.5 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full border border-blue-500/30">
              {filteredBookings.length} Total Bookings
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Primary operations terminal to search, assign cooks, override statuses, and audit orders
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'table' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Operations Board
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              autoRefresh
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'
              }`}
            ></span>
            <span>{autoRefresh ? 'Live Sync Active (20s)' : 'Auto Sync Off'}</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchBookings()}
            disabled={refreshing}
            className="p-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors disabled:opacity-50"
            title="Refresh Table"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          {/* Export Dropdown */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('xlsx', 'filtered')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-emerald-400 rounded-lg transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => handleExport('csv', 'filtered')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-medium text-blue-400 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter & Search Toolbar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ID, Name, Phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending_confirmation">Pending Confirmation</option>
            <option value="searching">Searching Cook</option>
            <option value="cook_assigned">Cook Assigned</option>
            <option value="cook_arriving">Cook Arriving</option>
            <option value="cooking">Cooking</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Service Filter */}
          <select
            value={serviceFilter}
            onChange={(e) => setServiceFilter(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Services</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.category})
              </option>
            ))}
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
            className="px-3 py-2 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
          </select>
        </div>

        {/* Date Range & City Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/60 text-xs">
          <span className="text-slate-400 font-medium flex items-center gap-1">
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Date Range:</span>
          </span>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-md focus:outline-none"
          />
          <span className="text-slate-500">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-md focus:outline-none"
          />

          {(searchQuery || statusFilter !== 'all' || serviceFilter !== 'all' || startDate || endDate) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setServiceFilter('all');
                setStartDate('');
                setEndDate('');
              }}
              className="ml-auto text-blue-400 hover:text-blue-300 font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* VIEW MODE: TABLE */}
      {viewMode === 'table' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={
                        paginatedBookings.length > 0 &&
                        paginatedBookings.every((b) => selectedBookingIds.has(b.id))
                      }
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                    />
                  </th>
                  <th className="p-4 font-semibold">Booking ID</th>
                  <th className="p-4 font-semibold">Customer</th>
                  <th className="p-4 font-semibold">Cook</th>
                  <th className="p-4 font-semibold">Service & Date</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-right">Amount</th>
                  <th className="p-4 font-semibold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                        <span>Fetching live bookings from Supabase...</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400">
                      <div className="max-w-xs mx-auto space-y-2">
                        <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                        <p className="font-semibold text-slate-300">No bookings found</p>
                        <p className="text-xs text-slate-500">
                          Try adjusting your search queries or date filters.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking) => {
                    const isSelected = selectedBookingIds.has(booking.id);
                    return (
                      <tr
                        key={booking.id}
                        className={`hover:bg-slate-800/50 transition-colors ${
                          isSelected ? 'bg-blue-950/20' : ''
                        }`}
                      >
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectOne(booking.id)}
                            className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-0"
                          />
                        </td>
                        <td className="p-4 font-mono font-medium text-white">
                          {booking.booking_number}
                          <div className="text-[10px] text-slate-500 font-sans">
                            {new Date(booking.created_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-200">
                            {booking.customer?.full_name || 'Anonymous Customer'}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{booking.customer?.phone || 'No phone'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          {booking.cook?.full_name ? (
                            <div className="flex items-center gap-1.5 text-slate-200 font-medium">
                              <ChefHat className="w-4 h-4 text-emerald-400 shrink-0" />
                              <span>{booking.cook.full_name}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-400 italic">
                              Unassigned
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-slate-200">
                            {booking.services?.name || 'Cook Service'}
                          </div>
                          <div className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{booking.booking_date} at {booking.start_time}</span>
                          </div>
                        </td>
                        <td className="p-4">{renderStatusBadge(booking.status)}</td>
                        <td className="p-4 text-right font-semibold text-white">
                          ₹{booking.total_amount}
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => openDetails(booking.id)}
                            className="p-1.5 bg-blue-600/10 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors border border-blue-500/20"
                            title="View Full Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-900 border border-slate-800 text-slate-200 px-2 py-1 rounded"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>entries per page (Total {filteredBookings.length})</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-slate-900 border border-slate-800 rounded disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW MODE: KANBAN LIVE OPERATIONS BOARD */}
      {viewMode === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-3 overflow-x-auto pb-4">
          {kanbanColumns.map((col) => {
            const columnBookings = filteredBookings.filter((b) => b.status === col.key);
            return (
              <div
                key={col.key}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-3 flex flex-col min-w-[240px]"
              >
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                  <h3 className="font-semibold text-xs text-slate-300 uppercase tracking-wider">
                    {col.title}
                  </h3>
                  <span className="px-2 py-0.5 bg-slate-800 text-slate-400 font-bold text-xs rounded-full">
                    {columnBookings.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {columnBookings.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-600 border border-dashed border-slate-800 rounded-lg">
                      Empty
                    </div>
                  ) : (
                    columnBookings.map((b) => (
                      <div
                        key={b.id}
                        onClick={() => openDetails(b.id)}
                        className="p-3 bg-slate-950 hover:bg-slate-800/80 border border-slate-800 rounded-lg space-y-2 cursor-pointer transition-colors shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-400">
                            {b.booking_number}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            ₹{b.total_amount}
                          </span>
                        </div>

                        <div className="text-xs font-medium text-slate-200 truncate">
                          {b.customer?.full_name || 'Customer'}
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <ChefHat className="w-3 h-3 text-emerald-400 shrink-0" />
                          <span className="truncate">{b.cook?.full_name || 'Unassigned'}</span>
                        </div>

                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-900 flex justify-between">
                          <span>{b.booking_date}</span>
                          <span>{b.start_time}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* BOOKING DETAILS DRAWER / MODAL */}
      {selectedBookingId && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right">
            {/* Drawer Header */}
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white font-mono">
                    {detailedBooking?.booking_number || 'Loading Booking...'}
                  </h2>
                  {detailedBooking && renderStatusBadge(detailedBooking.status)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full Operations Audit & Action History
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintInvoice}
                  disabled={!detailedBooking}
                  className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                  title="Print Invoice"
                >
                  <Printer className="w-4 h-4" />
                  <span>Invoice</span>
                </button>
                <button
                  onClick={() => setSelectedBookingId(null)}
                  className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {actionSuccessMsg && (
              <div className="mx-5 mt-4 p-3 bg-emerald-950/50 border border-emerald-800 text-emerald-300 rounded-lg text-xs font-medium flex items-center justify-between">
                <span>{actionSuccessMsg}</span>
                <button onClick={() => setActionSuccessMsg(null)}>
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {detailLoading ? (
                <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Loading full record...</span>
                </div>
              ) : detailedBooking ? (
                <>
                  {/* Action Quick Bar */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-wrap gap-2.5">
                    <button
                      onClick={() => setAssignModalOpen(true)}
                      className="flex-1 min-w-[140px] px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Assign / Reassign Cook</span>
                    </button>

                    <button
                      onClick={() => setStatusModalOpen(true)}
                      className="flex-1 min-w-[140px] px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Override Status</span>
                    </button>

                    <button
                      onClick={() => setCancelModalOpen(true)}
                      className="px-3 py-2 bg-red-950/40 hover:bg-red-900/50 text-red-400 border border-red-800/60 text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Cancel Order</span>
                    </button>
                  </div>

                  {/* Customer & Cook Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Customer Info */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800/80 pb-2">
                        <User className="w-3.5 h-3.5 text-blue-400" />
                        <span>Customer Profile</span>
                      </div>
                      <div className="font-semibold text-white">
                        {detailedBooking.customer?.full_name || 'N/A'}
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>Phone: {detailedBooking.customer?.phone || 'N/A'}</p>
                        <p>Email: {detailedBooking.customer?.email || 'N/A'}</p>
                      </div>
                    </div>

                    {/* Cook Info */}
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase text-slate-400 border-b border-slate-800/80 pb-2">
                        <ChefHat className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Assigned Cook</span>
                      </div>
                      <div className="font-semibold text-white">
                        {detailedBooking.cook?.full_name || 'No Cook Assigned'}
                      </div>
                      <div className="text-xs text-slate-400 space-y-1">
                        <p>Phone: {detailedBooking.cook?.phone || 'N/A'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Service & Financials */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 border-b border-slate-800/80 pb-2">
                      Service & Financial Breakdown
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block">Service</span>
                        <span className="font-medium text-slate-200">
                          {detailedBooking.services?.name || 'Cook Service'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Date & Time</span>
                        <span className="font-medium text-slate-200">
                          {detailedBooking.booking_date} ({detailedBooking.start_time})
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Subtotal</span>
                        <span className="font-medium text-slate-200">₹{detailedBooking.subtotal}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Total Paid</span>
                        <span className="font-bold text-emerald-400">₹{detailedBooking.total_amount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Operational Timeline */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 border-b border-slate-800/80 pb-2">
                      Audit Timeline History
                    </h3>
                    <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800 pl-6">
                      {detailedBooking.booking_timeline && detailedBooking.booking_timeline.length > 0 ? (
                        detailedBooking.booking_timeline.map((event) => (
                          <div key={event.id} className="relative text-xs space-y-0.5">
                            <span className="absolute -left-6 top-1 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-slate-950"></span>
                            <div className="font-medium text-slate-200">{event.event_title}</div>
                            {event.event_description && (
                              <div className="text-slate-400">{event.event_description}</div>
                            )}
                            <div className="text-[10px] text-slate-500">
                              {new Date(event.created_at).toLocaleString()}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No timeline events recorded.</p>
                      )}
                    </div>
                  </div>

                  {/* Operational Internal Notes */}
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                    <h3 className="text-xs font-semibold uppercase text-slate-400 border-b border-slate-800/80 pb-2">
                      Internal Admin Notes
                    </h3>

                    <form onSubmit={handleAddNote} className="flex gap-2">
                      <input
                        type="text"
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        placeholder="Add staff comment..."
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="submit"
                        disabled={submittingAction || !newNote.trim()}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                      >
                        Add
                      </button>
                    </form>

                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {detailedBooking.notes && detailedBooking.notes.length > 0 ? (
                        detailedBooking.notes.map((n) => (
                          <div key={n.id} className="p-2.5 bg-slate-900 rounded-lg text-xs space-y-1">
                            <div className="text-slate-300">{n.note}</div>
                            <div className="text-[10px] text-slate-500 flex justify-between">
                              <span>By {n.author?.full_name || 'Staff Admin'}</span>
                              <span>{new Date(n.created_at).toLocaleTimeString()}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-slate-500">No notes added yet.</p>
                      )}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN COOK MODAL */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Assign / Reassign Cook</h3>
              <button onClick={() => setAssignModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Select Verified Cook</label>
              <select
                value={selectedCookId}
                onChange={(e) => setSelectedCookId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Cook --</option>
                {cooks.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name || 'Cook'} ({c.phone || 'No phone'})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setAssignModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignCook}
                disabled={submittingAction || !selectedCookId}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OVERRIDE STATUS MODAL */}
      {statusModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-white">Override Booking Status</h3>
              <button onClick={() => setStatusModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-300">New Status</label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value)}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500"
                >
                  <option value="pending_confirmation">Pending Confirmation</option>
                  <option value="searching">Searching</option>
                  <option value="cook_assigned">Cook Assigned</option>
                  <option value="cook_arriving">Cook Arriving</option>
                  <option value="cooking">Cooking</option>
                  <option value="completed">Completed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-300">Remarks / Operational Note</label>
                <input
                  type="text"
                  value={statusRemarks}
                  onChange={(e) => setStatusRemarks(e.target.value)}
                  placeholder="Reason for manual override..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setStatusModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={submittingAction}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Apply Override
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CANCEL MODAL */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-base text-red-400">Cancel Booking</h3>
              <button onClick={() => setCancelModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300">Cancellation Reason</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Enter detailed reason for order cancellation..."
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-lg focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-lg"
              >
                Dismiss
              </button>
              <button
                onClick={handleCancelBooking}
                disabled={submittingAction || !cancelReason.trim()}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-medium rounded-lg disabled:opacity-50"
              >
                Cancel Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
