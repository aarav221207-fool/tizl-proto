import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { paymentsRepository } from '@/repositories/payments.repository';
import { paymentService } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError, ForbiddenError, TooManyRequestsError } from '@/lib/errors';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const user = await authenticateRequest();

    // Rate Limiting: 30 status checks per 15 minutes
    const rateLimitKey = `rate:pay_status:${user.id || getClientIp(req)}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 30, 15 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TooManyRequestsError(
        `Too many status query requests. Please wait ${rateCheck.resetInSeconds} seconds.`
      );
    }

    const supabase = await createClient();

    const payment = await paymentsRepository.getPaymentByOrderId(supabase, orderId);
    if (!payment) {
      throw new NotFoundError('Payment order not found');
    }

    // Customer ownership authorization: Only booking owner or admin can check status
    if (user.role === 'customer' && payment.customer_id !== user.id) {
      throw new ForbiddenError('Access denied: You are not authorized to view this transaction.');
    }
    if (user.role === 'cook') {
      throw new ForbiddenError('Partner cooks cannot access customer transaction records.');
    }

    // Route status confirmation strictly through the central paymentService.verifyPayment logic
    // This ensures order ID, exact amount, currency, and booking state transitions are atomically synchronized.
    let verifiedStatus = payment.status;
    let livePaymentId = payment.provider_payment_id;

    if (payment.status === 'pending') {
      try {
        const verifyResult = await paymentService.verifyPayment(supabase, { orderId });
        verifiedStatus = verifyResult.status;
        if (verifyResult.paymentId) {
          livePaymentId = verifyResult.paymentId;
        }
      } catch (verifyErr) {
        // Log gateway inquiry note without crashing customer status check
        console.warn(`[Payment Status API] Notice verifying order ${orderId}:`, (verifyErr as Error)?.message);
      }
    }

    // Re-fetch latest authoritative payment record
    const latestPayment = (await paymentsRepository.getPaymentByOrderId(supabase, orderId)) || payment;

    return successResponse({
      payment: {
        id: latestPayment.id,
        bookingId: latestPayment.booking_id,
        orderId: latestPayment.provider_order_id,
        paymentId: latestPayment.provider_payment_id || livePaymentId,
        amount: latestPayment.amount,
        currency: latestPayment.currency,
        status: latestPayment.status,
        method: latestPayment.method,
        refundedAmount: (latestPayment as any).refunded_amount || 0,
        refundStatus: (latestPayment as any).refund_status || null,
        createdAt: latestPayment.created_at,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
