'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/context/auth-context';

interface SiteHeaderProps {
  onOpenBooking?: () => void;
  onOpenAuth?: (role?: 'customer' | 'partner') => void;
  onOpenPartner?: () => void;
}

export function SiteHeader({ onOpenBooking, onOpenAuth, onOpenPartner }: SiteHeaderProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleBooking = () => {
    if (onOpenBooking) {
      onOpenBooking();
    } else {
      window.location.href = '/book';
    }
  };

  const handleLogin = () => {
    if (onOpenAuth) {
      onOpenAuth();
    } else {
      window.location.href = '/customer/login';
    }
  };

  return (
    <header className="site-header">
      <div className="wrap">
        <Link
          href="/"
          className="logo"
          aria-label="Tizl Home"
          onClick={() => {
            if (typeof window !== 'undefined') {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
        >
          {/* Exact Tizl reference logo */}
          <img
            src="/assets/tizl-header-logo.png"
            alt="Tizl"
            className="header-brand-logo-img"
          />
        </Link>

        {/* Desktop Navigation */}
        <nav className="main-nav" aria-label="Main Navigation">
          <div className="nav-item active">
            <Link href="/">Home</Link>
          </div>
          <div className="nav-item">
            <a
              href="#how-it-works"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              How it works
            </a>
          </div>
          <div className="nav-item">
            <a
              href="#services"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Services
            </a>
          </div>
          <div className="nav-item">
            <a
              href="#partners"
              onClick={(e) => {
                if (onOpenPartner) {
                  e.preventDefault();
                  onOpenPartner();
                } else if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              For Cooks
            </a>
          </div>
          <div className="nav-item">
            <a
              href="#why-us"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('why-us')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              About
            </a>
          </div>
          <div className="nav-item">
            <a
              href="#faqs"
              onClick={(e) => {
                if (window.location.pathname === '/') {
                  e.preventDefault();
                  document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              FAQs
            </a>
          </div>
        </nav>

        {/* Header CTAs */}
        <div className="header-ctas" id="headerCtas">
          <div className="loc-picker">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-6.6 7-11.2A7 7 0 105 9.8C5 14.4 12 21 12 21z" />
              <circle cx="12" cy="9.6" r="2.3" />
            </svg>
            Delhi NCR <span style={{ fontSize: '10px' }}>▾</span>
          </div>

          {!isAuthenticated && (
            <>
              <button
                type="button"
                className="btn btn-ghost btn-small"
                onClick={handleLogin}
              >
                Login
              </button>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={handleBooking}
              >
                Book a Cook <span className="arrow">→</span>
              </button>
            </>
          )}

          {isAuthenticated && user?.role === 'customer' && (
            <>
              <Link href="/customer/dashboard" className="header-user">
                <div className="av">{(user.fullName || user.email || 'U').charAt(0).toUpperCase()}</div>
                <span className="hidden sm:inline font-semibold text-[var(--ink)] text-sm">
                  {user.fullName?.split(' ')[0] || user.email?.split('@')[0]}
                </span>
              </Link>
              <button
                type="button"
                className="btn btn-primary btn-small"
                onClick={handleBooking}
              >
                Book a Cook <span className="arrow">→</span>
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-small text-xs px-2.5 py-1.5"
                onClick={() => logout()}
              >
                Logout
              </button>
            </>
          )}

          {isAuthenticated && user?.role === 'cook' && (
            <>
              <Link href="/partner/dashboard" className="header-user">
                <div className="av">{(user.fullName || 'P').charAt(0).toUpperCase()}</div>
                <span className="hidden sm:inline font-semibold text-[var(--ink)] text-sm">
                  {user.fullName?.split(' ')[0] || 'Partner'}
                </span>
              </Link>
              <button
                type="button"
                className="btn btn-ghost btn-small text-xs px-2.5 py-1.5"
                onClick={() => logout()}
              >
                Logout
              </button>
            </>
          )}

          {/* Mobile hamburger toggle */}
          <button
            type="button"
            className="md:hidden flex flex-col justify-center items-center w-9 h-9 rounded-lg border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] p-1.5 ml-1 transition-colors hover:bg-white"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span className={`w-4 h-0.5 bg-[var(--ink)] transition-transform duration-200 ${mobileMenuOpen ? 'rotate-45 translate-y-1' : 'my-0.5'}`} />
            <span className={`w-4 h-0.5 bg-[var(--ink)] transition-opacity duration-200 ${mobileMenuOpen ? 'opacity-0' : 'my-0.5'}`} />
            <span className={`w-4 h-0.5 bg-[var(--ink)] transition-transform duration-200 ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'my-0.5'}`} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[var(--line)] bg-[#ffffff] px-5 py-4 shadow-xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col gap-2 font-medium text-sm">
            <Link
              href="/"
              onClick={() => setMobileMenuOpen(false)}
              className="py-2.5 border-b border-[var(--line)] hover:text-[var(--blue)]"
            >
              Home
            </Link>
            <a
              href="#how-it-works"
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-2.5 border-b border-[var(--line)] hover:text-[var(--blue)]"
            >
              How it works
            </a>
            <a
              href="#services"
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-2.5 border-b border-[var(--line)] hover:text-[var(--blue)]"
            >
              Services
            </a>
            <a
              href="#partners"
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenPartner) onOpenPartner();
                else document.getElementById('partners')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-2.5 border-b border-[var(--line)] hover:text-[var(--blue)]"
            >
              For Cooks
            </a>
            <a
              href="#why-us"
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById('why-us')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-2.5 border-b border-[var(--line)] hover:text-[var(--blue)]"
            >
              About
            </a>
            <a
              href="#faqs"
              onClick={() => {
                setMobileMenuOpen(false);
                document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="py-2.5 border-b border-[var(--line)] hover:text-[var(--blue)]"
            >
              FAQs
            </a>

            <div className="pt-2 pb-1 flex flex-col gap-2">
              {!isAuthenticated ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogin();
                    }}
                    className="btn btn-ghost btn-small text-center text-xs"
                  >
                    Login
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      if (onOpenPartner) onOpenPartner();
                      else window.location.href = '/partner/signup';
                    }}
                    className="btn btn-ghost btn-small text-center text-xs"
                  >
                    Join as Cook
                  </button>
                </div>
              ) : (
                <Link
                  href={user?.role === 'cook' ? '/partner/dashboard' : '/customer/dashboard'}
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn btn-ghost btn-small text-center w-full"
                >
                  Dashboard
                </Link>
              )}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleBooking();
                }}
                className="btn btn-primary btn-small text-center w-full mt-1"
              >
                Book a cook now <span className="arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
