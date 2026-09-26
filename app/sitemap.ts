import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

const FALLBACK_CITIES = [
  'delhi',
  'mumbai',
  'bengaluru',
  'hyderabad',
  'pune',
  'chennai',
  'ahmedabad',
  'kolkata',
];

const FALLBACK_SERVICES = [
  'daily-home-cooking',
  'breakfast-service',
  'dinner-service',
  'weekly-meal-prep',
  'party-cooking',
  'festival-cooking',
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tizl.in';
  const lastModified = new Date();

  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/how-it-works`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/about`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/partner/signup`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let citySlugs = new Set<string>(FALLBACK_CITIES);
  let serviceSlugs = new Set<string>(FALLBACK_SERVICES);

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch active cities from DB
      const { data: dbCities } = await supabase
        .from('cities')
        .select('name')
        .eq('is_active', true);

      if (dbCities && dbCities.length > 0) {
        citySlugs = new Set(
          dbCities.map((c) => c.name.toLowerCase().trim().replace(/\s+/g, '-'))
        );
      }

      // Fetch active services from DB
      const { data: dbServices } = await supabase
        .from('services')
        .select('service_name, name')
        .eq('is_active', true);

      if (dbServices && dbServices.length > 0) {
        serviceSlugs = new Set(
          dbServices.map((s: any) => {
            const raw = s.service_name || s.name || '';
            return raw.toLowerCase().trim().replace(/\s+/g, '-');
          }).filter(Boolean)
        );
      }
    } catch (err) {
      console.warn('[Sitemap] Database fetch failed, using fallback catalog:', err);
    }
  }

  // Append city routes
  citySlugs.forEach((slug) => {
    routes.push({
      url: `${baseUrl}/cooks/${slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  // Append service routes
  serviceSlugs.forEach((slug) => {
    routes.push({
      url: `${baseUrl}/services/${slug}`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.8,
    });
  });

  return routes;
}
