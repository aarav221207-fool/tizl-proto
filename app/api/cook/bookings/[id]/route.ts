import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { cookService } from '@/services/cook.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const { action, reason, otp } = body;

    if (action === 'accept') {
      const updated = await cookService.acceptBooking(supabase, id, user.id);
      return successResponse({ booking: updated });
    }

    if (action === 'reject') {
      const result = await cookService.rejectBooking(
        supabase,
        id,
        user.id,
        reason || 'Cook unavailable'
      );
      return successResponse(result);
    }

    if (action === 'start_journey') {
      const updated = await cookService.startJourney(supabase, id, user.id);
      return successResponse({ booking: updated });
    }

    if (action === 'arrive') {
      const updated = await cookService.arriveAtCustomer(supabase, id, user.id);
      return successResponse({ booking: updated });
    }

    if (action === 'start_cooking') {
      const updated = await cookService.startCooking(supabase, id, user.id);
      return successResponse({ booking: updated });
    }

    if (action === 'complete') {
      const updated = await cookService.completeBooking(supabase, id, user.id, otp);
      return successResponse({ booking: updated });
    }

    throw new BadRequestError('Invalid or unhandled action specified');
  } catch (err) {
    return errorResponse(err);
  }
}
