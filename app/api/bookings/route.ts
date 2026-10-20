import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { bookingService } from '@/services/booking.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, ForbiddenError, TooManyRequestsError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { z } from 'zod';

const createBookingSchema = z.object({
  service_id: z.string().min(1, 'Service ID is required'),
  address_id: z.string().optional().default('default'),
  address_text: z.string().optional(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Booking date must be YYYY-MM-DD'),
  start_time: z.string().min(1, 'Start time is required'),
  duration_hours: z.number().min(1).max(12).default(2),
  guest_count: z.number().min(1).max(50).default(4),
  cooking_notes: z.string().max(500).optional(),
  cook_id: z.string().uuid().nullable().optional(),
  client_request_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    if (user.role === 'cook') {
      throw new ForbiddenError('Partner cooks cannot create customer bookings. Please use a customer account.');
    }

    // Rate Limiting: 10 booking creations per 15 minutes per customer
    const rateLimitKey = `rate:booking_create:${user.id || getClientIp(req)}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TooManyRequestsError(
        `Too many booking requests. Please wait ${rateCheck.resetInSeconds} seconds before trying again.`
      );
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      throw new BadRequestError('Invalid request body');
    }

    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message || 'Invalid booking request parameters';
      throw new BadRequestError(firstError);
    }

    const supabase = await createClient();
    const booking = await bookingService.createBooking(supabase, user.id, parsed.data);

    return successResponse({ booking }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
