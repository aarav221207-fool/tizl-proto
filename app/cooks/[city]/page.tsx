import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Helper to get Supabase client safely
const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

interface Props {
  params: Promise<{
    city: string;
  }>;
}

// Generate metadata dynamically
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const citySlug = resolvedParams.city;
  const cityName = citySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const supabase = getSupabase();
  if (!supabase) {
    return { title: 'Tizl' };
  }

  const { data: city } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', cityName.replace(/-/g, ' '))
    .eq('is_active', true)
    .single();

  if (!city) {
    return {
      title: 'City Not Found | Tizl',
    };
  }

  const title = `Book a Home Cook in ${city.name} | Tizl`;
  const description = `Looking for a home cook in ${city.name}? Book verified, trusted cooks for breakfast, lunch, dinner, and parties in ${city.name} through Tizl.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://tizl.in/cooks/${citySlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://tizl.in/cooks/${citySlug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function CityCooksPage({ params }: Props) {
  const resolvedParams = await params;
  const citySlug = resolvedParams.city;
  const cityName = citySlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const supabase = getSupabase();
  if (!supabase) {
    notFound();
  }

  // Fetch city to ensure it's active
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', cityName.replace(/-/g, ' '))
    .eq('is_active', true)
    .single();

  if (cityError || !city) {
    notFound();
  }

  // Fetch active services
  const { data: services } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('base_price', { ascending: true });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tizl',
    url: `https://tizl.in/cooks/${citySlug}`,
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://tizl.in/book',
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen flex flex-col pt-[72px]">
        {/* Navigation - simple version referencing the main CSS structure */}
        <nav className="nav">
          <div className="nav-container">
            <Link href="/" className="logo">tizl</Link>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/partner/signup">Become a cook</Link>
              <Link href="/login" className="btn btn-ghost">Log in</Link>
              <Link href="/book" className="btn btn-primary">Book a cook</Link>
            </div>
          </div>
        </nav>

        <main className="flex-grow">
          {/* Hero Section */}
          <section className="hero">
            <div className="hero-content">
              <h1>Find a Home Cook in {city.name}</h1>
              <p>Book verified, trusted cooks for any meal in {city.name}. Reliable service starting in just 10 minutes.</p>
              <div className="hero-cta">
                <Link href="/book" className="btn btn-primary">
                  Book a cook now
                </Link>
              </div>
            </div>
          </section>

          {/* Services Section */}
          {services && services.length > 0 && (
            <section className="how-it-works" style={{ backgroundColor: '#fff' }}>
              <div className="section-header">
                <h2>Services in {city.name}</h2>
                <p>We offer a variety of cooking services tailored to your needs.</p>
              </div>
              <div className="steps-grid">
                {services.map((service) => (
                  <div key={service.id} className="step-card">
                    <div className="step-icon">🍽️</div>
                    <h3>{service.name}</h3>
                    <p>{service.description || `Enjoy professional ${service.name.toLowerCase()} preparation in the comfort of your home.`}</p>
                    <div style={{ marginTop: '1rem' }}>
                      <Link href={`/services/${service.name.toLowerCase().replace(/\\s+/g, '-')}`} style={{ color: 'var(--blue)', fontWeight: 600 }}>
                        Learn more →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Value Prop Section */}
          <section className="features">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">✓</div>
                <h3>Verified Cooks</h3>
                <p>Every cook in {city.name} undergoes a strict background check and skill verification.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⏱️</div>
                <h3>On-Demand</h3>
                <p>Need someone quickly? Book a cook in {city.name} in as little as 10 minutes.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">⭐</div>
                <h3>Quality Assured</h3>
                <p>Our community rating system ensures you get the best culinary experience.</p>
              </div>
            </div>
          </section>
        </main>

        {/* Minimal Footer */}
        <footer className="footer">
          <div className="footer-content">
            <div className="footer-top">
              <div className="footer-brand">
                <Link href="/" className="logo">tizl</Link>
                <p>The on-demand home cook platform.</p>
              </div>
            </div>
            <div className="footer-bottom">
              <span>Tizl © 2026</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
