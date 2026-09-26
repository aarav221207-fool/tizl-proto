'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';

export const LOGO_SVG = (
  <svg height="34" viewBox="0 0 320 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="logo-img" style={{ display: 'block', height: '34px', width: 'auto' }}>
    {/* Three Steam Waves */}
    <path d="M78 44 C82 37 77 31 80 23 C83 15 78 9 82 2" stroke="#1D53DC" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M89 44 C93 37 88 31 91 23 C94 15 89 9 93 2" stroke="#1D53DC" strokeWidth="4.5" strokeLinecap="round" fill="none" />
    <path d="M100 44 C104 37 99 31 102 23 C105 15 100 9 104 2" stroke="#1D53DC" strokeWidth="4.5" strokeLinecap="round" fill="none" />

    {/* Pan Handle & Body */}
    <g fill="#0F1736">
      <path d="M37 50.5 C37 47.5 34.5 45 31.5 45 C28.5 45 26 47.5 26 50.5 C26 53.5 28.5 56 31.5 56 C34.5 56 37 53.5 37 50.5 Z M31.5 48.5 C32.6 48.5 33.5 49.4 33.5 50.5 C33.5 51.6 32.6 52.5 31.5 52.5 C30.4 52.5 29.5 51.6 29.5 50.5 C29.5 49.4 30.4 48.5 31.5 48.5 Z" />
      <path d="M36 52 L57 52 C61 52 64 54 68 56 L73 57.5 C77 58 80 58.5 85 58.5 L120 58.5 C124 58.5 126 55 126 52 L73 52 C68 52 65 50 61 48 L56 46.5 C52 45.5 48 48 42 49 L36 49 Z" />
      <path d="M58 52 C58 52 63 60 70 60.5 L116 60.5 C122 60.5 127 52 127 52 Z" />
    </g>

    {/* Typography 'TiZl' */}
    <path d="M84 55 L100 55 L100 66 L94 66 L94 100 L84 100 L84 66 L78 66 L78 55 Z" fill="#0F1736" />
    <circle cx="139" cy="50" r="6" fill="#1D53DC" />
    <rect x="133" y="62" width="12" height="38" rx="6" fill="#1D53DC" />
    <path d="M156 62 L188 62 C192 62 194 64.5 192 68 L168 90 L190 90 C193 90 195 92 195 95 L195 96 C195 98 193 100 190 100 L158 100 C154 100 152 97.5 154 94 L178 72 L158 72 C155 72 153 70 153 67 L153 66 C153 64 155 62 158 62 Z" fill="#1D53DC" />
    <path d="M208 48 C211 48 213 50 213 53 L213 90 C213 96 217 99 223 99 L238 99 C241 99 243 101 243 104 C243 107 241 109 238 109 L221 109 C211 109 203 102 203 91 L203 53 C203 50 205 48 208 48 Z" fill="#0F1736" />
  </svg>
);

const SERVICES_MENU = [
  { slug: 'daily-home-cooking', label: 'Daily Home Cooking' },
  { slug: 'breakfast-service', label: 'Breakfast Service' },
  { slug: 'dinner-service', label: 'Dinner Service' },
  { slug: 'weekly-meal-prep', label: 'Weekly Meal Prep' },
  { slug: 'party-cooking', label: 'Party Cooking' },
  { slug: 'festival-cooking', label: 'Festival Cooking' },
];

const CITIES_MENU = [
  { slug: 'delhi', label: 'Delhi NCR' },
  { slug: 'mumbai', label: 'Mumbai' },
  { slug: 'bengaluru', label: 'Bengaluru' },
  { slug: 'hyderabad', label: 'Hyderabad' },
  { slug: 'pune', label: 'Pune' },
  { slug: 'chennai', label: 'Chennai' },
];

interface SiteHeaderProps {
  onOpenBooking?: (needId?: string) => void;
}

export function SiteHeader({ onOpenBooking }: SiteHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="wrap">
        <Link href="/" className="logo" aria-label="Tizl Home">
          {LOGO_SVG}
        </Link>

        {/* Desktop Navigation - Exact Tizl Nav */}
        <nav className="main-nav">
          <div className="nav-item">
            <Link href="/#why-us">Why us</Link>
          </div>

          {/* Services Dropdown */}
          <div className="nav-item">
            <button type="button">Services <span className="caret">▾</span></button>
            <div className="mega" style={{ minWidth: '240px' }}>
              {SERVICES_MENU.map((s) => (
                <Link key={s.slug} href={`/services/${s.slug}`}>
                  {s.label}
                </Link>
              ))}
              <Link className="view-all" href="/#services">View all services →</Link>
            </div>
          </div>

          {/* Cities Dropdown */}
          <div className="nav-item">
            <button type="button">Cities <span className="caret">▾</span></button>
            <div className="mega" style={{ minWidth: '220px' }}>
              {CITIES_MENU.map((c) => (
                <Link key={c.slug} href={`/cooks/${c.slug}`}>
                  {c.label}
                </Link>
              ))}
              <Link className="view-all" href="/#cities">View all cities →</Link>
            </div>
          </div>

          <div className="nav-item">
            <Link href="/how-it-works">How it works</Link>
          </div>

          <div className="nav-item">
            <Link href="/faq">FAQs</Link>
          </div>
        </nav>

        {/* Header CTAs */}
        <div className="header-ctas">
          {!isAuthenticated && (
            <>
              <Link href="/customer/login" className="btn btn-ghost btn-small font-semibold">Login</Link>
              <Link href="/customer/signup" className="btn btn-ghost btn-small font-semibold hidden sm:inline-flex">Sign Up</Link>
            </>
          )}

          {isAuthenticated && user?.role === 'customer' && (
            <>
              <div className="header-user">
                <div className="av">{(user.fullName || user.email || 'U').charAt(0).toUpperCase()}</div>
                <span className="hidden md:inline font-medium text-[var(--ink)]">
                  Hello, {user.fullName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
              </div>
              <Link href="/customer/dashboard" className="btn btn-ghost btn-small font-semibold hidden sm:inline-flex">My Bookings</Link>
              <button onClick={() => logout()} className="btn btn-ghost btn-small font-semibold">Logout</button>
            </>
          )}

          {isAuthenticated && user?.role === 'cook' && (
            <>
              <Link href="/partner/dashboard" className="btn btn-ghost btn-small font-semibold">Partner Dashboard</Link>
              <Link href="/partner/verification" className="btn btn-ghost btn-small font-semibold hidden sm:inline-flex">Verification Status</Link>
              <button onClick={() => logout()} className="btn btn-ghost btn-small font-semibold">Logout</button>
            </>
          )}

          {(!isAuthenticated || user?.role === 'customer') && (
            onOpenBooking ? (
              <button type="button" className="btn btn-primary btn-small" onClick={() => onOpenBooking()}>Book a cook</button>
            ) : (
              <Link href="/book" className="btn btn-primary btn-small">Book a cook</Link>
            )
          )}

          {/* Mobile hamburger toggle (only visible on mobile) */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-8 h-8 rounded border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] p-1 ml-1"
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className="w-4 h-0.5 bg-[var(--ink)] my-0.5"></span>
            <span className="w-4 h-0.5 bg-[var(--ink)] my-0.5"></span>
            <span className="w-4 h-0.5 bg-[var(--ink)] my-0.5"></span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--line)] bg-[#ffffff] px-6 py-4 shadow-lg animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-2 font-medium text-sm">
            <Link href="/#why-us" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[var(--line)]">
              Why us
            </Link>
            <Link href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[var(--line)]">
              How it works
            </Link>
            <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="py-2 border-b border-[var(--line)]">
              FAQs
            </Link>
            <div className="py-2 border-b border-[var(--line)]">
              <span className="text-xs uppercase tracking-wider text-[var(--text-faint)] font-bold block mb-1">
                Popular Services
              </span>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {SERVICES_MENU.map((s) => (
                  <Link
                    key={s.slug}
                    href={`/services/${s.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded hover:text-[var(--blue)]"
                  >
                    {s.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="py-2 border-b border-[var(--line)]">
              <span className="text-xs uppercase tracking-wider text-[var(--text-faint)] font-bold block mb-1">
                Cities
              </span>
              <div className="grid grid-cols-2 gap-1 text-xs">
                {CITIES_MENU.map((c) => (
                  <Link
                    key={c.slug}
                    href={`/cooks/${c.slug}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 rounded hover:text-[var(--blue)]"
                  >
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <Link href="/book" onClick={() => setMobileMenuOpen(false)} className="btn btn-primary btn-small text-center">
                Book a cook
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
