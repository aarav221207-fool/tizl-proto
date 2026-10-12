import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { bookingService } from '@/services/booking.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, ForbiddenError } from '@/lib/errors';

const createBookingSchema = z.object({
  service_id: z.string().min(1, 'Service ID is required'),
  address_id: z.string().optional(),
  address_text: z.string().optional(),
  booking_date: z.string().min(1, 'Booking date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  duration_hours: z.number().int().min(1).max(12).default(2),
  guest_count: z.number().int().min(1).max(50).default(2),
  cooking_notes: z.string().max(2000).optional(),
  cook_id: z.string().uuid().nullable().optional(),
  client_request_id: z.string().max(100).optional(),
});

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
    if (user.role === 'cook') {
      throw new ForbiddenError('Partner cooks cannot create customer bookings. Please use a customer account.');
    }

    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid booking request parameters';
      throw new BadRequestError(firstError);
    }

    const supabase = await createClient();

    // Prevent duplicate submission if client_request_id is provided
    const booking = await bookingService.createBooking(supabase, user.id, {
      ...parsed.data,
      address_id: parsed.data.address_id || 'default',
    });

    return successResponse({ booking }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
