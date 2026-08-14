import { createClient } from '@/lib/supabase/server';
import { servicesRepository } from '@/repositories/services.repository';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const supabase = await createClient();
    const [services, cities] = await Promise.all([
      servicesRepository.listActiveServices(supabase),
      servicesRepository.listActiveCities(supabase),
    ]);

    return successResponse({ services, cities });
  } catch (err) {
    return errorResponse(err);
  }
}
