'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

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
  const [error, setError] = useState<string | null>(null);

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
          setError(err.message);
        })
        .finally(() => {
          setLoadingData(false);
        });
    }
  }, [isAuthenticated]);

  if (isLoading || loadingData) {
    return (
      <div className="min-h-screen bg-[var(--paper)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[var(--blue)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-[var(--text-dim)]">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  const allBookings = [...(data?.activeBookings || []), ...(data?.recentBookings || [])].filter(
    (item, index, self) => index === self.findIndex((b) => b.id === item.id)
  );

  return (
    <div className="min-h-screen bg-[var(--paper)] flex flex-col font-sans">
      <header className="site-header" style={{ position: 'sticky', top: 0, zIndex: 80, background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap flex items-center justify-between h-[78px]">
          <div className="flex items-center gap-6">
            <Link href="/" className="logo text-[#0F1736] font-bold text-2xl flex items-center gap-1">
              <span className="text-[#2E46E0]">Ti</span>zl
            </Link>
            <span className="hidden sm:inline-block pl-4 border-l border-gray-200 text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)]">
              Customer Account
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium text-[var(--text-dim)] hover:text-[var(--ink)]">
              Home
            </Link>
            <Link href="/?book=true" className="btn btn-primary btn-small">
              Book a cook
            </Link>
            <button
              onClick={() => logout()}
              className="btn btn-ghost btn-small font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="wrap py-10 flex-1">
        {/* Welcome banner */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--ink)]">
                Welcome back, {data?.profile?.full_name || user?.fullName || 'Customer'}
              </h1>
              <p className="text-sm text-[var(--text-dim)] mt-1">
                {data?.profile?.email || user?.email} · {data?.profile?.phone || 'Verified Customer'}
              </p>
            </div>
            <Link
              href="/?book=true"
              className="btn btn-primary btn-small shadow-sm"
            >
              + Book a new cook
            </Link>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-[var(--line)] rounded-2xl p-6 shadow-sm">
            <div className="text-xs uppercase font-mono tracking-wider text-[var(--text-dim)] mb-2">Total Bookings</div>
            <div className="text-3xl font-bold text-[var(--ink)]">{data?.metrics?.totalBookings ?? allBookings.length}</div>
          </div>
          <div className="bg-white border border-[var(--line)] rounded-2xl p-6 shadow-sm">
            <div className="text-xs uppercase font-mono tracking-wider text-[var(--text-dim)] mb-2">Active Bookings</div>
            <div className="text-3xl font-bold text-[var(--blue)]">{data?.metrics?.activeBookingsCount ?? (data?.activeBookings?.length || 0)}</div>
          </div>
          <div className="bg-white border border-[var(--line)] rounded-2xl p-6 shadow-sm">
            <div className="text-xs uppercase font-mono tracking-wider text-[var(--text-dim)] mb-2">Completed Cooks</div>
            <div className="text-3xl font-bold text-[var(--ink)]">{data?.metrics?.completedBookingsCount ?? 0}</div>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white border border-[var(--line)] rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-[var(--ink)]">Your Bookings</h2>
            <span className="text-xs font-mono text-[var(--text-dim)]">{allBookings.length} total</span>
          </div>

          {allBookings.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="w-16 h-16 bg-[var(--surface)] text-3xl rounded-full flex items-center justify-center mx-auto mb-4">
                🍳
              </div>
              <h3 className="text-lg font-bold text-[var(--ink)] mb-2">No bookings yet</h3>
              <p className="text-sm text-[var(--text-dim)] max-w-sm mx-auto mb-6">
                Book your first verified Tizl cook in just a few clicks. Transparent hourly pricing and instant confirmation.
              </p>
              <Link href="/?book=true" className="btn btn-primary btn-small">
                Book a Cook Now
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {allBookings.map((b) => (
                <div
                  key={b.id}
                  className="border border-[var(--line)] rounded-xl p-5 hover:border-[var(--blue)] transition-colors flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono font-bold text-sm text-[var(--ink)]">
                        {b.booking_number}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          b.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : b.status === 'cancelled'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}
                      >
                        ● {b.status.replace(/_/g, ' ')}
                      </span>
                      {b.otp && b.status !== 'completed' && b.status !== 'cancelled' && (
                        <span className="text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                          OTP: <strong>{b.otp}</strong>
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-[var(--ink)] font-medium">
                      {b.services?.name || b.services?.title || 'Cook Service'} · {b.duration_hours} hr{b.duration_hours > 1 ? 's' : ''} for {b.guest_count} people
                    </div>
                    <div className="text-xs text-[var(--text-dim)]">
                      Date: {b.booking_date} at {b.start_time} · {b.cooking_notes || 'Assigned verified cook'}
                    </div>
                  </div>

                  <div className="text-left md:text-right flex-none">
                    <div className="text-lg font-bold text-[var(--ink)]">
                      ₹{b.total_amount || 598}
                    </div>
                    <div className="text-xs text-[var(--text-faint)]">
                      Hourly rate included
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">Loading dashboard...</div>}>
      <CustomerDashboardContent />
    </Suspense>
  );
}
