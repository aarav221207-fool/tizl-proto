'use client';

import React from 'react';
import Link from 'next/link';
import { LOGO_SVG } from './SiteHeader';

export function SiteFooter() {
  return (
    <footer>
      <div className="wrap">
        <div className="footer-top">
          <div style={{ maxWidth: '260px' }}>
            <div className="logo-chip" style={{ marginBottom: '14px' }}>
              <Link href="/" aria-label="Tizl Home">
                {LOGO_SVG}
              </Link>
            </div>
            <p style={{ fontSize: '13px', lineHeight: '1.6', color: '#AEB3C7' }}>
              Book a Cook in 10 Minutes. Aadhaar &amp; police-verified cooks for daily meals, weekly prep, and celebrations.
            </p>
            <div style={{ marginTop: '16px' }}>
              <Link href="/book" className="btn btn-primary btn-small" style={{ background: 'var(--blue)', color: '#fff', fontSize: '12px', padding: '8px 16px' }}>
                Book a cook now →
              </Link>
            </div>
          </div>

          <div className="footer-cols">
            {/* Explore */}
            <div className="footer-col">
              <h4>Explore</h4>
              <Link href="/how-it-works">How it works</Link>
              <Link href="/about">About Tizl</Link>
              <Link href="/faq">FAQs</Link>
              <Link href="/contact">Contact &amp; Support</Link>
              <Link href="/book">Book a Cook</Link>
            </div>

            {/* Popular Services */}
            <div className="footer-col">
              <h4>Services</h4>
              <Link href="/services/daily-home-cooking">Daily Home Cooking</Link>
              <Link href="/services/breakfast-service">Breakfast Service</Link>
              <Link href="/services/dinner-service">Dinner Service</Link>
              <Link href="/services/party-cooking">Party Cooking</Link>
              <Link href="/services/weekly-meal-prep">Weekly Meal Prep</Link>
              <Link href="/services/festival-cooking">Festival Cooking</Link>
            </div>

            {/* Operating Cities */}
            <div className="footer-col">
              <h4>Cities</h4>
              <Link href="/cooks/delhi">Delhi NCR</Link>
              <Link href="/cooks/mumbai">Mumbai</Link>
              <Link href="/cooks/bengaluru">Bengaluru</Link>
              <Link href="/cooks/hyderabad">Hyderabad</Link>
              <Link href="/cooks/pune">Pune</Link>
              <Link href="/cooks/chennai">Chennai</Link>
            </div>

            {/* Partners */}
            <div className="footer-col">
              <h4>Cook Partners</h4>
              <Link href="/partner/signup">Become a Cook</Link>
              <Link href="/partner/login">Partner Login</Link>
              <Link href="/partner/verification">Verification Status</Link>
              <Link href="/contact?topic=partner">Partner Support</Link>
            </div>

            {/* Customer & Legal */}
            <div className="footer-col">
              <h4>Customer</h4>
              <Link href="/customer/login">Customer Login</Link>
              <Link href="/customer/signup">Create Account</Link>
              <Link href="/customer/dashboard">My Bookings</Link>
              <Link href="/faq#cancellation">Cancellation Policy</Link>
              <Link href="/faq#safety">Safety &amp; Verification</Link>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>Tizl © 2026. All rights reserved. On-demand home cook platform.</span>
          <div className="social-row">
            <span>Instagram</span>
            <span>LinkedIn</span>
            <span>Twitter / X</span>
            <span>YouTube</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
