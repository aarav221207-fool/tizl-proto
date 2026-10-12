'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

function PartnerDashboardContent() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'today' | 'earnings' | 'ratings' | 'training'>('today');

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/partner/login');
      } else if (user?.role !== 'cook') {
        router.push('/');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role !== 'cook') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--blue)] mx-auto mb-4" />
          <p className="text-sm font-medium text-[var(--text-dim)]">Loading partner portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--surface)] flex flex-col font-sans">
      <SiteHeader />

      <main className="dashboard open flex-1">
        <div className="wrap">
          <div className="dash-head">
            <div>
              <h1>Good morning, {user.fullName?.split(' ')[0] || 'Partner'}.</h1>
              <p>You have 2 scheduled jobs today in Noida &amp; Delhi NCR.</p>
            </div>
            <div className="flex gap-2">
              <span className="status-badge success">Online &amp; Available</span>
            </div>
          </div>

          <div className="dash-grid">
            {/* Sidebar navigation */}
            <div className="dash-nav">
              <button
                className={activeTab === 'today' ? 'on' : ''}
                onClick={() => setActiveTab('today')}
              >
                Today&apos;s Jobs
              </button>
              <button
                className={activeTab === 'earnings' ? 'on' : ''}
                onClick={() => setActiveTab('earnings')}
              >
                Earnings &amp; Wallet
              </button>
              <button
                className={activeTab === 'ratings' ? 'on' : ''}
                onClick={() => setActiveTab('ratings')}
              >
                Ratings
              </button>
              <button
                className={activeTab === 'training' ? 'on' : ''}
                onClick={() => setActiveTab('training')}
              >
                Training
              </button>
              <button onClick={() => logout()}>Logout</button>
            </div>

            {/* Content pane */}
            <div>
              {activeTab === 'today' && (
                <div>
                  <div className="dash-cards">
                    <div className="dash-card featured">
                      <div className="lb">Today&apos;s earnings</div>
                      <div className="num">₹1,840</div>
                      <div className="trend">↑ 12% from last week</div>
                    </div>
                    <div className="dash-card">
                      <div className="lb">Jobs today</div>
                      <div className="num">2</div>
                    </div>
                    <div className="dash-card">
                      <div className="lb">Rating</div>
                      <div className="num">4.9 ★</div>
                    </div>
                  </div>

                  <div className="job-card">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <strong style={{ fontSize: '16px' }}>Dinner for 4 — Sector 62, Noida</strong>
                        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
                          7:30 PM · 2 dishes + Rotis · North Indian Home Style
                        </div>
                      </div>
                      <span className="status-badge pending">Assigned</span>
                    </div>
                    <div className="job-pipeline">
                      <span className="done">Accepted</span>
                      <span className="now">Start Cooking</span>
                      <span>Completed</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-[var(--line)]">
                      <span style={{ fontSize: '13px', color: 'var(--text-dim)' }}>OTP required at customer kitchen</span>
                      <button className="btn btn-primary btn-small">Navigate to Address</button>
                    </div>
                  </div>

                  <div className="job-card">
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <strong style={{ fontSize: '16px' }}>Lunch Prep for 2 — Indirapuram</strong>
                        <div style={{ fontSize: '13px', color: 'var(--text-dim)', marginTop: '4px' }}>
                          1:00 PM · Dal Makhani, Paneer Bhurji &amp; Phulkas
                        </div>
                      </div>
                      <span className="status-badge success">Completed</span>
                    </div>
                    <div className="job-pipeline">
                      <span className="done">Accepted</span>
                      <span className="done">Cooked</span>
                      <span className="done">Paid ₹920</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'earnings' && (
                <div>
                  <div className="dash-cards">
                    <div className="dash-card">
                      <div className="lb">Wallet balance</div>
                      <div className="num">₹6,420</div>
                    </div>
                    <div className="dash-card">
                      <div className="lb">This week</div>
                      <div className="num">₹9,150</div>
                    </div>
                    <div className="dash-card">
                      <div className="lb">This month</div>
                      <div className="num">₹31,600</div>
                    </div>
                  </div>
                  <button className="btn btn-primary btn-small">Withdraw to Bank (Instant UPI)</button>
                </div>
              )}

              {activeTab === 'ratings' && (
                <div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Priya S.</strong>
                      <span>&ldquo;Punctual and the food was excellent. Very hygienic!&rdquo;</span>
                    </div>
                    <div className="actions text-amber-500 font-bold">★★★★★</div>
                  </div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Rohit K.</strong>
                      <span>&ldquo;Great with kids&apos; meals, left the kitchen spotless.&rdquo;</span>
                    </div>
                    <div className="actions text-amber-500 font-bold">★★★★★</div>
                  </div>
                </div>
              )}

              {activeTab === 'training' && (
                <div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Hygiene &amp; food safety standards</strong>
                      <span>12 min video · Certification active</span>
                    </div>
                    <div className="actions">
                      <button className="btn btn-ghost btn-small">Watch</button>
                    </div>
                  </div>
                  <div className="booking-row">
                    <div className="left">
                      <strong>Customer communication &amp; kitchen etiquette</strong>
                      <span>8 min video</span>
                    </div>
                    <div className="actions">
                      <button className="btn btn-ghost btn-small">Watch</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}

export default function PartnerDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
          Loading partner dashboard...
        </div>
      }
    >
      <PartnerDashboardContent />
    </Suspense>
  );
}
