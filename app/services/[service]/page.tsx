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
    service: string;
  }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const serviceSlug = resolvedParams.service;
  const serviceName = serviceSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const supabase = getSupabase();
  if (!supabase) {
    return { title: 'Tizl' };
  }

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .ilike('name', serviceName.replace(/-/g, ' '))
    .eq('is_active', true)
    .single();

  if (!service) {
    return {
      title: 'Service Not Found | Tizl',
    };
  }

  const title = `Book a Home Cook for ${service.name} | Tizl`;
  const description = service.description 
    ? `${service.description} Book trusted cooks on-demand with Tizl.` 
    : `Hire a verified home cook for ${service.name.toLowerCase()}. Quick, reliable, and professional service through Tizl.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://tizl.in/services/${serviceSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://tizl.in/services/${serviceSlug}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const resolvedParams = await params;
  const serviceSlug = resolvedParams.service;
  const serviceName = serviceSlug
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const supabase = getSupabase();
  if (!supabase) {
    notFound();
  }

  // Fetch service to ensure it's active
  const { data: service, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .ilike('name', serviceName.replace(/-/g, ' '))
    .eq('is_active', true)
    .single();

  if (serviceError || !service) {
    notFound();
  }

  // Fetch active cities for internal linking
  const { data: cities } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} Home Cooking`,
    provider: {
      '@type': 'Organization',
      name: 'Tizl',
      url: 'https://tizl.in'
    },
    description: service.description || `Professional ${service.name.toLowerCase()} cooking service at your home.`,
    areaServed: cities?.map(c => ({
      '@type': 'City',
      name: c.name
    })) || []
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      <div className="min-h-screen flex flex-col pt-[72px]">
        {/* Navigation */}
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
              <h1>Hire a Cook for {service.name}</h1>
              <p>{service.description || `Enjoy professional ${service.name.toLowerCase()} prepared fresh in your own kitchen by verified cooks.`}</p>
              <div className="hero-cta">
                <Link href="/book" className="btn btn-primary">
                  Book this service
                </Link>
              </div>
            </div>
          </section>

          {/* Details Section */}
          <section className="features">
            <div className="features-grid">
              <div className="feature-card">
                <div className="feature-icon">⏱️</div>
                <h3>Duration</h3>
                <p>Typically takes around {service.duration_hours} hours to prepare and serve.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🏷️</div>
                <h3>Category</h3>
                <p>Part of our {service.category} offerings for your home.</p>
              </div>
              <div className="feature-card">
                <div className="feature-icon">🛡️</div>
                <h3>Trusted Professionals</h3>
                <p>All cooks are vetted, verified, and community-rated for your peace of mind.</p>
              </div>
            </div>
          </section>

          {/* Locations Section */}
          {cities && cities.length > 0 && (
            <section className="how-it-works" style={{ backgroundColor: '#fff' }}>
              <div className="section-header">
                <h2>Available Locations</h2>
                <p>Find {service.name.toLowerCase()} cooks in your city.</p>
              </div>
              <div className="steps-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                {cities.map((city) => (
                  <div key={city.id} className="step-card" style={{ padding: '1.5rem' }}>
                    <h3>{city.name}</h3>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Link href={`/cooks/${city.name.toLowerCase().replace(/\\s+/g, '-')}`} style={{ color: 'var(--blue)', fontWeight: 600 }}>
                        View cooks →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
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
