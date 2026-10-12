'use client';

import React from 'react';
import Link from 'next/link';

interface SiteFooterProps {
  onOpenBooking?: () => void;
  onOpenPartner?: () => void;
  onOpenAuth?: (role?: 'customer' | 'partner') => void;
}

export function SiteFooter({ onOpenBooking, onOpenPartner, onOpenAuth }: SiteFooterProps) {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div>
            <span style={{ display: 'inline-block', background: '#fff', borderRadius: '10px', padding: '8px 14px', marginBottom: '14px' }}>
              <img src="/assets/tizl-header-logo.png" alt="Tizl" style={{ height: '32px', width: 'auto', display: 'block' }} />
            </span>
            <p style={{ maxWidth: '260px', fontSize: '13.5px', color: '#8A90A8', lineHeight: '1.6' }}>
              Fresh home-cooked meals, without the hassle.
            </p>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Company</h4>
              <a
                href="#why-us"
                onClick={(e) => {
                  if (typeof window !== 'undefined' && window.location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('why-us')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                About
              </a>
              <a
                href="/partner/signup"
                onClick={(e) => {
                  if (onOpenPartner) {
                    e.preventDefault();
                    onOpenPartner();
                  }
                }}
              >
                Careers
              </a>
              <a
                href="#faqs"
                onClick={(e) => {
                  if (typeof window !== 'undefined' && window.location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Press
              </a>
            </div>
            <div className="footer-col">
              <h4>Customers</h4>
              <a
                href="/book"
                onClick={(e) => {
                  if (onOpenBooking) {
                    e.preventDefault();
                    onOpenBooking();
                  }
                }}
              >
                Book a cook
              </a>
              <a
                href="/customer/dashboard"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('customer');
                  }
                }}
              >
                My bookings
              </a>
              <a
                href="#faqs"
                onClick={(e) => {
                  if (typeof window !== 'undefined' && window.location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Support
              </a>
            </div>
            <div className="footer-col">
              <h4>Partners</h4>
              <a
                href="/partner/signup"
                onClick={(e) => {
                  if (onOpenPartner) {
                    e.preventDefault();
                    onOpenPartner();
                  }
                }}
              >
                Become a partner
              </a>
              <a
                href="/partner/login"
                onClick={(e) => {
                  if (onOpenAuth) {
                    e.preventDefault();
                    onOpenAuth('partner');
                  }
                }}
              >
                Partner login
              </a>
              <a
                href="#faqs"
                onClick={(e) => {
                  if (typeof window !== 'undefined' && window.location.pathname === '/') {
                    e.preventDefault();
                    document.getElementById('faqs')?.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                Training
              </a>
            </div>
            <div className="footer-col">
              <h4>Legal</h4>
              <Link href="/faq">Terms</Link>
              <Link href="/faq">Privacy</Link>
              <Link href="/faq">Refunds</Link>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href="tel:+919582072540">+91 95820 72540</a>
              <a href="mailto:hello@tizl.in">hello@tizl.in</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Tizl Facility Services LLP. All rights reserved.</span>
          <div className="social-row">
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">Instagram</a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer">X</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
