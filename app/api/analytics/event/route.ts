import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { analyticsService } from '@/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const eventName = body.event_name || body.eventName || 'page_view';
    const eventData = body.event_data || body.eventData || {};

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Prioritize authenticated user profile ID
    const profileId = user?.id || body.profile_id || body.profileId || null;

    // Extract client IP safely from standard reverse proxy headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ipAddress = forwardedFor
      ? forwardedFor.split(',')[0].trim()
      : realIp || null;

    await analyticsService.recordEvent(supabase, {
      profileId,
      eventName,
      eventData,
      ipAddress,
    });

    return successResponse({ recorded: true });
  } catch (err) {
    return errorResponse(err);
  }
}
