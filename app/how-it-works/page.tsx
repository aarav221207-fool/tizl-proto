import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'How Tizl Works — Book a Verified Cook in 10 Minutes | Tizl',
  description: 'Understand how Tizl brings verified home cooks to your kitchen on demand. Upfront hourly pricing, Aadhaar verification, fresh meals, and clean counter guaranteed.',
  alternates: {
    canonical: 'https://tizl.in/how-it-works',
  },
  openGraph: {
    title: 'How Tizl Works — Book a Verified Cook in 10 Minutes',
    description: 'Understand how Tizl brings verified home cooks to your kitchen on demand. Upfront hourly pricing, Aadhaar verification, and fresh meals.',
    url: 'https://tizl.in/how-it-works',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'How Tizl Works — Book a Verified Cook in 10 Minutes',
    description: 'Understand how Tizl brings verified home cooks to your kitchen on demand. Upfront hourly pricing, Aadhaar verification, and fresh meals.',
  },
};

const STEPS = [
  {
    num: '01',
    title: 'Choose your meal requirement',
    desc: 'Select what you need: quick weekday breakfast, lunch and tiffin prep, hearty family dinner, weekly meal prep, or a party feast for 15 friends. Specify the number of people and any dietary preferences like less spice, Jain, or diabetic-friendly.',
    badge: '10+ Meal Types',
    highlights: ['Headcount customization', 'Dietary instructions input', 'Custom menu flexibility'],
  },
  {
    num: '02',
    title: 'See upfront pricing & schedule time',
    desc: 'Transparent pricing with zero surprises. You see the exact hourly charge before confirming: ₹349 for 1 hr, ₹499 for 1.5 hr, ₹649 for 2 hr, and ₹999 for 3 hr. Choose on-demand arrival in ~10 minutes, or pick a specific time slot later today.',
    badge: 'No Advance Deposit',
    highlights: ['Zero hidden platform fees', 'Exact upfront rates', 'Flexible 10-min or scheduled slots'],
  },
  {
    num: '03',
    title: 'Aadhaar-verified cook arrives at your door',
    desc: 'Tizl pairs you with a trained, trusted cook who has completed comprehensive Aadhaar verification and a police background check. Track your cook’s status directly from your dashboard.',
    badge: '100% Background Checked',
    highlights: ['Police & identity verified', 'Ongoing customer quality rating', 'Hygiene standards enforced'],
  },
  {
    num: '04',
    title: 'Fresh cooking, clean kitchen, pay after',
    desc: 'Your cook prepares wholesome food using your fresh groceries and utensils, seasoned exactly to your liking. Once the cooking is finished, the cook wipes down the countertop and stove. You pay digitally only after completion.',
    badge: 'Satisfaction First',
    highlights: ['Clean countertop handover', 'Cooked in your own cookware', 'Digital payment after cooking'],
  },
];

const COMPARISON = [
  {
    criterion: 'Punctuality & Reliability',
    tizl: 'Automated dispatch with instant reassignment if an emergency occurs.',
    maid: 'Frequent unannounced leaves, awkward calls, no backup cook.',
    delivery: 'Delays in traffic, cold food upon arrival.',
  },
  {
    criterion: 'Safety & Trust',
    tizl: '100% Aadhaar verified + police verification + active rating checks.',
    maid: 'Usually zero background checks, relies on word-of-mouth.',
    delivery: 'Different delivery stranger at door every day.',
  },
  {
    criterion: 'Pricing Structure',
    tizl: 'Pay-as-you-go hourly (from ₹349). No monthly commitment.',
    maid: 'Fixed monthly fee + advance demand + festival bonus expectation.',
    delivery: '₹300 - ₹600 per single meal with packaging & delivery taxes.',
  },
  {
    criterion: 'Health & Ingredients',
    tizl: 'Cooked fresh with your own chosen oil, vegetables, and spices.',
    maid: 'Often rushes through or overuses oil if unsupervised.',
    delivery: 'Reused commercial palm oil, high sodium, hidden additives.',
  },
];

export default function HowItWorksPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to Book a Cook with Tizl',
    description: 'Step-by-step guide on booking an on-demand verified home cook in India with Tizl.',
    step: STEPS.map((s, idx) => ({
      '@type': 'HowToStep',
      position: idx + 1,
      name: s.title,
      text: s.desc,
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
              <span className="text-[var(--ink)] font-semibold">How It Works</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero py-16 md:py-24">
          <div className="wrap">
            <div className="max-w-3xl">
              <div className="eyebrow-label">How Tizl Works</div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Fresh, hot meals at home. <br />
                <em>Without the daily hassle.</em>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-dim)] leading-relaxed mb-8">
                Tizl is designed for busy households, working professionals, and families who love home-cooked food but don’t want the endless headaches of managing an unreliable direct cook.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/book" className="btn btn-primary">
                  Book a cook in 10 minutes →
                </Link>
                <Link href="/services/daily-home-cooking" className="btn btn-ghost">
                  Explore services
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 4-Step Process Section */}
        <section className="py-20 bg-[#ffffff] border-y border-[var(--line)]" id="steps">
          <div className="wrap">
            <div className="section-head mb-16">
              <div className="eyebrow-label">Step-by-step process</div>
              <h2 className="text-3xl md:text-4xl font-bold">Four simple steps to your meal</h2>
              <p>Everything is handled seamlessly through the Tizl platform, from pairing to post-service payment.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {STEPS.map((step) => (
                <div
                  key={step.num}
                  className="p-8 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] hover:border-[var(--blue)] transition-all shadow-sm flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-center mb-6">
                      <span className="font-mono text-2xl font-bold text-[var(--blue)]">{step.num}</span>
                      <span className="text-xs font-semibold uppercase px-3 py-1 rounded-full bg-[var(--surface-blue)] text-[var(--blue-deep)] border border-[var(--blue-dim)]">
                        {step.badge}
                      </span>
                    </div>
                    <h3 className="text-xl md:text-2xl font-bold mb-3">{step.title}</h3>
                    <p className="text-[var(--text-dim)] text-sm md:text-base leading-relaxed mb-6">
                      {step.desc}
                    </p>
                  </div>

                  <div className="border-t border-[var(--line)] pt-4">
                    <ul className="text-xs md:text-sm text-[var(--text-dim)] space-y-2">
                      {step.highlights.map((h, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <span className="text-[var(--green)] font-bold">✓</span> {h}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kitchen Responsibilities: What You Provide vs What We Bring */}
        <section className="py-20 bg-[var(--surface)]">
          <div className="wrap">
            <div className="section-head mb-12">
              <div className="eyebrow-label">Kitchen prep guide</div>
              <h2 className="text-3xl md:text-4xl font-bold">What to have ready in your kitchen</h2>
              <p>Keep your kitchen stocked with basics so your cook can start sizzling immediately.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* You Provide */}
              <div className="bg-[#ffffff] p-8 rounded-[var(--radius)] border border-[var(--line)] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[var(--gold-dim)] text-[var(--gold)] flex items-center justify-center font-bold text-lg">
                    🏠
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">What you provide</h3>
                    <p className="text-xs text-[var(--text-dim)]">Standard household groceries &amp; cookware</p>
                  </div>
                </div>

                <ul className="space-y-3 text-sm text-[var(--ink)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--blue)] font-bold">•</span>
                    <span><strong>Fresh Ingredients:</strong> Vegetables, grains, atta, lentils, paneer, chicken or eggs of your choice.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--blue)] font-bold">•</span>
                    <span><strong>Cooking Basics:</strong> Cooking oil/ghee, salt, turmeric, and your preferred spices.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--blue)] font-bold">•</span>
                    <span><strong>Utensils:</strong> Pots, pans, tawa, pressure cooker, chopping board, knife.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--blue)] font-bold">•</span>
                    <span><strong>Utilities:</strong> Functioning gas stove/induction cooktop and clean running water.</span>
                  </li>
                </ul>
              </div>

              {/* Tizl Delivers */}
              <div className="bg-[#ffffff] p-8 rounded-[var(--radius)] border border-[var(--line)] shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-full bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center font-bold text-lg">
                    ⚡
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">What Tizl brings</h3>
                    <p className="text-xs text-[var(--text-dim)]">Professional skill, hygiene, and reliability</p>
                  </div>
                </div>

                <ul className="space-y-3 text-sm text-[var(--ink)]">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--green)] font-bold">✓</span>
                    <span><strong>Verified Talent:</strong> Trained home cook with verified identity and culinary track record.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--green)] font-bold">✓</span>
                    <span><strong>Personal Taste Matching:</strong> Prepared specifically to your spice, oil, and salt preference.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--green)] font-bold">✓</span>
                    <span><strong>Clean Counter Handover:</strong> Countertop, gas stove, and cutting area wiped clean post-cooking.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--green)] font-bold">✓</span>
                    <span><strong>Support &amp; Reassignment:</strong> Instant backup match if unexpected delays ever arise.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-20 bg-[#ffffff] border-t border-[var(--line)]">
          <div className="wrap">
            <div className="section-head mb-12">
              <div className="eyebrow-label">Comparison</div>
              <h2 className="text-3xl md:text-4xl font-bold">Why households choose Tizl</h2>
              <p>Compare the on-demand Tizl experience with hiring directly or ordering restaurant takeout.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse border border-[var(--line)] rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-[var(--surface)] text-[var(--ink)] border-b border-[var(--line)] text-sm">
                    <th className="p-4 font-bold">Feature</th>
                    <th className="p-4 font-bold text-[var(--blue)] bg-[var(--surface-blue)] border-x border-[var(--blue-dim)]">
                      Tizl Cook (On-Demand)
                    </th>
                    <th className="p-4 font-bold text-[var(--text-dim)]">Direct Maid / Local Cook</th>
                    <th className="p-4 font-bold text-[var(--text-dim)]">Food Delivery Apps</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)] text-sm">
                  {COMPARISON.map((row, idx) => (
                    <tr key={idx} className="hover:bg-[var(--paper)]">
                      <td className="p-4 font-bold text-[var(--ink)]">{row.criterion}</td>
                      <td className="p-4 text-[var(--blue-deep)] bg-[var(--surface-blue)]/50 border-x border-[var(--blue-dim)] font-medium">
                        {row.tizl}
                      </td>
                      <td className="p-4 text-[var(--text-dim)]">{row.maid}</td>
                      <td className="p-4 text-[var(--text-dim)]">{row.delivery}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="py-20 bg-[var(--ink-2)] text-white">
          <div className="wrap text-center max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Experience the joy of fresh cooking today.
            </h2>
            <p className="text-[#AEB3C7] text-base md:text-lg mb-8">
              No advance deposits. No complicated contracts. Book verified cooks in Delhi NCR, Mumbai, Bengaluru, Hyderabad, and more.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link href="/book" className="btn btn-blue font-semibold text-base px-8 py-3.5">
                Book a cook now
              </Link>
              <Link href="/faq" className="btn btn-ghost font-semibold text-white border-white/20 hover:border-white">
                Read FAQs
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
