import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { analyticsService } from '@/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventName = body.event_name || body.eventName || 'page_view';
    const eventData = body.event_data || body.eventData || {};

    let profileId = body.profile_id || body.profileId || null;

    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.id) {
        profileId = user.id;
      }
    } catch {}

    // Extract client IP safely from standard reverse proxy headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : realIp || null;

    // Use admin client to reliably insert analytics event without RLS restrictions
    let dbClient;
    try {
      dbClient = createAdminClient();
    } catch {
      dbClient = await createClient();
    }

    await analyticsService.recordEvent(dbClient, {
      profileId,
      eventName,
      eventData,
      ipAddress,
    });

    return successResponse({ recorded: true });
  } catch (err: any) {
    return errorResponse(err);
  }
}

