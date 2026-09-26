'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export default function ContactPage() {
  const [formState, setFormState] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    ticketNumber: string;
    message: string;
    createdAt?: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || 'Failed to submit message. Please try again.');
      }

      setSuccessData(data.data);
      setFormState({
        name: '',
        email: '',
        phone: '',
        subject: 'General Inquiry',
        message: '',
      });
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Tizl Support',
    url: 'https://tizl.in/contact',
    description: 'Get in touch with Tizl for booking assistance, cook partner onboarding, or customer support.',
    mainEntity: {
      '@type': 'Organization',
      name: 'Tizl',
      email: 'support@tizl.in',
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+91-9811000000',
        contactType: 'customer service',
        areaServed: 'IN',
        availableLanguage: ['English', 'Hindi'],
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <SiteHeader />

      <main>
        {/* Breadcrumb */}
        <div className="bg-[var(--surface)] border-b border-[var(--line)] py-3">
          <div className="wrap">
            <nav className="text-xs text-[var(--text-dim)] flex items-center gap-2">
              <Link href="/" className="hover:text-[var(--ink)]">Home</Link>
              <span>/</span>
              <span className="text-[var(--ink)] font-semibold">Contact &amp; Support</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero py-14 md:py-20">
          <div className="wrap text-center max-w-3xl mx-auto">
            <div className="eyebrow-label justify-center">Help Desk &amp; Contact</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              We&apos;re here to <em>help you.</em>
            </h1>
            <p className="text-base md:text-lg text-[var(--text-dim)] leading-relaxed">
              Have a question about a recent booking, want to partner as a verified cook, or need enterprise culinary catering? Fill out the form or reach us through our direct channels.
            </p>
          </div>
        </section>

        {/* Main Content Grid: Form + Contact Info */}
        <section className="py-16 bg-[#ffffff] border-t border-[var(--line)]">
          <div className="wrap">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Left Column: Interactive Form */}
              <div className="lg:col-span-7">
                <div className="bg-[var(--paper)] border border-[var(--line)] rounded-[var(--radius)] p-8 md:p-10 shadow-sm">
                  <h2 className="text-2xl font-bold mb-2">Send us a message</h2>
                  <p className="text-sm text-[var(--text-dim)] mb-8">
                    Every message generates a verified support ticket registered directly with our operations team.
                  </p>

                  {/* Success State */}
                  {successData ? (
                    <div className="success-box p-6 bg-[#ffffff] rounded-2xl border border-[var(--green)]/30 text-center">
                      <div className="success-icon">✓</div>
                      <h3 className="text-2xl font-bold text-[var(--ink)] mb-2">Ticket Created!</h3>
                      <p className="text-sm text-[var(--text-dim)] mb-4 leading-relaxed">
                        {successData.message}
                      </p>
                      <div className="inline-block bg-[var(--surface-blue)] border border-[var(--blue-dim)] text-[var(--blue-deep)] font-mono text-sm px-4 py-2 rounded-full mb-6 font-semibold">
                        Ticket ID: {successData.ticketNumber}
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => setSuccessData(null)}
                          className="btn btn-primary btn-small"
                        >
                          Submit another inquiry
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Contact Form */
                    <form onSubmit={handleSubmit} className="space-y-5">
                      {errorMsg && (
                        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                          <strong>Error:</strong> {errorMsg}
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2 font-mono">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="e.g. Priya Sharma"
                            value={formState.name}
                            onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2 font-mono">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            required
                            placeholder="priya@example.com"
                            value={formState.email}
                            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2 font-mono">
                            Phone Number
                          </label>
                          <input
                            type="tel"
                            placeholder="+91 98765 43210"
                            value={formState.phone}
                            onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                            className="w-full"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2 font-mono">
                            Inquiry Topic <span className="text-red-500">*</span>
                          </label>
                          <select
                            value={formState.subject}
                            onChange={(e) => setFormState({ ...formState, subject: e.target.value })}
                            className="w-full"
                          >
                            <option value="General Inquiry">General Inquiry</option>
                            <option value="Booking Assistance">Booking Assistance</option>
                            <option value="Cook Partnership">Become a Cook Partner</option>
                            <option value="Corporate / Party Cooking">Party &amp; Corporate Booking</option>
                            <option value="Feedback & Suggestions">Feedback &amp; Suggestions</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-[var(--ink)] mb-2 font-mono">
                          Message <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          required
                          rows={5}
                          placeholder="Tell us about your requirements, booking dates, city, or question..."
                          value={formState.message}
                          onChange={(e) => setFormState({ ...formState, message: e.target.value })}
                          className="w-full"
                        />
                      </div>

                      <div className="pt-2">
                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="btn btn-primary btn-full py-4 text-base font-semibold"
                        >
                          {isSubmitting ? 'Registering support ticket...' : 'Send Message →'}
                        </button>
                      </div>

                      <p className="text-xs text-[var(--text-faint)] text-center">
                        Our support team operates daily from 7:00 AM to 10:00 PM IST. Typical email turnaround is within 2 hours.
                      </p>
                    </form>
                  )}
                </div>
              </div>

              {/* Right Column: Direct Info & Operational Details */}
              <div className="lg:col-span-5 space-y-6">
                {/* Quick Channels */}
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-[var(--radius)] p-8">
                  <h3 className="text-lg font-bold mb-4">Direct Contact Channels</h3>

                  <div className="space-y-4 text-sm">
                    <div className="flex items-start gap-3">
                      <span className="text-xl">📧</span>
                      <div>
                        <strong className="block text-[var(--ink)]">Customer Support</strong>
                        <a href="mailto:support@tizl.in" className="text-[var(--blue)] font-medium hover:underline">
                          support@tizl.in
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-xl">🍳</span>
                      <div>
                        <strong className="block text-[var(--ink)]">Cook Partner Desk</strong>
                        <a href="mailto:partners@tizl.in" className="text-[var(--blue)] font-medium hover:underline">
                          partners@tizl.in
                        </a>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <span className="text-xl">📞</span>
                      <div>
                        <strong className="block text-[var(--ink)]">Helpline (Customer Care)</strong>
                        <span className="text-[var(--ink)] font-mono">+91 98110 00000</span>
                        <span className="block text-xs text-[var(--text-dim)]">7:00 AM – 10:00 PM IST, Daily</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Operations Footprint */}
                <div className="bg-[var(--surface-blue)] border border-[var(--blue-dim)] rounded-[var(--radius)] p-8">
                  <h3 className="text-lg font-bold text-[var(--blue-deep)] mb-3">Live Operational Cities</h3>
                  <p className="text-xs text-[var(--text-dim)] mb-4">
                    Tizl verified cooks are currently active across residential clusters in:
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['Delhi NCR', 'Noida', 'Gurugram', 'Bengaluru', 'Mumbai', 'Hyderabad', 'Pune', 'Chennai', 'Ahmedabad', 'Kolkata'].map((city) => (
                      <span key={city} className="px-3 py-1.5 rounded-full bg-white text-[var(--ink)] font-medium border border-[var(--blue-dim)]">
                        {city}
                      </span>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-[var(--blue-dim)]">
                    <Link href="/book" className="text-xs font-bold text-[var(--blue)] hover:underline inline-flex items-center gap-1">
                      Ready to book a cook right now? Start here →
                    </Link>
                  </div>
                </div>

                {/* Safety Guarantee */}
                <div className="bg-[#ffffff] border border-[var(--line)] rounded-[var(--radius)] p-8">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">🛡️</span>
                    <h3 className="text-base font-bold">100% Verified Partners</h3>
                  </div>
                  <p className="text-xs text-[var(--text-dim)] leading-relaxed">
                    Have feedback about a cook or need to report an issue? All tickets flagged under &quot;Booking Assistance&quot; are prioritized by our safety compliance team immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
