import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { servicesRepository } from '@/repositories/services.repository';
import { successResponse, errorResponse } from '@/lib/api-response';

const DEFAULT_SERVICES = [
  {
    id: 'dinner',
    service_name: 'Daily Dinner Preparation',
    name: 'Daily Dinner Preparation',
    description: 'Hot, fresh, wholesome homestyle dinner prepared in your kitchen with your ingredients and spice preference.',
    base_price: 349,
    duration_hours: 2,
    default_duration: 2,
    is_active: true,
  },
  {
    id: 'lunch',
    service_name: 'Afternoon Lunch Prep',
    name: 'Afternoon Lunch Prep',
    description: 'Nourishing dal, fresh rotis, seasonal subzi, and rice cooked fresh for family or packed lunchboxes.',
    base_price: 299,
    duration_hours: 2,
    default_duration: 2,
    is_active: true,
  },
  {
    id: 'breakfast',
    service_name: 'Breakfast & Morning Chai',
    name: 'Breakfast & Morning Chai',
    description: 'Poha, parathas, idlis, dosas, eggs, and freshly brewed beverage prepared before you head out.',
    base_price: 249,
    duration_hours: 1.5,
    default_duration: 1.5,
    is_active: true,
  },
  {
    id: 'party-cooking',
    service_name: 'Party & Gathering Feast',
    name: 'Party & Gathering Feast',
    description: 'Multi-course appetizers, curries, biryanis, and desserts prepared on-site for house parties and guests.',
    base_price: 899,
    duration_hours: 4,
    default_duration: 4,
    is_active: true,
  },
  {
    id: 'meal-prep',
    service_name: 'Weekly Meal Batch Prep',
    name: 'Weekly Meal Batch Prep',
    description: 'Batched gravies, chopped vegetables, kneaded dough, and vacuum-portioned meal preps for busy workweeks.',
    base_price: 649,
    duration_hours: 3,
    default_duration: 3,
    is_active: true,
  },
];

const DEFAULT_CITIES = [
  { id: 'city_delhi', name: 'Delhi', state: 'Delhi NCR', is_active: true },
  { id: 'city_noida', name: 'Noida', state: 'Uttar Pradesh', is_active: true },
  { id: 'city_gurgaon', name: 'Gurgaon', state: 'Haryana', is_active: true },
];

export async function GET() {
  try {
    let services: any[] = [];
    let cities: any[] = [];

    try {
      const supabase = isSupabaseAdminConfigured ? createAdminClient() : await createClient();
      const [dbServices, dbCities] = await Promise.all([
        servicesRepository.listActiveServices(supabase),
        servicesRepository.listActiveCities(supabase),
      ]);
      services = dbServices || [];
      cities = dbCities || [];
    } catch (dbErr) {
      console.warn('[API /services] Database query failed or unconfigured, returning standard catalog:', dbErr);
    }

    if (!services || services.length === 0) {
      services = DEFAULT_SERVICES;
    }
    if (!cities || cities.length === 0) {
      cities = DEFAULT_CITIES;
    }

    const mappedServices = services.map((s: any) => ({
      ...s,
      name: s.service_name || s.name,
      duration_hours: s.default_duration || s.duration_hours || 1,
    }));

    return successResponse({ services: mappedServices, cities });
  } catch (err) {
    return errorResponse(err);
  }
}
