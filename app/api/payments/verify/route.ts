import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { paymentService } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    if (!body.orderId) {
      throw new BadRequestError('Missing orderId parameter');
    }

    const verificationResult = await paymentService.verifyPayment(supabase, {
      orderId: body.orderId,
      bookingId: body.bookingId,
      checksum: body.checksum,
      txnToken: body.txnToken,
      paymentId: body.paymentId,
    });

    return successResponse({ result: verificationResult });
  } catch (err) {
    return errorResponse(err);
  }
}
