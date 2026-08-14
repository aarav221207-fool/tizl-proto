import { SupabaseClient } from '@supabase/supabase-js';
import { Database, PaymentStatus } from '@/types/database';
import { paymentsRepository } from '@/repositories/payments.repository';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { getPaymentProvider, defaultPaymentProvider } from '@/lib/payments';
import { BadRequestError, NotFoundError } from '@/lib/errors';

export interface InitiatePaymentRequest {
  bookingId: string;
  customerId: string;
  providerName?: string;
  paymentMethod?: 'UPI' | 'PAYTM_PG' | 'NET_BANKING' | 'CARDS';
  callbackUrl?: string;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  orderId: string;
  bookingId: string;
  amount: number;
  currency: string;
  provider: string;
  txnToken?: string;
  paymentUrl?: string;
  upiIntentUrl?: string;
  mid?: string;
}

export interface VerifyPaymentPayload {
  orderId: string;
  bookingId?: string;
  checksum?: string;
  txnToken?: string;
  paymentId?: string;
}

export class PaymentService {
  /**
   * Generates a unique order ID for Paytm / UPI transactions
   */
  public generateOrderId(bookingNumber?: string): string {
    const timestamp = Date.now();
    const prefix = bookingNumber ? bookingNumber.replace(/[^a-zA-Z0-9]/g, '') : 'TZL';
    const random = Math.floor(1000 + Math.random() * 9000);
    return `ORD_${prefix}_${timestamp}_${random}`;
  }

  /**
   * Initiates a real Paytm / UPI transaction and persists pending record in Supabase
   */
  async initiatePayment(
    client: SupabaseClient<Database>,
    request: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> {
    const { bookingId, customerId, providerName = 'paytm', callbackUrl } = request;

    // 1. Fetch booking to ensure customer ownership and retrieve exact server-side computed amount
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    if (booking.customer_id !== customerId) {
      throw new BadRequestError('Customer unauthorized to pay for this booking');
    }

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new BadRequestError(`Cannot initiate payment for a booking with status '${booking.status}'`);
    }

    // 2. Fetch customer profile info for Paytm gateway payload
    const { data: customerProfile } = await client
      .from('profiles')
      .select('email, phone')
      .eq('id', customerId)
      .single();

    const provider = getPaymentProvider(providerName);
    const orderId = this.generateOrderId(booking.booking_number);
    const amount = booking.total_amount || 598;

    // 3. Initiate transaction via Provider (Paytm / UPI)
    const providerOrder = await provider.createOrder({
      orderId,
      amount,
      currency: 'INR',
      customerId,
      customerEmail: customerProfile?.email || undefined,
      customerPhone: customerProfile?.phone || undefined,
      bookingId,
      callbackUrl,
    });

    // 4. Persist payment record in Supabase database
    const paymentRecord = await paymentsRepository.createPaymentRecord(client, {
      booking_id: bookingId,
      customer_id: customerId,
      provider: provider.name,
      provider_order_id: orderId,
      txn_token: providerOrder.txnToken || null,
      amount,
      currency: 'INR',
      status: 'pending',
      method: request.paymentMethod || 'UPI',
      raw_response: (providerOrder.rawResponse as Record<string, unknown>) || null,
    });

    return {
      paymentId: paymentRecord.id,
      orderId,
      bookingId,
      amount,
      currency: 'INR',
      provider: provider.name,
      txnToken: providerOrder.txnToken,
      paymentUrl: providerOrder.paymentUrl,
      upiIntentUrl: providerOrder.upiIntentUrl,
      mid: providerOrder.mid,
    };
  }

  /**
   * Verifies a payment result from client or server query
   */
  async verifyPayment(
    client: SupabaseClient<Database>,
    payload: VerifyPaymentPayload
  ): Promise<{ success: boolean; status: PaymentStatus; bookingId: string; orderId: string }> {
    const payment = await paymentsRepository.getPaymentByOrderId(client, payload.orderId);
    if (!payment) {
      throw new NotFoundError(`Payment record not found for order: ${payload.orderId}`);
    }

    const provider = getPaymentProvider(payment.provider);
    const verificationResult = await provider.verifyPayment({
      orderId: payload.orderId,
      bookingId: payment.booking_id,
      checksum: payload.checksum,
      txnToken: payload.txnToken || payment.txn_token || undefined,
      paymentId: payload.paymentId,
    });

    // Server-side amount verification to prevent client tampering
    let isSuccess = verificationResult.isSuccess;
    if (isSuccess && typeof verificationResult.amount === 'number' && verificationResult.amount > 0) {
      if (Math.abs(verificationResult.amount - payment.amount) > 0.01) {
        console.error(
          `Payment amount mismatch for order ${payload.orderId}: expected ₹${payment.amount}, received ₹${verificationResult.amount}`
        );
        isSuccess = false;
      }
    }

    const newPaymentStatus: PaymentStatus = isSuccess ? 'captured' : 'failed';

    // Update payment record in database
    await paymentsRepository.updatePaymentStatus(client, payment.id, newPaymentStatus, {
      providerPaymentId: verificationResult.paymentId,
      bankTxnId: verificationResult.bankTxnId,
      rawResponse: verificationResult.gatewayResponse,
    });

    // If payment was successfully captured and matches booking amount, advance booking state
    if (isSuccess && payment.status !== 'captured') {
      await bookingsRepository.updateBookingStatus(
        client,
        payment.booking_id,
        'searching',
        payment.customer_id,
        `Payment captured via ${payment.provider.toUpperCase()} (${payload.orderId})`
      );
    }

    return {
      success: isSuccess,
      status: newPaymentStatus,
      bookingId: payment.booking_id,
      orderId: payload.orderId,
    };
  }

  /**
   * Handles incoming Paytm webhook / callback asynchronously and idempotently
   */
  async handlePaytmWebhook(
    client: SupabaseClient<Database>,
    payload: Record<string, unknown>
  ): Promise<{ processed: boolean; orderId?: string }> {
    const orderId = (payload.ORDERID as string) || (payload.orderId as string);
    const checksum = (payload.CHECKSUMHASH as string) || (payload.signature as string);

    if (!orderId) {
      throw new BadRequestError('Invalid webhook payload: Missing ORDERID');
    }

    const payment = await paymentsRepository.getPaymentByOrderId(client, orderId);
    if (!payment) {
      return { processed: false };
    }

    // Idempotency: If payment is already captured, do not re-process
    if (payment.status === 'captured') {
      return { processed: true, orderId };
    }

    // Strict Checksum Verification: Reject webhook if signature is missing or invalid
    if (!checksum) {
      throw new BadRequestError('Missing Paytm CHECKSUMHASH signature in webhook payload');
    }

    const isValidSignature = defaultPaymentProvider.verifyWebhookSignature(payload, checksum);
    if (!isValidSignature) {
      console.error(`Paytm webhook signature verification failed for order ${orderId}`);
      throw new BadRequestError('Invalid Paytm CHECKSUMHASH signature');
    }

    // Verify amount in webhook payload against server-side payment record
    const webhookAmount = parseFloat((payload.TXNAMOUNT as string) || (payload.amount as string) || '0');
    if (webhookAmount > 0 && Math.abs(webhookAmount - payment.amount) > 0.01) {
      console.error(
        `Paytm webhook amount mismatch for order ${orderId}: expected ₹${payment.amount}, received ₹${webhookAmount}`
      );
      await paymentsRepository.updatePaymentStatus(client, payment.id, 'failed', {
        providerPaymentId: (payload.TXNID as string) || payment.provider_payment_id || undefined,
        bankTxnId: (payload.BANKTXNID as string) || payment.bank_txn_id || undefined,
        rawResponse: payload,
      });
      throw new BadRequestError('Paytm payment amount mismatch against booking record');
    }

    const statusStr = ((payload.STATUS as string) || (payload.resultStatus as string) || '').toUpperCase();
    const isSuccess = statusStr === 'TXN_SUCCESS';
    const newStatus: PaymentStatus = isSuccess ? 'captured' : 'failed';

    if (payment.status !== newStatus) {
      await paymentsRepository.updatePaymentStatus(client, payment.id, newStatus, {
        providerPaymentId: (payload.TXNID as string) || payment.provider_payment_id || undefined,
        bankTxnId: (payload.BANKTXNID as string) || payment.bank_txn_id || undefined,
        rawResponse: payload,
        method: (payload.PAYMENTMODE as string) || payment.method || 'UPI',
      });

      if (isSuccess) {
        await bookingsRepository.updateBookingStatus(
          client,
          payment.booking_id,
          'searching',
          'system',
          `Payment verified via Paytm Webhook (${orderId})`
        );
      }
    }

    return { processed: true, orderId };
  }

  /**
   * Processes a refund through the provider and updates Supabase
   */
  async processRefund(
    client: SupabaseClient<Database>,
    bookingId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; refundId: string }> {
    const payment = await paymentsRepository.getPaymentByBookingId(client, bookingId);
    if (!payment) {
      throw new NotFoundError('No payment record found for this booking');
    }

    if (payment.status !== 'captured') {
      throw new BadRequestError('Cannot refund a payment that is not captured');
    }

    const provider = getPaymentProvider(payment.provider);
    const refundRefId = `REF_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const refundResult = await provider.processRefund({
      orderId: payment.provider_order_id,
      refId: refundRefId,
      txnId: payment.provider_payment_id || payment.provider_order_id,
      refundAmount: amount || payment.amount,
      comments: reason,
    });

    if (refundResult.isSuccess) {
      await client
        .from('payments')
        .update({
          status: 'refunded',
          refund_id: refundResult.refundId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id);

      await bookingsRepository.updateBookingStatus(
        client,
        bookingId,
        'refunded',
        adminId,
        `Payment refunded: ₹${amount} (Ref: ${refundResult.refundId})`
      );
    }

    return {
      success: refundResult.isSuccess,
      refundId: refundResult.refundId,
    };
  }
}

export const paymentService = new PaymentService();
