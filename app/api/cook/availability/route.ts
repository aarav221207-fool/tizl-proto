import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { cookService } from '@/services/cook.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();

    const availability = await cookService.getAvailability(supabase, user.id);
    return successResponse(availability);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const { is_online } = body;
    const updated = await cookService.updateAvailability(supabase, user.id, Boolean(is_online));
    return successResponse(updated);
  } catch (err) {
    return errorResponse(err);
  }
}
