'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

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
};

function CustomerDashboardContent() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);
  const [activeTab, setActiveTab] = useState<'bookings' | 'addresses' | 'payments' | 'support' | 'profile'>('bookings');
  const [bookingFilter, setBookingFilter] = useState<'all' | 'active' | 'completed'>('all');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/customer/login?redirect=/customer/dashboard');
    }
  }, [isLoading, isAuthenticated, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetch('/api/customer/dashboard')
        .then(async (res) => {
          if (!res.ok) throw new Error('Failed to load customer dashboard');
          return res.json();
        })
        .then((json) => {
          if (json.success && json.data) {
            setData(json.data);
          }
        })
        .catch((err) => {
          console.error(err);
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [isAuthenticated]);

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
                Payments
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
                My Profile
              </button>
              <button onClick={() => logout()}>Logout</button>
            </div>

            {/* Main content pane */}
            <div>
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

              {/* PAYMENTS PANE */}
              {activeTab === 'payments' && (
                <div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>UPI — {data?.profile?.email ? data.profile.email.split('@')[0] + '@upi' : 'user@okhdfcbank'}</strong>
                      <span>Default payment method</span>
                    </div>
                    <div className="actions">
                      <span className="status-badge success">Verified</span>
                    </div>
                  </div>
                  <button className="btn btn-ghost btn-small mt-2">+ Add payment method</button>
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
