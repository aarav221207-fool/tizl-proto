import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { paymentService } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    if (!body.bookingId) {
      throw new BadRequestError('Missing bookingId parameter');
    }

    const paymentOrder = await paymentService.initiatePayment(supabase, {
      bookingId: body.bookingId,
      customerId: user.id,
      providerName: body.providerName || 'paytm',
      paymentMethod: body.paymentMethod || 'UPI',
      callbackUrl: body.callbackUrl,
    });

    return successResponse({ payment: paymentOrder }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
