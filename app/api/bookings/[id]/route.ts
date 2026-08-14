import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { bookingService } from '@/services/booking.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    const supabase = await createClient();

    const booking = await bookingService.getBookingDetails(supabase, id);

    // Authorization check
    if (user.role === 'customer' && booking.customer_id !== user.id) {
      throw new BadRequestError('Unauthorized to view this booking');
    }
    if (user.role === 'cook' && booking.cook_id !== user.id) {
      throw new BadRequestError('Unauthorized to view this booking');
    }

    return successResponse({ booking });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const { action, reason, new_status, remarks, cook_id, otp } = body;

    if (action === 'cancel') {
      if (!reason) {
        throw new BadRequestError('Cancellation reason is required');
      }
      const cancelledBooking = await bookingService.cancelBooking(
        supabase,
        id,
        user.id,
        reason
      );
      return successResponse({ booking: cancelledBooking });
    }

    if (action === 'assign_cook') {
      if (!cook_id) {
        throw new BadRequestError('Cook ID is required');
      }
      const assignedBooking = await bookingService.assignCook(
        supabase,
        id,
        cook_id,
        user.id
      );
      return successResponse({ booking: assignedBooking });
    }

    if (action === 'complete') {
      const completedBooking = await bookingService.completeBooking(
        supabase,
        id,
        user.id,
        otp
      );
      return successResponse({ booking: completedBooking });
    }

    if (new_status) {
      const updatedBooking = await bookingService.updateBookingStatus(
        supabase,
        id,
        new_status,
        user.id,
        remarks
      );
      return successResponse({ booking: updatedBooking });
    }

    throw new BadRequestError('Invalid update action');
  } catch (err) {
    return errorResponse(err);
  }
}

