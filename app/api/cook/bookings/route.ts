import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { cookService } from '@/services/cook.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();

    const bookings = await cookService.getAssignedBookings(supabase, user.id);
    return successResponse({ bookings });
  } catch (err) {
    return errorResponse(err);
  }
}
