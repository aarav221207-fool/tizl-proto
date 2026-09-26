import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { servicesRepository } from '@/repositories/services.repository';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const supabase = isSupabaseAdminConfigured ? createAdminClient() : await createClient();
    const [services, cities] = await Promise.all([
      servicesRepository.listActiveServices(supabase),
      servicesRepository.listActiveCities(supabase),
    ]);

    const mappedServices = (services || []).map((s: any) => ({
      ...s,
      name: s.service_name || s.name,
      duration_hours: s.default_duration || s.duration_hours || 1,
    }));

    return successResponse({ services: mappedServices, cities });
  } catch (err) {
    return errorResponse(err);
  }
}
