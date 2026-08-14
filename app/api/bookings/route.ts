import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { bookingService } from '@/services/booking.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();

    if (user.role === 'cook') {
      const bookings = await bookingsRepository.getCookBookings(supabase, user.id);
      return successResponse({ bookings });
    }

    const bookings = await bookingsRepository.getCustomerBookings(supabase, user.id);
    return successResponse({ bookings });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const booking = await bookingService.createBooking(supabase, user.id, body);

    return successResponse({ booking }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

