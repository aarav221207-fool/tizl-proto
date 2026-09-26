import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';

const getSupabase = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

interface Props {
  params: Promise<{
    city: string;
  }>;
}

// Map alias slugs
function normalizeCitySlug(slug: string): string {
  const s = slug.toLowerCase().trim();
  if (s === 'bangalore') return 'bengaluru';
  if (s === 'delhi-ncr') return 'delhi';
  return s;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { city: rawSlug } = await params;
  const citySlug = normalizeCitySlug(rawSlug);
  const supabase = getSupabase();
  if (!supabase) return { title: 'Tizl — Book a Cook' };

  const { data: city } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', `%${citySlug.replace(/-/g, ' ')}%`)
    .eq('is_active', true)
    .maybeSingle();

  if (!city) {
    return {
      title: 'City Not Found | Tizl',
    };
  }

  const title = `Book a Home Cook in ${city.name} in 10 Minutes | Tizl`;
  const description = `Find verified, trusted home cooks in ${city.name}, ${city.state}. Book breakfast, lunch, dinner, weekly meal prep, and party cooks with transparent hourly pricing.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://tizl.in/cooks/${rawSlug}`,
    },
    openGraph: {
      title,
      description,
      url: `https://tizl.in/cooks/${rawSlug}`,
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
  const { city: rawSlug } = await params;
  const citySlug = normalizeCitySlug(rawSlug);
  const supabase = getSupabase();

  if (!supabase) {
    notFound();
  }

  // 1. Fetch City
  const { data: city, error: cityError } = await supabase
    .from('cities')
    .select('*')
    .ilike('name', `%${citySlug.replace(/-/g, ' ')}%`)
    .eq('is_active', true)
    .maybeSingle();

  if (cityError || !city) {
    notFound();
  }

  // 2. Fetch Active Services
  const { data: servicesRaw } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .order('base_price', { ascending: true });

  const services = (servicesRaw || []).map((s: any) => ({
    ...s,
    name: s.service_name || s.name,
    duration_hours: s.default_duration || s.duration_hours || 1,
  }));

  // 3. Fetch Verified Cooks in this city
  const { data: cooks } = await supabase
    .from('cooks')
    .select(`
      id,
      profile_id,
      display_name,
      bio,
      experience_years,
      hourly_rate,
      average_rating,
      total_reviews,
      is_available,
      is_approved,
      profiles:profile_id (id, full_name, avatar_url)
    `)
    .eq('city_id', city.id)
    .eq('is_approved', true)
    .limit(10);

  // 4. Fetch other active cities for internal linking
  const { data: otherCities } = await supabase
    .from('cities')
    .select('id, name, state')
    .eq('is_active', true)
    .neq('id', city.id)
    .order('name', { ascending: true });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: `Tizl Home Cooks — ${city.name}`,
    description: `On-demand verified home cooking service in ${city.name}, ${city.state}.`,
    url: `https://tizl.in/cooks/${rawSlug}`,
    telephone: '+91-9811000000',
    areaServed: {
      '@type': 'City',
      name: city.name,
      containedInPlace: {
        '@type': 'State',
        name: city.state,
      },
    },
    priceRange: '₹349 - ₹3000',
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
              <span>Cooks</span>
              <span>/</span>
              <span className="text-[var(--ink)] font-semibold">{city.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero py-16 md:py-20">
          <div className="wrap">
            <div className="max-w-3xl">
              <div className="eyebrow-label">Verified Cooks · {city.name}, {city.state}</div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Book a Home Cook in <em>{city.name}.</em>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-dim)] leading-relaxed mb-8">
                Enjoy hot, hygienic, home-cooked food in your own kitchen across {city.name}. Whether you need everyday breakfast, a week of tiffin prep, or a feast for 10 friends, our Aadhaar-verified cooks arrive in about 10 minutes.
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  href={`/book?city=${encodeURIComponent(city.name)}`}
                  className="btn btn-primary"
                >
                  Book a cook in {city.name} now →
                </Link>
                <Link href="#services" className="btn btn-ghost">
                  View cooking packages
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* City Highlights Bar */}
        <div className="border-y border-[var(--line)] bg-[var(--surface)] py-8">
          <div className="wrap">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center font-bold text-xl flex-none">
                  ⚡
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">~10 Minute Dispatch</h4>
                  <p className="text-xs text-[var(--text-dim)]">Fast pairing with nearby partners in {city.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center font-bold text-xl flex-none">
                  🛡️
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">100% Aadhaar &amp; Police Checked</h4>
                  <p className="text-xs text-[var(--text-dim)]">Vetted for complete household safety</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--gold-dim)] text-[var(--gold)] flex items-center justify-center font-bold text-xl flex-none">
                  ₹
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">Transparent Hourly Pricing</h4>
                  <p className="text-xs text-[var(--text-dim)]">From ₹349/hr · No advance deposit</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Real Cooks in this City */}
        <section className="py-20 bg-[#ffffff]">
          <div className="wrap">
            <div className="section-head mb-12">
              <div className="eyebrow-label">Local culinary partners</div>
              <h2 className="text-3xl md:text-4xl font-bold">Verified Cooks in {city.name}</h2>
              <p>Every cook has undergone in-person identity verification and kitchen skills assessment.</p>
            </div>

            {cooks && cooks.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {cooks.map((c: any) => {
                  const cookName = c.display_name || c.profiles?.full_name || 'Verified Cook';
                  const initials = cookName.slice(0, 2).toUpperCase();
                  const rating = c.average_rating ? Number(c.average_rating).toFixed(1) : '4.9';

                  return (
                    <div
                      key={c.id}
                      className="p-6 rounded-[var(--radius)] border border-[var(--line)] bg-[var(--paper)] hover:border-[var(--blue)] transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-4 mb-4">
                          <div className="w-12 h-12 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center font-bold text-base">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-base text-[var(--ink)] flex items-center gap-1.5">
                              {cookName}
                              <span className="text-xs text-[var(--blue)]">✓ Verified</span>
                            </div>
                            <div className="text-xs text-[var(--text-dim)]">
                              {c.experience_years ? `${c.experience_years} yrs exp` : 'Experienced'} · ⭐ {rating} ({c.total_reviews || 0})
                            </div>
                          </div>
                        </div>

                        <p className="text-xs md:text-sm text-[var(--text-dim)] line-clamp-3 mb-4">
                          {c.bio || `Specialized in North Indian, South Indian, and tiffin preparations in ${city.name}.`}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[var(--line)] flex justify-between items-center">
                        <span className="text-xs font-mono font-bold text-[var(--blue-deep)]">
                          ₹{c.hourly_rate || 349}/hr
                        </span>
                        <Link
                          href={`/book?city=${encodeURIComponent(city.name)}&cookId=${c.id}`}
                          className="btn btn-primary btn-small text-xs"
                        >
                          Book this cook
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* High-fidelity empty state using Tizl design */
              <div className="empty-state p-10 rounded-[var(--radius)] bg-[var(--paper)] border border-[var(--line)] max-w-2xl mx-auto">
                <div className="ic">🍳</div>
                <h3 className="text-2xl font-bold mb-3">Instant Dispatch Available in {city.name}</h3>
                <p className="text-sm text-[var(--text-dim)] leading-relaxed mb-6">
                  Our network of verified cooks in {city.name} are currently out fulfilling live household meal bookings. When you request a booking, our system automatically routes the closest available verified partner directly to your kitchen in about 10 minutes.
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link
                    href={`/book?city=${encodeURIComponent(city.name)}`}
                    className="btn btn-primary"
                  >
                    Request an instant cook in {city.name} →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Services in this City */}
        {services.length > 0 && (
          <section className="py-20 bg-[var(--surface)] border-t border-[var(--line)]" id="services">
            <div className="wrap">
              <div className="section-head mb-12">
                <div className="eyebrow-label">Available options</div>
                <h2 className="text-3xl md:text-4xl font-bold">Cooking Services in {city.name}</h2>
                <p>Select your required meal package. Transparent hourly rates apply across {city.name}.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {services.map((svc: any) => {
                  const serviceSlug = svc.name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <div
                      key={svc.id}
                      className="p-8 rounded-[var(--radius)] bg-[#ffffff] border border-[var(--line)] hover:border-[var(--blue)] transition-all shadow-sm flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="text-3xl">🍽️</span>
                          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-[var(--surface-blue)] text-[var(--blue-deep)]">
                            ~{svc.duration_hours} hr
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{svc.name}</h3>
                        <p className="text-xs md:text-sm text-[var(--text-dim)] leading-relaxed mb-6">
                          {svc.description || `Wholesome ${svc.name.toLowerCase()} prepared fresh in your kitchen.`}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-[var(--line)] flex justify-between items-center">
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-[var(--text-faint)]">Starts at</div>
                          <div className="font-bold text-lg font-mono text-[var(--blue)]">₹{svc.base_price}</div>
                        </div>
                        <Link
                          href={`/book?city=${encodeURIComponent(city.name)}&service=${serviceSlug}`}
                          className="btn btn-primary btn-small text-xs"
                        >
                          Book in {city.name}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Other Cities Links for Internal SEO Hierarchy */}
        {otherCities && otherCities.length > 0 && (
          <section className="py-16 bg-[#ffffff] border-t border-[var(--line)]">
            <div className="wrap">
              <h3 className="text-lg font-bold mb-6">Explore Tizl Cooks in Other Cities</h3>
              <div className="flex flex-wrap gap-3">
                {otherCities.map((oc: any) => (
                  <Link
                    key={oc.id}
                    href={`/cooks/${oc.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="px-4 py-2 rounded-full border border-[var(--line)] bg-[var(--paper)] hover:bg-[var(--surface-blue)] hover:border-[var(--blue)] text-xs font-medium transition-all"
                  >
                    Cooks in {oc.name} →
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
