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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPaytmConfigured, setIsPaytmConfigured] = useState(false);
  const [adminUser, setAdminUser] = useState<{ id: string; email: string; designation?: string } | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'captured' | 'pending' | 'failed' | 'refunded'>('all');

  // Modal / Detail state
  const [selectedPayment, setSelectedPayment] = useState<PaymentItem | null>(null);
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundMessage, setRefundMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/payments');
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to fetch payments');
      }
      setPayments(data.data.payments || []);
      setSummary(data.data.summary);
      setIsPaytmConfigured(data.data.isPaytmConfigured);
      setAdminUser(data.data.adminUser);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        p.provider_order_id?.toLowerCase().includes(term) ||
        p.provider_payment_id?.toLowerCase().includes(term) ||
        p.booking?.booking_number?.toLowerCase().includes(term) ||
        p.customer?.full_name?.toLowerCase().includes(term) ||
        p.customer?.email?.toLowerCase().includes(term)
      );
    });
  }, [payments, statusFilter, searchTerm]);

  const handleOpenRefund = (payment: PaymentItem) => {
    setSelectedPayment(payment);
    setRefundAmount(String(payment.amount));
    setRefundReason('Customer requested cancellation');
    setRefundMessage(null);
    setRefundModalOpen(true);
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment?.booking_id) return;
    setRefundLoading(true);
    setRefundMessage(null);
    try {
      const res = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: selectedPayment.booking_id,
          amount: parseFloat(refundAmount),
          reason: refundReason,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error?.message || 'Failed to initiate refund');
      }
      setRefundMessage({
        type: 'success',
        text: `Refund initiated successfully. Ref ID: ${data.data?.refund?.refundId || 'Processed'}`,
      });
      fetchPayments();
      setTimeout(() => {
        setRefundModalOpen(false);
      }, 1500);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setRefundMessage({ type: 'error', text: msg });
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-neutral-200">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral-900">Payment Gateway Reconciliation</h1>
                <p className="text-xs text-neutral-500">
                  Paytm PG &middot; Server-to-Server Transactions &middot; Live Status Sync
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                isPaytmConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isPaytmConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {isPaytmConfigured ? 'Paytm PG Configured' : 'Paytm Pending Setup'}
            </span>
            <button
              onClick={() => fetchPayments()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync
            </button>
          </div>
        </div>

        {/* Metrics Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-xs font-medium text-neutral-500">Total Volume</span>
            <div className="text-2xl font-bold text-neutral-900 mt-1">₹{summary.totalVolume.toLocaleString('en-IN')}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{summary.totalTransactions} transactions</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-xs font-medium text-emerald-600">Captured Volume</span>
            <div className="text-2xl font-bold text-emerald-700 mt-1">₹{summary.capturedAmount.toLocaleString('en-IN')}</div>
            <div className="text-xs text-emerald-600/80 mt-0.5">{summary.capturedCount} succeeded</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-xs font-medium text-amber-600">Pending Authorization</span>
            <div className="text-2xl font-bold text-amber-700 mt-1">{summary.pendingCount}</div>
            <div className="text-xs text-neutral-400 mt-0.5">Awaiting gateway callback</div>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-sm">
            <span className="text-xs font-medium text-rose-600">Failed / Refunded</span>
            <div className="text-2xl font-bold text-rose-700 mt-1">{summary.failedCount + summary.refundCount}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{summary.refundCount} refunded &middot; {summary.failedCount} failed</div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Order ID, Txn ID, or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto">
            {(['all', 'captured', 'pending', 'failed', 'refunded'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? 'bg-neutral-900 text-white shadow-sm'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white rounded-2xl border border-neutral-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3.5 px-4">Paytm Order ID</th>
                  <th className="py-3.5 px-4">Booking</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Method</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-neutral-400">
                      No payment records found matching criteria
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-neutral-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium text-neutral-900">
                        {p.provider_order_id || 'N/A'}
                        {p.provider_payment_id && (
                          <span className="block text-[10px] text-neutral-400 font-normal">
                            Txn: {p.provider_payment_id}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        {p.booking?.booking_number || 'N/A'}
                        <span className="block text-[10px] text-neutral-400">
                          {p.booking?.services?.name || 'Cook Service'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-700">
                        {p.customer?.full_name || 'Guest User'}
                        <span className="block text-[10px] text-neutral-400">
                          {p.customer?.phone || p.customer?.email || ''}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-neutral-900">
                        ₹{Number(p.amount).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium capitalize border ${
                            p.status === 'captured'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : p.status === 'pending'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : p.status === 'refunded'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-600 uppercase font-mono text-[10px]">
                        {p.method || 'UPI'}
                      </td>
                      <td className="py-3 px-4 text-neutral-500 text-[11px]">
                        {new Date(p.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        {p.status === 'captured' && (
                          <button
                            onClick={() => handleOpenRefund(p)}
                            className="px-2.5 py-1 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-semibold text-[11px] transition"
                          >
                            Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      {refundModalOpen && selectedPayment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-neutral-200">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <h3 className="font-bold text-neutral-900 text-base">Initiate Paytm Refund</h3>
              <button
                onClick={() => setRefundModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Order ID
                </label>
                <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-xs font-mono text-neutral-700">
                  {selectedPayment.provider_order_id}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Refund Amount (Max ₹{selectedPayment.amount})
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedPayment.amount}
                  min="1"
                  required
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-600 block mb-1">
                  Reason for Refund
                </label>
                <textarea
                  rows={2}
                  required
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
                />
              </div>

              {refundMessage && (
                <div
                  className={`p-3 rounded-xl text-xs font-medium ${
                    refundMessage.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {refundMessage.text}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRefundModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refundLoading}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-neutral-900 text-white hover:bg-neutral-800 transition disabled:opacity-50"
                >
                  {refundLoading ? 'Processing with Paytm...' : 'Confirm Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
