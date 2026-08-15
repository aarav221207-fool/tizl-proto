'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  CreditCard,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ArrowUpDown,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Info,
} from 'lucide-react';

interface PaymentItem {
  id: string;
  booking_id: string | null;
  customer_id: string | null;
  provider: string;
  provider_order_id: string | null;
  provider_payment_id: string | null;
  bank_txn_id: string | null;
  amount: number;
  currency: string;
  status: 'pending' | 'captured' | 'failed' | 'refunded';
  method: string | null;
  created_at: string;
  updated_at: string;
  raw_response?: Record<string, unknown> | null;
  customer?: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  booking?: {
    id: string;
    booking_number: string;
    booking_date: string;
    total_amount: number;
    status: string;
    services?: { name: string } | null;
  } | null;
}

interface PaymentSummary {
  totalTransactions: number;
  totalVolume: number;
  capturedCount: number;
  capturedAmount: number;
  pendingCount: number;
  failedCount: number;
  refundCount: number;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [summary, setSummary] = useState<PaymentSummary>({
    totalTransactions: 0,
    totalVolume: 0,
    capturedCount: 0,
    capturedAmount: 0,
    pendingCount: 0,
    failedCount: 0,
    refundCount: 0,
  });
  const [isPaytmConfigured, setIsPaytmConfigured] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'amount_desc' | 'amount_asc'>('newest');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Detail Modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);

  const fetchPayments = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payments');
      if (!res.ok) throw new Error('Failed to load payment transactions');
      const data = await res.json();
      const payload = data.data || data;
      setPayments(payload.payments || []);
      if (payload.summary) setSummary(payload.summary);
      setIsPaytmConfigured(Boolean(payload.isPaytmConfigured));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching payments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      if (!ignore) {
        await fetchPayments();
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    return payments
      .filter((p) => {
        if (statusFilter !== 'all' && p.status !== statusFilter) return false;
        if (providerFilter !== 'all' && p.provider?.toLowerCase() !== providerFilter.toLowerCase()) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const orderMatch = p.provider_order_id?.toLowerCase().includes(q);
          const txnMatch = p.bank_txn_id?.toLowerCase().includes(q) || p.provider_payment_id?.toLowerCase().includes(q);
          const customerMatch = p.customer?.full_name?.toLowerCase().includes(q) || p.customer?.email?.toLowerCase().includes(q) || p.customer?.phone?.toLowerCase().includes(q);
          const bookingMatch = p.booking?.booking_number?.toLowerCase().includes(q);
          if (!orderMatch && !txnMatch && !customerMatch && !bookingMatch) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        if (sortOrder === 'amount_desc') return (Number(b.amount) || 0) - (Number(a.amount) || 0);
        if (sortOrder === 'amount_asc') return (Number(a.amount) || 0) - (Number(b.amount) || 0);
        return 0;
      });
  }, [payments, statusFilter, providerFilter, searchQuery, sortOrder]);

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPayments.slice(start, start + itemsPerPage);
  }, [filteredPayments, currentPage, itemsPerPage]);

  const handleExport = () => {
    const params = new URLSearchParams();
    params.set('type', 'payments');
    if (statusFilter !== 'all') params.set('status', statusFilter);
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'captured':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" /> Captured
          </span>
        );
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" /> Pending
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RefreshCw className="w-3.5 h-3.5" /> Refunded
          </span>
        );
      case 'failed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" /> Failed
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payment Transactions</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time ledger of all payments, provider order tokens, and settlement statuses.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchPayments()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Gateway Configuration Banner */}
      {!isPaytmConfigured ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <p className="font-semibold">Paytm Payment Gateway: Not Configured</p>
            <p className="text-amber-700 mt-0.5 text-xs">
              Live transactions require <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">PAYTM_MID</code> and <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">PAYTM_MERCHANT_KEY</code> configured in environment variables. Existing database payment records remain fully viewable.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-900">
            <p className="font-semibold">Paytm Payment Gateway: Configured & Live</p>
            <p className="text-emerald-700 mt-0.5 text-xs">
              Direct checkout and UPI intent generation are connected to production credentials.
            </p>
          </div>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
            <span>Total Captured Revenue</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary.capturedAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.capturedCount} successful transactions
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
            <span>Total Volume</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ₹{summary.totalVolume.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Across {summary.totalTransactions} total attempts
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
            <span>Pending Settlements</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{summary.pendingCount}</div>
          <div className="text-xs text-slate-500 mt-1">Awaiting provider callback</div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-sm mb-2">
            <span>Refunded / Failed</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary.failedCount + summary.refundCount}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.refundCount} refunds, {summary.failedCount} failures
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search Order ID, Customer, Txn..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-700"
            >
              <option value="all">All Statuses</option>
              <option value="captured">Captured (Success)</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          {/* Provider Filter */}
          <div>
            <select
              value={providerFilter}
              onChange={(e) => {
                setProviderFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-700"
            >
              <option value="all">All Providers</option>
              <option value="paytm">Paytm</option>
              <option value="upi">Direct UPI</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as typeof sortOrder)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-all text-slate-700"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="amount_desc">Highest Amount</option>
              <option value="amount_asc">Lowest Amount</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-3 text-slate-400" />
            <p className="text-sm font-medium">Loading transactions...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-rose-600">
            <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-rose-500" />
            <p className="font-semibold text-base">{error}</p>
            <button
              onClick={() => fetchPayments()}
              className="mt-4 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Retry
            </button>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <CreditCard className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-base font-semibold text-slate-700">No payment records found</p>
            <p className="text-sm text-slate-500 mt-1">
              {searchQuery || statusFilter !== 'all' || providerFilter !== 'all'
                ? 'Try adjusting your filters or search query.'
                : 'Customer transactions will appear here automatically when payments are initiated.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Order / Txn ID</th>
                  <th className="px-5 py-3.5">Customer</th>
                  <th className="px-5 py-3.5">Booking</th>
                  <th className="px-5 py-3.5">Amount</th>
                  <th className="px-5 py-3.5">Provider / Mode</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono text-xs">
                      <div className="font-semibold text-slate-900">{p.provider_order_id || p.id.slice(0, 12)}</div>
                      {p.bank_txn_id && (
                        <div className="text-[11px] text-slate-400 mt-0.5">Bank: {p.bank_txn_id}</div>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {p.customer ? (
                        <div>
                          <div className="font-medium text-slate-900">{p.customer.full_name || 'Anonymous'}</div>
                          <div className="text-xs text-slate-500">{p.customer.email || p.customer.phone || 'No contact'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs">Customer #{p.customer_id?.slice(0, 8) || 'N/A'}</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      {p.booking ? (
                        <div>
                          <div className="font-semibold text-slate-800">{p.booking.booking_number}</div>
                          <div className="text-slate-500">{p.booking.services?.name || 'Standard Service'}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Direct Payment</span>
                      )}
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-900">
                      ₹{Number(p.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-xs">
                      <span className="font-medium uppercase text-slate-800">{p.provider || 'Paytm'}</span>
                      <div className="text-slate-400">{p.method || 'UPI / NetBanking'}</div>
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(p.status)}</td>
                    <td className="px-5 py-4 text-xs text-slate-500">
                      {new Date(p.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => setSelectedPayment(p)}
                        className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && filteredPayments.length > 0 && (
          <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="font-semibold text-slate-700">
                {Math.min(currentPage * itemsPerPage, filteredPayments.length)}
              </span>{' '}
              of <span className="font-semibold text-slate-700">{filteredPayments.length}</span> transactions
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 py-1 font-medium text-slate-700">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-slate-700" />
                <h3 className="font-semibold text-slate-900">Transaction Details</h3>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto text-sm text-slate-700">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500">Status</span>
                <div>{getStatusBadge(selectedPayment.status)}</div>
              </div>

              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span className="text-slate-500">Amount</span>
                <span className="text-lg font-bold text-slate-900">
                  ₹{Number(selectedPayment.amount).toLocaleString('en-IN')} {selectedPayment.currency}
                </span>
              </div>

              <div className="space-y-1 pb-3 border-b border-slate-100">
                <span className="text-slate-500 text-xs uppercase font-semibold">Order ID</span>
                <p className="font-mono text-xs text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 break-all">
                  {selectedPayment.provider_order_id || 'N/A'}
                </p>
              </div>

              {selectedPayment.bank_txn_id && (
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <span className="text-slate-500 text-xs uppercase font-semibold">Bank Txn ID</span>
                  <p className="font-mono text-xs text-slate-900 bg-slate-50 p-2 rounded border border-slate-200 break-all">
                    {selectedPayment.bank_txn_id}
                  </p>
                </div>
              )}

              {selectedPayment.customer && (
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <span className="text-slate-500 text-xs uppercase font-semibold">Customer</span>
                  <p className="font-medium text-slate-900">{selectedPayment.customer.full_name || 'N/A'}</p>
                  <p className="text-xs text-slate-500">{selectedPayment.customer.email || selectedPayment.customer.phone || 'No contact'}</p>
                </div>
              )}

              {selectedPayment.booking && (
                <div className="space-y-1 pb-3 border-b border-slate-100">
                  <span className="text-slate-500 text-xs uppercase font-semibold">Associated Booking</span>
                  <p className="font-medium text-slate-900">{selectedPayment.booking.booking_number}</p>
                  <p className="text-xs text-slate-500">Service: {selectedPayment.booking.services?.name || 'Cooking Service'}</p>
                </div>
              )}

              <div className="space-y-1">
                <span className="text-slate-500 text-xs uppercase font-semibold">Timestamps</span>
                <p className="text-xs text-slate-600">Created: {new Date(selectedPayment.created_at).toLocaleString('en-IN')}</p>
                <p className="text-xs text-slate-600">Updated: {new Date(selectedPayment.updated_at).toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedPayment(null)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
