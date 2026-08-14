import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { paymentsRepository } from '@/repositories/payments.repository';
import { getPaymentProvider } from '@/lib/payments';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NotFoundError } from '@/lib/errors';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    await authenticateRequest();
    const supabase = await createClient();

    const payment = await paymentsRepository.getPaymentByOrderId(supabase, orderId);
    if (!payment) {
      throw new NotFoundError('Payment order not found');
    }

    const provider = getPaymentProvider(payment.provider);
    const liveStatus = await provider.getTransactionStatus(orderId);

    return successResponse({
      payment: {
        id: payment.id,
        bookingId: payment.booking_id,
        orderId: payment.provider_order_id,
        paymentId: payment.provider_payment_id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        liveStatus: liveStatus.status,
        method: payment.method,
        createdAt: payment.created_at,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
