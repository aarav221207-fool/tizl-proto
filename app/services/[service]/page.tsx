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
    service: string;
  }>;
}

const SERVICE_DISH_SUGGESTIONS: Record<string, string[]> = {
  'breakfast-service': [
    'Aloo / Paneer / Gobi Parathas with Curd',
    'Steamed Idlis & Medu Vadas with Coconut Chutney',
    'Kanda Poha & Vegetable Upma',
    'Masala Omelette & Toast',
    'Poha / Thepla / Masala Chai',
  ],
  'daily-home-cooking': [
    'Yellow Dal Tadka / Dal Makhani',
    'Seasonal Sabzi (Bhindi, Aloo Gobi, Paneer Bhurji)',
    'Soft Phulkas / Chapatis with Desi Ghee',
    'Jeera Rice or Steamed Basmati',
    'Cucumber Mint Raita & Fresh Salad',
  ],
  'dinner-service': [
    'Shahi Paneer / Butter Chicken',
    'Dal Makhani & Tadka Rice',
    'Hot Tawa Rotis / Parathas',
    'Mixed Vegetable Curry & Dum Aloo',
    'Gulab Jamun / Phirni / Kheer',
  ],
  'weekly-meal-prep': [
    'Chopped & Prepped Vegetables for 5 Days',
    'Multiple Curry Gravy Bases (Tomato, Onion, Cashew)',
    'Boiled Lentils, Rajma & Chole Batches',
    'Storable Theplas, Parathas & Tiffin Boxes',
    'Portioned Healthy Salads & Dressings',
  ],
  'party-cooking': [
    'Starters: Paneer Tikka, Crispy Corn, Kebabs',
    'Main Course: Biryani, Paneer Lababdar, Dal Bukhara',
    'Breads: Naan, Kulchas, Roomali Rotis',
    'Accompaniments: Dahi Bhalla, Special Raitas',
    'Dessert Spread: Halwa, Rabdi, Fruit Custard',
  ],
  'festival-cooking': [
    'Festive Thali Spread & Satvik Preparations',
    'Pooris, Chana & Halwa',
    'Kheer, Shrikhand, Gujiya, or Puran Poli',
    'Rich Vegetable Korma & Paneer Curry',
    'Regional Festive Delicacies (South / North Indian)',
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { service: serviceSlug } = await params;
  const cleanName = serviceSlug.replace(/-/g, ' ');
  const supabase = getSupabase();
  if (!supabase) return { title: 'Tizl Services' };

  const { data: service } = await supabase
    .from('services')
    .select('*')
    .ilike('service_name', `%${cleanName}%`)
    .eq('is_active', true)
    .maybeSingle();

  if (!service) {
    return { title: 'Service Not Found | Tizl' };
  }

  const sName = service.service_name || service.name;
  const title = `${sName} by Verified Home Cooks | Tizl`;
  const description = service.description
    ? `${service.description}. Book trusted, Aadhaar-verified cooks for ${sName.toLowerCase()} on demand with Tizl. Starting at ₹${service.base_price}.`
    : `Hire a verified home cook for ${sName.toLowerCase()}. Fast 10-minute dispatch, transparent hourly pricing with Tizl.`;

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
  const { service: serviceSlug } = await params;
  const cleanName = serviceSlug.replace(/-/g, ' ');
  const supabase = getSupabase();

  if (!supabase) {
    notFound();
  }

  // 1. Fetch Service
  const { data: serviceRaw, error: serviceError } = await supabase
    .from('services')
    .select('*')
    .ilike('service_name', `%${cleanName}%`)
    .eq('is_active', true)
    .maybeSingle();

  if (serviceError || !serviceRaw) {
    notFound();
  }

  const service = {
    ...serviceRaw,
    name: serviceRaw.service_name || serviceRaw.name,
    duration_hours: serviceRaw.default_duration || serviceRaw.duration_hours || 1,
  };

  // 2. Fetch Active Cities
  const { data: cities } = await supabase
    .from('cities')
    .select('*')
    .eq('is_active', true)
    .order('name', { ascending: true });

  // 3. Fetch Other Services
  const { data: otherServicesRaw } = await supabase
    .from('services')
    .select('*')
    .eq('is_active', true)
    .neq('id', service.id)
    .order('base_price', { ascending: true });

  const otherServices = (otherServicesRaw || []).map((s: any) => ({
    ...s,
    name: s.service_name || s.name,
    duration_hours: s.default_duration || s.duration_hours || 1,
  }));

  const sampleDishes = SERVICE_DISH_SUGGESTIONS[serviceSlug] || [
    'Customized to your regional taste and dietary preferences',
    'Cooked with your fresh household ingredients & spices',
    'Clean kitchen countertop handover guaranteed',
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: `${service.name} — Home Cooking by Tizl`,
    provider: {
      '@type': 'Organization',
      name: 'Tizl',
      url: 'https://tizl.in',
    },
    description: service.description || `Professional ${service.name.toLowerCase()} at home.`,
    areaServed: cities?.map((c) => ({
      '@type': 'City',
      name: c.name,
    })) || [],
    offers: {
      '@type': 'Offer',
      price: service.base_price,
      priceCurrency: 'INR',
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
              <span>Services</span>
              <span>/</span>
              <span className="text-[var(--ink)] font-semibold">{service.name}</span>
            </nav>
          </div>
        </div>

        {/* Hero Section */}
        <section className="hero py-16 md:py-20">
          <div className="wrap">
            <div className="max-w-3xl">
              <div className="eyebrow-label">On-Demand Culinary Package</div>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                Hire a Cook for <em>{service.name}.</em>
              </h1>
              <p className="text-lg md:text-xl text-[var(--text-dim)] leading-relaxed mb-8">
                {service.description || `Enjoy wholesome, freshly prepared ${service.name.toLowerCase()} in your kitchen. Verified cooks dispatched in as little as 10 minutes.`}
              </p>
              <div className="flex flex-wrap gap-4 items-center">
                <Link
                  href={`/book?service=${serviceSlug}`}
                  className="btn btn-primary"
                >
                  Book {service.name} now →
                </Link>
                <Link href="#cities" className="btn btn-ghost">
                  Check city availability
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Package Highlights Strip */}
        <div className="border-y border-[var(--line)] bg-[var(--surface)] py-8">
          <div className="wrap">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center font-bold text-xl flex-none">
                  ⏱️
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">Standard Duration</h4>
                  <p className="text-xs text-[var(--text-dim)]">Typically ~{service.duration_hours} hour(s) of active cooking</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--gold-dim)] text-[var(--gold)] flex items-center justify-center font-bold text-xl flex-none">
                  ₹
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">Base Package Price</h4>
                  <p className="text-xs text-[var(--text-dim)]">Starts at ₹{service.base_price} · Transparent hourly billing</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[var(--green-dim)] text-[var(--green)] flex items-center justify-center font-bold text-xl flex-none">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[var(--ink)]">Cooked in Your Kitchen</h4>
                  <p className="text-xs text-[var(--text-dim)]">Your pots, your oil, tailored to your spice preference</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* What's Included & Sample Menu */}
        <section className="py-20 bg-[#ffffff]">
          <div className="wrap">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              {/* Left: What to Expect */}
              <div className="lg:col-span-6 space-y-6">
                <div className="section-head mb-6">
                  <div className="eyebrow-label">What is included</div>
                  <h2 className="text-3xl font-bold">What to expect with this booking</h2>
                </div>

                <div className="space-y-4 text-sm md:text-base text-[var(--text-dim)] leading-relaxed">
                  <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--line)]">
                    <h3 className="font-bold text-base text-[var(--ink)] mb-1">1. Customized Taste &amp; Diet</h3>
                    <p className="text-xs md:text-sm">
                      Tell your cook whether you prefer mild or fiery spice, pure ghee or cold-pressed mustard oil, low salt, Jain, or diabetic-friendly preparations.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--line)]">
                    <h3 className="font-bold text-base text-[var(--ink)] mb-1">2. Complete Preparation</h3>
                    <p className="text-xs md:text-sm">
                      From chopping and sauteing to kneading dough, rolling phulkas, and simmering rich gravies, your cook manages the entire culinary workflow.
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-[var(--paper)] border border-[var(--line)]">
                    <h3 className="font-bold text-base text-[var(--ink)] mb-1">3. Clean Countertop Handover</h3>
                    <p className="text-xs md:text-sm">
                      Once all dishes are served or packed into storage containers, the cook wipes down the gas stove, counter, and cutting boards, leaving your kitchen tidy.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Sample Dishes Card */}
              <div className="lg:col-span-6">
                <div className="bg-[var(--surface-blue)] border border-[var(--blue-dim)] p-8 md:p-10 rounded-[var(--radius)]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold text-[var(--blue-deep)]">Sample Dishes Prepared</h3>
                    <span className="text-2xl">🍲</span>
                  </div>

                  <p className="text-xs md:text-sm text-[var(--ink)] mb-6">
                    Our verified cooks can prepare any home recipes of your choice. Popular requests for {service.name} include:
                  </p>

                  <ul className="space-y-3">
                    {sampleDishes.map((dish, i) => (
                      <li key={i} className="flex items-center gap-3 bg-white p-3.5 rounded-xl border border-[var(--blue-dim)] text-xs md:text-sm font-medium text-[var(--ink)]">
                        <span className="w-6 h-6 rounded-full bg-[var(--blue-dim)] text-[var(--blue)] flex items-center justify-center font-bold text-xs flex-none">
                          {i + 1}
                        </span>
                        <span>{dish}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8 pt-6 border-t border-[var(--blue-dim)]">
                    <Link
                      href={`/book?service=${serviceSlug}`}
                      className="btn btn-primary btn-full py-3.5 font-semibold text-center"
                    >
                      Book a cook for this menu →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Operating Cities for this Service */}
        {cities && cities.length > 0 && (
          <section className="py-20 bg-[var(--surface)] border-t border-[var(--line)]" id="cities">
            <div className="wrap">
              <div className="section-head mb-12">
                <div className="eyebrow-label">Where we operate</div>
                <h2 className="text-3xl md:text-4xl font-bold">Book {service.name} in Your City</h2>
                <p>Select your city to check live cook availability and book for your home.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {cities.map((city) => (
                  <Link
                    key={city.id}
                    href={`/cooks/${city.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="p-5 rounded-2xl bg-white border border-[var(--line)] hover:border-[var(--blue)] hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="text-xs font-mono text-[var(--text-faint)] uppercase">{city.state}</div>
                      <h4 className="font-bold text-base text-[var(--ink)] mt-1">{city.name}</h4>
                    </div>
                    <div className="mt-4 text-xs font-semibold text-[var(--blue)] flex items-center gap-1">
                      View cooks →
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Other Services Section */}
        {otherServices.length > 0 && (
          <section className="py-16 bg-[#ffffff] border-t border-[var(--line)]">
            <div className="wrap">
              <h3 className="text-xl font-bold mb-6">Explore Other Tizl Cooking Packages</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {otherServices.map((os: any) => {
                  const oSlug = os.name.toLowerCase().replace(/\s+/g, '-');
                  return (
                    <Link
                      key={os.id}
                      href={`/services/${oSlug}`}
                      className="p-6 rounded-2xl bg-[var(--paper)] border border-[var(--line)] hover:border-[var(--blue)] transition-all block"
                    >
                      <h4 className="font-bold text-base mb-1">{os.name}</h4>
                      <p className="text-xs text-[var(--text-dim)] line-clamp-2 mb-3">
                        {os.description || `Fresh ${os.name.toLowerCase()} prepared in your kitchen.`}
                      </p>
                      <div className="text-xs font-mono font-bold text-[var(--blue)]">
                        Starts at ₹{os.base_price} →
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </>
  );
}
