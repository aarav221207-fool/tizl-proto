import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://tizl.in';
  
  const routes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ];

  // Initialize Supabase client lazily
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[Sitemap] Supabase environment variables missing. Returning static routes only.');
    return routes;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Fetch active cities
    const { data: cities } = await supabase
      .from('cities')
      .select('name')
      .eq('is_active', true);
      
    if (cities) {
      for (const city of cities) {
        routes.push({
          url: `${baseUrl}/cooks/${city.name.toLowerCase().replace(/\\s+/g, '-')}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }

    // Fetch active services
    const { data: services } = await supabase
      .from('services')
      .select('name')
      .eq('is_active', true);
      
    if (services) {
      for (const service of services) {
        routes.push({
          url: `${baseUrl}/services/${service.name.toLowerCase().replace(/\\s+/g, '-')}`,
          lastModified: new Date(),
          changeFrequency: 'weekly',
          priority: 0.8,
        });
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error);
  }

  return routes;
}
