import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { paymentService } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, ForbiddenError, TooManyRequestsError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();

    // 1. Role check: only customers or admins can create payment orders
    if (user.role === 'cook') {
      throw new ForbiddenError('Partner cooks cannot initiate customer payment orders.');
    }

    // 2. Distributed Rate Limiting: 10 payment order creations per 15 minutes per customer
    const rateLimitKey = `rate:pay_create:${user.id || getClientIp(req)}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 10, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TooManyRequestsError(
        `Too many payment initiation attempts. Please wait ${rateCheck.resetInSeconds} seconds before retrying.`
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.bookingId) {
      throw new BadRequestError('Missing bookingId parameter');
    }

    const supabase = await createClient();

    // Notice: callbackUrl from client body is explicitly ignored to prevent open redirects.
    // The server constructs the callbackUrl securely using env.NEXT_PUBLIC_APP_URL.
    const paymentOrder = await paymentService.initiatePayment(supabase, {
      bookingId: body.bookingId,
      customerId: user.id,
      providerName: body.providerName || 'paytm',
      paymentMethod: body.paymentMethod || 'UPI',
    });

    return successResponse({ payment: paymentOrder }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
