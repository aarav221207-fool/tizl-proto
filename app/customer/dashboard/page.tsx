'use client';

import React, { useEffect, useState, Suspense, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { CheckCircle2, XCircle, Clock, RefreshCw, CreditCard } from 'lucide-react';

type BookingItem = {
  id: string;
  booking_number: string;
  status: string;
  booking_date: string;
  start_time: string;
  duration_hours: number;
  guest_count: number;
  total_amount: number;
  otp: string;
  cooking_notes?: string;
  services?: { name?: string; title?: string };
  cook?: { full_name: string };
};

type PaymentItem = {
  id: string;
  booking_id: string;
  provider: string;
  provider_order_id: string;
  provider_payment_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'captured' | 'failed' | 'refunded';
  method?: string;
  created_at: string;
  bookings?: {
    booking_number?: string;
    booking_date?: string;
    status?: string;
    services?: { name?: string };
  };
};

type DashboardData = {
  profile: {
    full_name: string;
    email: string;
    phone: string;
  };
  metrics: {
    totalBookings: number;
    activeBookingsCount: number;
    completedBookingsCount: number;
    totalSpent: number;
  };
  activeBookings: BookingItem[];
  recentBookings: BookingItem[];
  payments?: PaymentItem[];
};

function CustomerDashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthenticated, isLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'addresses' | 'payments' | 'support' | 'profile'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'completed'>('all');

  // Authoritative Payment Status Notification State
  const [paymentBanner, setPaymentBanner] = useState<{
    visible: boolean;
    status: 'loading' | 'success' | 'failed' | 'pending';
    message: string;
    orderId?: string;
    amount?: number;
  }>({ visible: false, status: 'loading', message: '' });

  const loadDashboardData = useCallback(async () => {
    try {
      const res = await fetch('/api/customer/dashboard');
      if (!res.ok) throw new Error('Failed to load customer dashboard');
      const json = await res.json();
      if (json.success && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('[Dashboard] Error loading data:', err);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/customer/login?redirect=/customer/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboardData();
    }
  }, [isAuthenticated, loadDashboardData]);

  // Authoritative Server-side Verification for any returning payment redirect query params
  useEffect(() => {
    const paymentParam = searchParams?.get('payment');
    const orderIdParam = searchParams?.get('orderId');

    if (orderIdParam) {
      setPaymentBanner({
        visible: true,
        status: 'loading',
        message: 'Verifying transaction status with Paytm Payment Gateway...',
        orderId: orderIdParam,
      });

      // Query authoritative server endpoint
      fetch(`/api/payments/status/${orderIdParam}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success && json.data?.payment) {
            const p = json.data.payment;
            if (p.status === 'captured') {
              setPaymentBanner({
                visible: true,
                status: 'success',
                message: `Payment of ₹${p.amount} successfully confirmed via Paytm. Your home cook is assigned!`,
                orderId: orderIdParam,
                amount: p.amount,
              });
            } else if (p.status === 'failed') {
              setPaymentBanner({
                visible: true,
                status: 'failed',
                message: 'Payment was declined or cancelled. You can retry anytime.',
                orderId: orderIdParam,
              });
            } else {
              setPaymentBanner({
                visible: true,
                status: 'pending',
                message: 'Payment is awaiting confirmation from Paytm. It will update automatically once verified.',
                orderId: orderIdParam,
              });
            }
            loadDashboardData();
          } else {
            setPaymentBanner({
              visible: true,
              status: paymentParam === 'failed' ? 'failed' : 'pending',
              message: paymentParam === 'failed' ? 'Payment could not be completed.' : 'Payment is processing.',
              orderId: orderIdParam,
            });
          }
        })
        .catch(() => {
          setPaymentBanner({
            visible: true,
            status: 'pending',
            message: 'Unable to check live gateway status. Server webhook reconciliation is monitoring this transaction.',
            orderId: orderIdParam,
          });
        });
    }
  }, [searchParams, loadDashboardData]);

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue)] mx-auto mb-4" />
          <p className="text-sm font-medium text-[var(--text-dim)]">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const allBookings = [...(data?.activeBookings || []), ...(data?.recentBookings || [])].filter(
    (item, index, self) => index === self.findIndex((b) => b.id === item.id)
  );

  const filteredBookings = allBookings.filter((b) => {
    if (bookingFilter === 'active') return b.status !== 'completed' && b.status !== 'cancelled';
    if (bookingFilter === 'completed') return b.status === 'completed';
    return true;
  });

  const nextBooking = allBookings.find((b) => b.status !== 'completed' && b.status !== 'cancelled');

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col font-sans">
      <SiteHeader onOpenBooking={() => router.push('/?book=true')} />

      <main className="dashboard open flex-1">
        <div className="wrap">
          {/* Header row */}
          <div className="dash-head">
            <div>
              <h1>
                Good day, {data?.profile?.full_name || user?.fullName?.split(' ')[0] || 'Customer'}.
              </h1>
              <p>What are we cooking today?</p>
            </div>
            <Link href="/?book=true" className="btn btn-primary">
              Book a Cook <span className="arrow">→</span>
            </Link>
          </div>

          {/* Authoritative Payment Status Banner */}
          {paymentBanner.visible && (
            <div
              className={`mt-4 p-4 rounded-xl border flex items-start justify-between gap-3 ${
                paymentBanner.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : paymentBanner.status === 'failed'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}
            >
              <div className="flex items-start gap-3">
                {paymentBanner.status === 'loading' && (
                  <RefreshCw className="w-5 h-5 animate-spin text-amber-600 mt-0.5 shrink-0" />
                )}
                {paymentBanner.status === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                )}
                {paymentBanner.status === 'failed' && (
                  <XCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                )}
                {paymentBanner.status === 'pending' && (
                  <Clock className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <h4 className="font-semibold text-sm">
                    {paymentBanner.status === 'success'
                      ? 'Payment Verified via Paytm'
                      : paymentBanner.status === 'failed'
                      ? 'Payment Declined'
                      : 'Payment Status Check'}
                  </h4>
                  <p className="text-xs mt-0.5 opacity-90">{paymentBanner.message}</p>
                  {paymentBanner.orderId && (
                    <span className="text-[11px] font-mono block mt-1 opacity-75">
                      Order: {paymentBanner.orderId}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setPaymentBanner((prev) => ({ ...prev, visible: false }))}
                className="text-xs underline opacity-75 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Next booking banner */}
          {nextBooking && (
            <div className="next-booking-card mt-6">
              <div>
                <div className="eyebrow">Upcoming cook scheduled</div>
                <h3>{nextBooking.services?.name || 'Home Cook'} · {nextBooking.booking_date}</h3>
                <div className="meta">
                  Slot: {nextBooking.start_time} · {nextBooking.guest_count} people · Booking ID: {nextBooking.booking_number}
                  {nextBooking.otp && <span> · Start OTP: <strong>{nextBooking.otp}</strong></span>}
                </div>
              </div>
              <div className="actions">
                <span className="status-badge success">Confirmed</span>
              </div>
            </div>
          )}

          {/* Grid layout */}
          <div className="dash-grid">
            {/* Sidebar navigation */}
            <div className="dash-nav">
              <button
                className={activeTab === 'bookings' ? 'on' : ''}
                onClick={() => setActiveTab('bookings')}
              >
                Bookings
              </button>
              <button
                className={activeTab === 'addresses' ? 'on' : ''}
                onClick={() => setActiveTab('addresses')}
              >
                Saved Addresses
              </button>
              <button
                className={activeTab === 'payments' ? 'on' : ''}
                onClick={() => setActiveTab('payments')}
              >
                Payments &amp; Receipts
              </button>
              <button
                className={activeTab === 'support' ? 'on' : ''}
                onClick={() => setActiveTab('support')}
              >
                Help &amp; Support
              </button>
              <button
                className={activeTab === 'profile' ? 'on' : ''}
                onClick={() => setActiveTab('profile')}
              >
                Profile &amp; Preferences
              </button>
            </div>

            {/* Main content pane */}
            <div className="dash-pane">
              {/* BOOKINGS PANE */}
              {activeTab === 'bookings' && (
                <div>
                  <div className="tab-row-dash">
                    <button
                      className={bookingFilter === 'all' ? 'on' : ''}
                      onClick={() => setBookingFilter('all')}
                    >
                      All Bookings ({allBookings.length})
                    </button>
                    <button
                      className={bookingFilter === 'active' ? 'on' : ''}
                      onClick={() => setBookingFilter('active')}
                    >
                      Active ({allBookings.filter((b) => b.status !== 'completed' && b.status !== 'cancelled').length})
                    </button>
                    <button
                      className={bookingFilter === 'completed' ? 'on' : ''}
                      onClick={() => setBookingFilter('completed')}
                    >
                      Completed ({allBookings.filter((b) => b.status === 'completed').length})
                    </button>
                  </div>

                  {filteredBookings.length === 0 ? (
                    <div className="empty-state">
                      <div className="ic">🍳</div>
                      <h3>No bookings found</h3>
                      <p style={{ marginTop: '8px' }}>
                        Book your first cook in 10 minutes. Transparent hourly pricing and instant matching.
                      </p>
                      <Link href="/?book=true" className="btn btn-primary btn-small mt-4 inline-flex">
                        Book a Cook Now
                      </Link>
                    </div>
                  ) : (
                    <div>
                      {filteredBookings.map((b) => (
                        <div key={b.id} className="booking-row">
                          <div className="left">
                            <strong>
                              {b.services?.name || 'Home Cook Service'} — {b.booking_number}
                            </strong>
                            <span>
                              {b.booking_date} at {b.start_time} · {b.guest_count} people · {b.duration_hours} hrs
                            </span>
                            {b.cooking_notes && (
                              <span style={{ display: 'block', marginTop: '2px', color: 'var(--text-faint)' }}>
                                {b.cooking_notes}
                              </span>
                            )}
                          </div>
                          <div className="actions">
                            <span
                              className={`status-badge ${
                                b.status === 'completed'
                                  ? 'success'
                                  : b.status === 'cancelled'
                                  ? 'fail'
                                  : 'pending'
                              }`}
                            >
                              {b.status.toUpperCase()}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '15px', color: 'var(--ink)' }}>
                              ₹{b.total_amount || 559}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* SAVED ADDRESSES PANE */}
              {activeTab === 'addresses' && (
                <div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Home</strong>
                      <span>B-42, Sector 62, Noida, Uttar Pradesh</span>
                    </div>
                    <div className="actions">
                      <button className="btn btn-ghost btn-small">Edit</button>
                    </div>
                  </div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Office</strong>
                      <span>Tower 3, Cyber Hub, Gurgaon, Haryana</span>
                    </div>
                    <div className="actions">
                      <button className="btn btn-ghost btn-small">Edit</button>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-small mt-2">+ Add new address</button>
                </div>
              )}

              {/* REAL PAYMENTS & RECEIPTS PANE */}
              {activeTab === 'payments' && (
                <div>
                  <div className="mb-4">
                    <h3 className="font-semibold text-base">Paytm Payment Gateway Transactions</h3>
                    <p className="text-xs text-[var(--text-dim)] mt-1">
                      Authoritative records verified directly with Paytm PG and bank networks.
                    </p>
                  </div>

                  {data?.payments && data.payments.length > 0 ? (
                    <div className="space-y-3">
                      {data.payments.map((p) => (
                        <div key={p.id} className="booking-row">
                          <div className="left">
                            <div className="flex items-center gap-2">
                              <CreditCard className="w-4 h-4 text-[var(--blue)]" />
                              <strong>
                                ₹{p.amount} · {p.method || 'Paytm PG'}
                              </strong>
                            </div>
                            <span className="text-xs text-[var(--text-dim)] block mt-0.5">
                              Order ID: <code className="font-mono text-[11px]">{p.provider_order_id}</code>
                              {p.provider_payment_id && ` · Txn: ${p.provider_payment_id}`}
                            </span>
                            <span className="text-[11px] text-[var(--text-faint)] block mt-0.5">
                              Date: {new Date(p.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                            </span>
                          </div>
                          <div className="actions">
                            <span
                              className={`status-badge ${
                                p.status === 'captured'
                                  ? 'success'
                                  : p.status === 'refunded'
                                  ? 'fail'
                                  : p.status === 'failed'
                                  ? 'fail'
                                  : 'pending'
                              }`}
                            >
                              {p.status.toUpperCase()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="empty-state">
                      <div className="ic">💳</div>
                      <h3>No payment transactions yet</h3>
                      <p style={{ marginTop: '8px' }}>
                        Transactions completed via Paytm PG (UPI, Cards, Net Banking, Wallet) will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* HELP & SUPPORT PANE */}
              {activeTab === 'support' && (
                <div>
                  <div className="dash-cards">
                    <div className="dash-card">
                      <div className="lb">Live chat</div>
                      <div className="num" style={{ fontSize: '16px' }}>Avg reply 2 min</div>
                    </div>
                    <div className="dash-card">
                      <div className="lb">Call support</div>
                      <div className="num" style={{ fontSize: '16px' }}>+91 95820 72540</div>
                    </div>
                    <div className="dash-card">
                      <div className="lb">WhatsApp</div>
                      <div className="num" style={{ fontSize: '16px' }}>Message us</div>
                    </div>
                  </div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Refund request</strong>
                      <span>Track an existing refund or billing dispute</span>
                    </div>
                    <div className="actions">
                      <button className="btn btn-ghost btn-small">Check status</button>
                    </div>
                  </div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Emergency contact</strong>
                      <span>Urgent safety concern during a live cooking session</span>
                    </div>
                    <div className="actions">
                      <a href="tel:+919582072540" className="btn btn-primary btn-small">
                        Call now
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* PROFILE PANE */}
              {activeTab === 'profile' && (
                <div className="review-card">
                  <div className="review-row">
                    <span className="k">Name</span>
                    <span className="v">{data?.profile?.full_name || user?.fullName || 'Customer'}</span>
                  </div>
                  <div className="review-row">
                    <span className="k">Email</span>
                    <span className="v">{data?.profile?.email || user?.email}</span>
                  </div>
                  <div className="review-row">
                    <span className="k">Phone</span>
                    <span className="v">{data?.profile?.phone || 'Verified mobile on file'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter onOpenBooking={() => router.push('/?book=true')} />
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
          Loading dashboard...
        </div>
      }
    >
      <CustomerDashboardContent />
    </Suspense>
  );
}
