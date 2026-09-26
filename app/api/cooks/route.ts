import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const supabase = isSupabaseAdminConfigured ? createAdminClient() : await createClient();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const cityParam = searchParams.get('city');

    let query = supabase
      .from('cooks')
      .select('id, profile_id, display_name, bio, experience_years, hourly_rate, city_id, average_rating, total_reviews, verification_status, is_approved, is_available, profiles:profile_id(id, full_name, avatar_url), cities:city_id(id, name, state)')
      .eq('is_approved', true)
      .limit(limit);

    if (cityParam) {
      // Check if cityParam matches city_id or city name
      const { data: matchedCity } = await supabase
        .from('cities')
        .select('id')
        .ilike('name', cityParam.replace(/-/g, ' '))
        .maybeSingle();

      if (matchedCity?.id) {
        query = query.eq('city_id', matchedCity.id);
      } else {
        query = query.eq('city_id', cityParam);
      }
    }

    const { data: cooks, error } = await query;

    if (error) throw error;

    const mappedCooks = (cooks || []).map((c: any) => ({
      ...c,
      rating_avg: c.average_rating || 5.0,
      rating_count: c.total_reviews || 0,
      city: c.cities?.name || null,
      full_name: c.display_name || c.profiles?.full_name || 'Verified Cook',
    }));

    return successResponse({ cooks: mappedCooks });
  } catch (err: any) {
    return errorResponse(err);
  }
}
