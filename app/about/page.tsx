import type { Metadata } from 'next';
import Link from 'next/link';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'About Tizl — Reimagining Daily Home Cooking in India | Tizl',
  description: 'Discover Tizl’s mission: bringing fresh, wholesome, home-cooked food to every household while empowering trusted culinary partners with dignity and fair earnings.',
  alternates: {
    canonical: 'https://tizl.in/about',
  },
  openGraph: {
    title: 'About Tizl — Reimagining Daily Home Cooking in India',
    description: 'Discover Tizl’s mission: bringing fresh, wholesome, home-cooked food to every household while empowering trusted culinary partners with dignity and fair earnings.',
    url: 'https://tizl.in/about',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About Tizl — Reimagining Daily Home Cooking in India',
    description: 'Discover Tizl’s mission: bringing fresh, wholesome, home-cooked food to every household while empowering trusted culinary partners with dignity and fair earnings.',
  },
};

const PILLARS = [
  {
    icon: '🛡️',
    title: 'Trust & Safety First',
    desc: 'Every cook on the Tizl platform undergoes mandatory Aadhaar biometric identity verification and local police background clearance before accepting bookings. We never compromise on household security.',
  },
  {
    icon: '🤝',
    title: 'Dignity for Cook Partners',
    desc: 'Traditional informal domestic cooking often suffers from exploitation, arbitrary salary deductions, and lack of respect. Tizl ensures fair hourly rates, automated digital payouts, and professional respect for all cook partners.',
  },
  {
    icon: '🍳',
    title: 'Your Pots, Your Taste',
    desc: 'Unlike ghost kitchens and restaurant delivery that use excess oil and heavy preservatives, Tizl cooks prepare food right in your kitchen using your chosen groceries, spices, and cookware.',
  },
  {
    icon: '⚡',
    title: 'On-Demand Reliability',
    desc: 'No more unannounced cook leaves that ruin your morning. Tizl delivers quick 10-minute dispatch when you need meals urgently, plus instant re-dispatch if any partner encounters an unexpected emergency.',
  },
];

const STATS = [
  { value: '10 min', label: 'Average on-demand dispatch speed' },
  { value: '100%', label: 'Aadhaar & police background checked' },
  { value: '8 Cities', label: 'Active across major Indian metropolitan areas' },
  { value: '₹0', label: 'Advance deposits or hidden lock-in contracts' },
];

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Tizl',
    url: 'https://tizl.in',
    logo: 'https://tizl.in/icon.png',
    description: 'On-demand home cooking platform in India connecting households with verified culinary partners.',
    foundingDate: '2024',
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'India',
    },
    sameAs: [
      'https://www.linkedin.com/company/tizl',
      'https://www.instagram.com/tizl.in',
    ],
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
              <span className="text-[var(--ink)] font-semibold">About Tizl</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero py-16 md:py-24">
          <div className="wrap">
            <div className="max-w-3xl">
              <div className="eyebrow-label">About Tizl</div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Fresh home cooking, <br />
                <em>reimagined for modern India.</em>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-dim)] leading-relaxed mb-8">
                We believe that eating wholesome, comforting, home-cooked food should not require hours of kitchen labor or stressful negotiations with unreliable informal domestic staff.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link href="/book" className="btn btn-primary">
                  Book a cook now →
                </Link>
                <Link href="/how-it-works" className="btn btn-ghost">
                  See how it works
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Strip */}
        <div className="border-y border-[var(--line)] bg-[var(--surface)] py-12">
          <div className="wrap">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {STATS.map((s, idx) => (
                <div key={idx} className="p-4">
                  <div className="font-mono text-3xl md:text-4xl font-bold text-[var(--blue)] mb-2">
                    {s.value}
                  </div>
                  <div className="text-xs md:text-sm text-[var(--text-dim)] font-medium">
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* The Problem & Solution Story */}
        <section className="py-20 bg-[#ffffff]">
          <div className="wrap">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="eyebrow-label">The Genesis</div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Why urban India needed a third alternative.
                </h2>
                <div className="space-y-4 text-[var(--text-dim)] leading-relaxed text-base">
                  <p>
                    For decades, households faced two imperfect options: spend hundreds of rupees every meal on restaurant delivery that leaves you sluggish, or hire an informal cook who frequently cancels at 8 AM, demands advance salary, and offers zero background verification.
                  </p>
                  <p>
                    Meanwhile, thousands of extraordinarily skilled cooks in our neighborhoods lacked predictable hourly income, professional dignity, and fair working environments.
                  </p>
                  <p>
                    Tizl was born to solve both problems. By creating a technology-powered marketplace with instant dispatch, Aadhaar safety checks, and upfront hourly pricing, we ensure families eat nutritious meals while our cook partners earn transparent, dignified compensation.
                  </p>
                </div>
              </div>

              <div className="bg-[var(--surface-blue)] border border-[var(--blue-dim)] p-8 md:p-10 rounded-[var(--radius)]">
                <h3 className="text-2xl font-bold text-[var(--blue-deep)] mb-4">The Tizl Standard</h3>
                <ul className="space-y-4 text-sm text-[var(--ink)]">
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--blue)] font-bold text-lg">✦</span>
                    <div>
                      <strong>On-Demand by the Hour:</strong> Book a 1-hour breakfast or a 4-hour weekly meal prep whenever you need, with no monthly lock-in contracts.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--blue)] font-bold text-lg">✦</span>
                    <div>
                      <strong>Your Own Ingredients:</strong> You choose the cooking medium (desi ghee, mustard, olive oil) and salt levels. Zero restaurant additives.
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-[var(--blue)] font-bold text-lg">✦</span>
                    <div>
                      <strong>Automated Quality Checks:</strong> We maintain strict customer rating thresholds and instant support resolution for total peace of mind.
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Core Pillars */}
        <section className="py-20 bg-[var(--paper)] border-t border-[var(--line)]">
          <div className="wrap">
            <div className="section-head mb-16">
              <div className="eyebrow-label">Our Principles</div>
              <h2 className="text-3xl md:text-4xl font-bold">Built on trust, speed, and fairness</h2>
              <p>Every feature we build and every operational policy we enforce serves our community.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {PILLARS.map((p, idx) => (
                <div key={idx} className="p-8 rounded-[var(--radius)] bg-[#ffffff] border border-[var(--line)] shadow-sm">
                  <div className="text-3xl mb-4">{p.icon}</div>
                  <h3 className="text-xl font-bold mb-3">{p.title}</h3>
                  <p className="text-[var(--text-dim)] text-sm md:text-base leading-relaxed">
                    {p.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cook Partner Callout Banner */}
        <section className="py-20 bg-[var(--surface-blue)] border-y border-[var(--blue-dim)]">
          <div className="wrap">
            <div className="max-w-3xl mx-auto text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--blue)] mb-3 inline-block font-mono">
                Join our partner community
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-[var(--ink)] mb-4">
                Are you a skilled cook looking for flexible, dignified work?
              </h2>
              <p className="text-[var(--text-dim)] text-base mb-8">
                Tizl partners enjoy transparent weekly payouts, choose their preferred operating areas and hours, and receive respectful customer treatment with 24/7 partner support.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link href="/partner/signup" className="btn btn-primary">
                  Become a cook partner →
                </Link>
                <Link href="/contact?topic=partner" className="btn btn-ghost">
                  Partner support desk
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
