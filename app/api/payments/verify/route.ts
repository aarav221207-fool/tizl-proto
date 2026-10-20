import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { paymentService } from '@/services/payment.service';
import { paymentsRepository } from '@/repositories/payments.repository';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, NotFoundError, ForbiddenError, TooManyRequestsError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();

    // Rate Limiting: 20 verifications per 15 mins
    const rateLimitKey = `rate:pay_verify:${user.id || getClientIp(req)}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 20, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TooManyRequestsError(
        `Too many verification attempts. Please wait ${rateCheck.resetInSeconds} seconds.`
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object' || !body.orderId) {
      throw new BadRequestError('Missing or invalid orderId parameter in request body');
    }

    const supabase = await createClient();

    // Ownership verification: ensure the transaction belongs to the requesting customer (or admin)
    const payment = await paymentsRepository.getPaymentByOrderId(supabase, body.orderId);
    if (!payment) {
      throw new NotFoundError(`Payment record not found for order: ${body.orderId}`);
    }

    if (user.role === 'customer' && payment.customer_id !== user.id) {
      throw new ForbiddenError('Access denied: You are not authorized to verify this transaction.');
    }
    if (user.role === 'cook') {
      throw new ForbiddenError('Partner cooks cannot verify customer payment transactions.');
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
