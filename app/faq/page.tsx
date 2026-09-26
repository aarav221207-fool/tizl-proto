'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

interface FaqItem {
  id: string;
  category: 'booking' | 'pricing' | 'safety' | 'kitchen' | 'cancellation' | 'partner';
  question: string;
  answer: string;
}

const FAQ_DATA: FaqItem[] = [
  // Booking & Dispatch
  {
    id: 'b1',
    category: 'booking',
    question: 'What is Tizl and how does it work?',
    answer: 'Tizl is an on-demand home cooking platform in India. We connect trained, Aadhaar-verified cooks with homes needing fresh breakfast, lunch, dinner, weekly prep, party cooking, senior meals, or baby food. You can book for immediate arrival in about 10 minutes or schedule for a specific time later in the day.',
  },
  {
    id: 'b2',
    category: 'booking',
    question: 'How fast will a cook arrive at my house?',
    answer: 'For instant on-demand bookings, our smart algorithm dispatches the closest available verified partner, who typically arrives at your stove within 10 to 15 minutes depending on traffic. You can also schedule hours or days in advance.',
  },
  {
    id: 'b3',
    category: 'booking',
    question: 'Can I select a specific cook or request the same cook again?',
    answer: 'Yes! When creating a booking, you can choose "Auto-match verified cook" for the fastest possible arrival, or browse available verified cooks in your area with their ratings, bios, and specialties.',
  },
  {
    id: 'b4',
    category: 'booking',
    question: 'Which cities does Tizl operate in?',
    answer: 'Tizl is live across major metropolitan regions including Delhi NCR (Noida, Gurugram, Delhi), Bengaluru, Mumbai, Hyderabad, Pune, Chennai, Ahmedabad, and Kolkata.',
  },

  // Pricing & Payment
  {
    id: 'p1',
    category: 'pricing',
    question: 'How is pricing calculated?',
    answer: 'Pricing is purely by the hour and completely upfront: ₹349 for 1 hour, ₹499 for 1.5 hours, ₹649 for 2 hours, and ₹999 for 3 hours. There are zero hidden platform fees, no advance salary demands, and no monthly lock-in contracts.',
  },
  {
    id: 'p2',
    category: 'pricing',
    question: 'Do I have to pay an advance or security deposit?',
    answer: 'No. Unlike traditional direct hiring where cooks often demand one month advance salary or festival bonuses, Tizl operates on pay-as-you-go. You review the meal and only pay digitally after the cooking is finished.',
  },
  {
    id: 'p3',
    category: 'pricing',
    question: 'Which payment methods are accepted?',
    answer: 'We support all major Indian digital payment methods including UPI (Google Pay, PhonePe, Paytm, BHIM), debit and credit cards, and net banking through secure encrypted payment gateways.',
  },

  // Safety & Verification
  {
    id: 's1',
    category: 'safety',
    question: 'Are Tizl cooks background-verified?',
    answer: 'Yes, 100%. Before their first booking, every cook partner undergoes mandatory government Aadhaar biometric identity verification and local police background clearance. In addition, our platform continuously monitors post-service customer ratings and hygiene feedback.',
  },
  {
    id: 's2',
    category: 'safety',
    question: 'What hygiene standards do cooks follow?',
    answer: 'Cooks are trained to wash their hands thoroughly before touching any ingredients, wear clean attire, keep hair neatly tied or capped, and maintain clean cooking surfaces throughout the preparation.',
  },

  // Kitchen & Groceries
  {
    id: 'k1',
    category: 'kitchen',
    question: 'Do cooks bring their own groceries and spices?',
    answer: 'No. To ensure health, freshness, and custom taste, you provide the fresh ingredients (vegetables, grains, meat/paneer, spices, and cooking oil) from your own kitchen. Your cook uses your preferred cookware and adjusts salt, oil, and spice levels to your exact instructions.',
  },
  {
    id: 'k2',
    category: 'kitchen',
    question: 'Does the cook clean the kitchen after cooking?',
    answer: 'Yes. Every booking includes post-cooking countertop handover: the cook wipes down the kitchen counter, gas stove, and chopping station, and gathers used utensils neatly in the sink so your kitchen is left orderly.',
  },

  // Cancellations & Rescheduling
  {
    id: 'c1',
    category: 'cancellation',
    question: 'What is Tizl’s cancellation and rescheduling policy?',
    answer: 'You can cancel or reschedule any booking directly through the app before your cook arrives. Cancellations made with reasonable notice are completely free. If an emergency occurs on the cook’s end, our platform automatically reassigns another nearby cook immediately.',
  },
  {
    id: 'c2',
    category: 'cancellation',
    question: 'What happens if my assigned cook cannot make it?',
    answer: 'Because Tizl maintains an active network of vetted partners in each operational cluster, our system detects delays proactively and re-routes another verified partner within minutes, ensuring your meal schedule is never disrupted.',
  },

  // Cook Partners
  {
    id: 'pr1',
    category: 'partner',
    question: 'How do I join Tizl as a cook partner?',
    answer: 'Skilled home cooks and culinary professionals can apply at /partner/signup. You will submit your Aadhaar card, undergo a quick culinary screening and police verification, and begin receiving flexible hourly bookings.',
  },
  {
    id: 'pr2',
    category: 'partner',
    question: 'How and when do cook partners get paid?',
    answer: 'Partners receive transparent hourly compensation directly into their registered bank account or UPI ID with automated, timely weekly payouts and access to performance bonuses.',
  },
];

const CATEGORIES = [
  { key: 'all', label: 'All Questions' },
  { key: 'booking', label: 'Booking & Dispatch' },
  { key: 'pricing', label: 'Pricing & Payment' },
  { key: 'safety', label: 'Safety & Verification' },
  { key: 'kitchen', label: 'Kitchen & Groceries' },
  { key: 'cancellation', label: 'Cancellations' },
  { key: 'partner', label: 'Cook Partners' },
];

export default function FaqPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>('b1');

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
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
              <span className="text-[var(--ink)] font-semibold">FAQs</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero py-16 md:py-20">
          <div className="wrap text-center max-w-3xl mx-auto">
            <div className="eyebrow-label justify-center">Help &amp; Answers</div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Frequently Asked <em>Questions</em>
            </h1>
            <p className="text-base md:text-lg text-[var(--text-dim)] leading-relaxed mb-8">
              Everything you need to know about booking verified home cooks, transparent pricing, background checks, and kitchen handover.
            </p>

            {/* Search Input */}
            <div className="relative max-w-xl mx-auto">
              <input
                type="text"
                placeholder="Search questions (e.g. pricing, cancellation, verification)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-5 pr-10 py-3.5 rounded-full border border-[var(--line)] bg-[#ffffff] text-[var(--ink)] shadow-sm focus:outline-none focus:border-[var(--blue)] text-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[var(--text-dim)] hover:text-[var(--ink)] font-bold"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Categories Bar */}
        <div className="border-y border-[var(--line)] bg-[var(--surface)] py-4 sticky top-[78px] z-20 backdrop-blur-md">
          <div className="wrap">
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none items-center">
              {CATEGORIES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedCategory(c.key)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === c.key
                      ? 'bg-[var(--blue)] text-white shadow-sm'
                      : 'bg-white text-[var(--text-dim)] border border-[var(--line)] hover:border-[var(--ink)] hover:text-[var(--ink)]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <section className="py-16 bg-[#ffffff]">
          <div className="wrap max-w-3xl">
            {filteredFaqs.length === 0 ? (
              <div className="empty-state">
                <div className="ic">🔍</div>
                <h3 className="text-xl font-bold mb-2">No matching questions found</h3>
                <p className="text-sm text-[var(--text-dim)] mb-6">
                  We could not find any FAQ matching &quot;{searchQuery}&quot;. Try searching for something else or contact our support team.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="btn btn-ghost btn-small"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredFaqs.map((faq) => {
                  const isOpen = expandedId === faq.id;
                  return (
                    <div
                      key={faq.id}
                      className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                        isOpen
                          ? 'border-[var(--blue)] bg-[var(--surface-blue)]/30 shadow-sm'
                          : 'border-[var(--line)] bg-[var(--paper)] hover:border-[var(--line-strong)]'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setExpandedId(isOpen ? null : faq.id)}
                        className="w-full text-left p-6 flex justify-between items-center gap-4 focus:outline-none"
                      >
                        <span className="font-bold text-base md:text-lg text-[var(--ink)]">
                          {faq.question}
                        </span>
                        <span
                          className={`flex-none w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-transform ${
                            isOpen
                              ? 'bg-[var(--blue)] text-white rotate-180'
                              : 'bg-[var(--surface)] text-[var(--text-dim)]'
                          }`}
                        >
                          ▾
                        </span>
                      </button>

                      {isOpen && (
                        <div className="px-6 pb-6 text-sm md:text-base text-[var(--text-dim)] leading-relaxed border-t border-[var(--line)]/50 pt-4">
                          {faq.answer}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Support CTA Box */}
            <div className="mt-16 p-8 rounded-[var(--radius)] bg-[var(--surface)] border border-[var(--line)] text-center">
              <h3 className="text-xl font-bold mb-2">Still have questions?</h3>
              <p className="text-sm text-[var(--text-dim)] mb-6 max-w-md mx-auto">
                Can&apos;t find the answer you&apos;re looking for? Reach out to our customer support desk and we will assist you right away.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <Link href="/contact" className="btn btn-primary btn-small">
                  Contact Support Desk →
                </Link>
                <Link href="/book" className="btn btn-ghost btn-small">
                  Book a cook
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
