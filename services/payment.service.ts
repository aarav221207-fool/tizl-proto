import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { getPaymentProvider, defaultPaymentProvider } from '@/lib/payments';
import { paymentsRepository } from '@/repositories/payments.repository';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { BadRequestError, NotFoundError } from '@/lib/errors';
import { env } from '@/lib/env';

export interface InitiatePaymentRequest {
  bookingId: string;
  customerId: string;
  providerName?: string;
  paymentMethod?: 'UPI' | 'PAYTM_PG' | 'NET_BANKING' | 'CARDS';
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

export interface VerifyPaymentParams {
  orderId: string;
  bookingId?: string;
  checksum?: string;
  txnToken?: string;
  paymentId?: string;
}

export interface VerifyPaymentResult {
  isVerified: boolean;
  status: 'captured' | 'failed' | 'pending';
  orderId: string;
  paymentId?: string;
  bankTxnId?: string;
  amount: number;
  message?: string;
}

export class PaymentService {
  /**
   * Generates a unique, standardized internal order ID: ORD_TZL_<timestamp>_<random>
   */
  generateOrderId(bookingNumber: string): string {
    const cleanNumber = bookingNumber.replace(/[^a-zA-Z0-9]/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    return `ORD_TZL_${Date.now()}_${cleanNumber.slice(-4) || randomSuffix}`;
  }

  /**
   * Authoritative server-side payment order initiation:
   * - Strictly validates booking ownership and server-computed total_amount.
   * - Eliminates unsafe fallback values.
   * - Enforces server-controlled callback URL.
   */
  async initiatePayment(
    client: SupabaseClient<Database>,
    request: InitiatePaymentRequest
  ): Promise<InitiatePaymentResponse> {
    const { bookingId, customerId, providerName = 'paytm' } = request;

    // 1. Authoritative DB fetch of booking
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    // 2. Strict ownership check
    if (booking.customer_id !== customerId) {
      throw new BadRequestError('Customer unauthorized to pay for this booking');
    }

    // 3. State validation
    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new BadRequestError(`Cannot initiate payment for a booking with status '${booking.status}'`);
    }

    // 4. Authoritative amount validation - NEVER fallback to arbitrary default
    const authoritativeAmount = Number(booking.total_amount);
    if (!authoritativeAmount || isNaN(authoritativeAmount) || authoritativeAmount <= 0) {
      throw new BadRequestError(
        'Authoritative booking total amount is invalid or missing in database records. Payment initiation rejected.'
      );
    }

    // 5. Build validated server-controlled callback URL
    const appUrl = (env.NEXT_PUBLIC_APP_URL || 'https://tizl.in').replace(/\/$/, '');
    const authoritativeCallbackUrl = `${appUrl}/api/payments/callback`;

    // 6. Fetch customer profile info for gateway payload
    const { data: customerProfile } = await client
      .from('profiles')
      .select('email, phone')
      .eq('id', customerId)
      .single();

    const provider = getPaymentProvider(providerName);
    const orderId = this.generateOrderId(booking.booking_number);

    // 7. Initiate transaction via Provider (Paytm)
    const providerOrder = await provider.createOrder({
      orderId,
      amount: authoritativeAmount,
      currency: 'INR',
      customerId,
      customerEmail: customerProfile?.email || undefined,
      customerPhone: customerProfile?.phone || undefined,
      bookingId,
      callbackUrl: authoritativeCallbackUrl,
    });

    // 8. Persist payment record in Supabase database
    const paymentRecord = await paymentsRepository.createPaymentRecord(client, {
      booking_id: bookingId,
      customer_id: customerId,
      provider: provider.name,
      provider_order_id: orderId,
      txn_token: providerOrder.txnToken || null,
      amount: authoritativeAmount,
      currency: 'INR',
      status: 'pending',
      method: request.paymentMethod || 'UPI',
      raw_response: (providerOrder.rawResponse as Record<string, unknown>) || null,
    });

    return {
      paymentId: paymentRecord.id,
      orderId,
      bookingId,
      amount: authoritativeAmount,
      currency: 'INR',
      provider: provider.name,
      txnToken: providerOrder.txnToken,
      paymentUrl: providerOrder.paymentUrl,
      upiIntentUrl: providerOrder.upiIntentUrl,
      mid: providerOrder.mid,
    };
  }

  /**
   * Central Authoritative transaction verification:
   * Independently queries Paytm's Transaction Status API and compares
   * order ID, status, exact amount, and currency.
   * If a mismatching response is received, the inconsistent state is quarantined
   * rather than marked failed, preventing accidental overwriting of a valid transaction.
   */
  async verifyPayment(
    client: SupabaseClient<Database>,
    params: VerifyPaymentParams
  ): Promise<VerifyPaymentResult> {
    const { orderId } = params;

    const payment = await paymentsRepository.getPaymentByOrderId(client, orderId);
    if (!payment) {
      throw new NotFoundError(`Payment record not found for order: ${orderId}`);
    }

    // Idempotency: If already captured, return verified without re-updating
    if (payment.status === 'captured') {
      return {
        isVerified: true,
        status: 'captured',
        orderId: payment.provider_order_id,
        paymentId: payment.provider_payment_id || undefined,
        bankTxnId: payment.bank_txn_id || undefined,
        amount: payment.amount,
        message: 'Payment already verified and captured',
      };
    }

    const provider = getPaymentProvider(payment.provider);

    // 1. Authoritative server-to-server inquiry to Paytm Transaction Status API
    const statusResult = await provider.getTransactionStatus(orderId);

    // 2. Strict amount verification: status query amount must match local payment record exactly
    if (statusResult.amount !== undefined && statusResult.amount !== null) {
      const liveAmt = Number(statusResult.amount);
      if (Math.abs(liveAmt - Number(payment.amount)) > 0.01) {
        console.error(
          `[Security Quarantine] Paytm status amount mismatch for order ${orderId}: Expected ₹${payment.amount}, received ₹${liveAmt}`
        );
        // Quarantine the payment record for audit and investigation rather than marking failed
        await client
          .from('payments')
          .update({
            raw_response: {
              ...((payment.raw_response as Record<string, unknown>) || {}),
              quarantine_reason: `Amount mismatch: expected ₹${payment.amount}, received ₹${liveAmt}`,
              quarantine_at: new Date().toISOString(),
              gateway_response: statusResult.rawResponse,
            },
            updated_at: new Date().toISOString(),
          } as any)
          .eq('id', payment.id);

        throw new BadRequestError('Payment amount mismatch between gateway and database. Quarantined for manual review.');
      }
    }

    // 3. Strict currency verification if returned by gateway
    if (statusResult.currency && statusResult.currency !== (payment.currency || 'INR')) {
      console.error(
        `[Security Quarantine] Paytm currency mismatch for order ${orderId}: Expected ${payment.currency}, received ${statusResult.currency}`
      );
      await client
        .from('payments')
        .update({
          raw_response: {
            ...((payment.raw_response as Record<string, unknown>) || {}),
            quarantine_reason: `Currency mismatch: expected ${payment.currency}, received ${statusResult.currency}`,
            quarantine_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', payment.id);

      throw new BadRequestError('Payment currency mismatch between gateway and database.');
    }

    if (statusResult.status === 'captured') {
      // 4. Mark payment captured in database
      await paymentsRepository.updatePaymentStatus(client, payment.id, 'captured', {
        providerPaymentId: statusResult.paymentId,
        bankTxnId: statusResult.bankTxnId,
        rawResponse: statusResult.rawResponse,
      });

      // 5. Transition booking status to 'cook_assigned' and record history
      await bookingsRepository.updateBookingStatus(
        client,
        payment.booking_id,
        'cook_assigned',
        payment.customer_id,
        `Payment verified via Paytm: ${statusResult.paymentId || orderId} (₹${payment.amount})`
      );

      return {
        isVerified: true,
        status: 'captured',
        orderId,
        paymentId: statusResult.paymentId,
        bankTxnId: statusResult.bankTxnId,
        amount: payment.amount,
        message: 'Payment successfully verified and booking confirmed',
      };
    } else if (statusResult.status === 'failed') {
      // Safe failure handling: only update if still pending
      if (payment.status === 'pending') {
        await paymentsRepository.updatePaymentStatus(client, payment.id, 'failed', {
          providerPaymentId: statusResult.paymentId,
          bankTxnId: statusResult.bankTxnId,
          rawResponse: statusResult.rawResponse,
        });
      }

      return {
        isVerified: false,
        status: 'failed',
        orderId,
        paymentId: statusResult.paymentId,
        amount: payment.amount,
        message: statusResult.errorMessage || 'Transaction failed or cancelled at gateway',
      };
    }

    return {
      isVerified: false,
      status: 'pending',
      orderId,
      amount: payment.amount,
      message: 'Transaction is pending or processing',
    };
  }

  /**
   * Webhook & Callback handler:
   * - ALWAYS validates checksum before processing or acknowledging.
   * - If already captured, validates signature first, then returns processed: true with no side effects.
   * - Prevents duplicate or out-of-order events from downgrading captured payments.
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

    // 1. CRITICAL: Strictly authenticate callback signature before anything else
    if (!checksum) {
      throw new BadRequestError('Missing Paytm CHECKSUMHASH signature in webhook payload');
    }

    const isValidSignature = defaultPaymentProvider.verifyWebhookSignature(payload, checksum);
    if (!isValidSignature) {
      console.error(`Paytm webhook signature verification failed for order ${orderId}`);
      throw new BadRequestError('Invalid Paytm CHECKSUMHASH signature');
    }

    // 2. Fetch payment record
    const payment = await paymentsRepository.getPaymentByOrderId(client, orderId);
    if (!payment) {
      return { processed: false };
    }

    // 3. Idempotency: Signature is validated. If already captured, preserve state and do not repeat side effects.
    if (payment.status === 'captured') {
      return { processed: true, orderId };
    }

    // 4. Strict Amount Validation: require valid amount field
    const rawTxnAmt = (payload.TXNAMOUNT as string) || (payload.amount as string);
    if (!rawTxnAmt) {
      throw new BadRequestError('Missing TXNAMOUNT in gateway payload');
    }

    const webhookAmount = parseFloat(rawTxnAmt);
    if (isNaN(webhookAmount) || webhookAmount <= 0) {
      throw new BadRequestError('Invalid or negative TXNAMOUNT in gateway payload');
    }

    if (Math.abs(webhookAmount - Number(payment.amount)) > 0.01) {
      console.error(
        `[Security Quarantine] Paytm webhook amount mismatch for order ${orderId}: expected ₹${payment.amount}, received ₹${webhookAmount}`
      );
      await client
        .from('payments')
        .update({
          raw_response: {
            ...((payment.raw_response as Record<string, unknown>) || {}),
            quarantine_reason: `Webhook amount mismatch: expected ₹${payment.amount}, received ₹${webhookAmount}`,
            quarantine_at: new Date().toISOString(),
          },
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', payment.id);

      throw new BadRequestError('Paytm payment amount mismatch. Quarantined for investigation.');
    }

    // 5. Process status safely
    const status = (payload.STATUS as string) || '';
    if (status === 'TXN_SUCCESS') {
      // Authoritative status verification: perform server-to-server verification check
      await this.verifyPayment(client, { orderId });
    } else if (status === 'TXN_FAILURE') {
      // Safe late failure handling: only update if still pending
      if (payment.status === 'pending') {
        await paymentsRepository.updatePaymentStatus(client, payment.id, 'failed', {
          providerPaymentId: (payload.TXNID as string) || undefined,
          providerSignature: checksum,
          bankTxnId: (payload.BANKTXNID as string) || undefined,
          rawResponse: payload,
        });
      }
    }

    return { processed: true, orderId };
  }

  /**
   * Concurrency-safe refund processing:
   * 1. Requires payment to be in 'captured' state.
   * 2. Atomic database refund reservation is the sole source of truth for cumulative balance.
   * 3. Fails safely if reservation fails—never proceeds with non-atomic fallback.
   * 4. Fails safely if ledger record cannot be created—never submits refund to Paytm.
   * 5. Uses original Paytm transaction ID (txnId).
   * 6. Reconciles timeouts as indeterminate: keeps reservation intact until resolved with Paytm.
   */
  async processRefund(
    client: SupabaseClient<Database>,
    bookingId: string,
    amount: number,
    reason: string,
    adminId: string
  ): Promise<{ success: boolean; refundId: string; status: 'SUCCESS' | 'PENDING' | 'FAILURE'; remainingBalance: number }> {
    const payment = await paymentsRepository.getPaymentByBookingId(client, bookingId);
    if (!payment) {
      throw new NotFoundError('No payment record found for this booking');
    }

    // 1. Must be in captured status
    if (payment.status !== 'captured') {
      throw new BadRequestError(`Cannot refund a payment with status '${payment.status}'. Only captured payments are eligible for refund.`);
    }

    // 2. Validate refund amount is positive and numeric
    const refundAmt = Number(amount);
    if (isNaN(refundAmt) || refundAmt <= 0) {
      throw new BadRequestError('Refund amount must be strictly greater than zero');
    }

    // 3. Verify that actual Paytm transaction ID (txnId) is available
    const txnId = payment.provider_payment_id;
    if (!txnId) {
      throw new BadRequestError('Original Paytm transaction ID (provider_payment_id) is missing. Cannot submit refund to Paytm without provider transaction ID.');
    }

    // 4. ATOMIC DATABASE RESERVATION: The database is the sole source of truth
    const { data: rpcRes, error: rpcErr } = await (client as any).rpc('reserve_refund_balance', {
      p_payment_id: payment.id,
      p_refund_amount: refundAmt,
    });

    if (rpcErr || !rpcRes) {
      console.error('[Refund Reservation Failed]', rpcErr?.message);
      throw new BadRequestError(rpcErr?.message || 'Failed to acquire atomic refund reservation');
    }

    if (!rpcRes.success) {
      throw new BadRequestError(rpcRes.error || 'Refund rejected by reservation constraints');
    }

    // Capture the authoritative state returned by the database atomic reservation
    const authoritativeNewRefundedTotal = Number(rpcRes.new_refunded_total);
    const authoritativeRemainingBalance = Number(rpcRes.remaining_balance);
    const isFullyRefunded = Boolean(rpcRes.is_fully_refunded);

    // 5. LEDGER RECORD CREATION: Durable unique reference
    const refundRefId = `REF_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: refundRecord, error: refundInsertErr } = await client
      .from('payment_refunds')
      .insert({
        payment_id: payment.id,
        booking_id: bookingId,
        admin_id: adminId,
        refund_ref_id: refundRefId,
        amount: refundAmt,
        currency: payment.currency || 'INR',
        status: 'pending',
        reason,
      })
      .select()
      .single();

    if (refundInsertErr || !refundRecord) {
      // Ledger insertion failed: MUST NOT contact Paytm. Rollback reservation safely.
      console.error('[Refund Ledger Failure] Could not persist refund ledger entry:', refundInsertErr?.message);
      try {
        await (client as any).rpc('release_refund_reservation', {
          p_payment_id: payment.id,
          p_refund_amount: refundAmt,
        });
      } catch (rollbackErr) {
        console.error('[Rollback Error] Failed to release reservation after ledger insert failure:', rollbackErr);
      }
      throw new BadRequestError('Refund aborted: Unable to establish durable audit ledger record.');
    }

    // 6. CALL PAYTM REFUND API using real txnId
    const provider = getPaymentProvider(payment.provider);
    let refundResult;
    try {
      refundResult = await provider.processRefund({
        orderId: payment.provider_order_id,
        refId: refundRefId,
        txnId: txnId,
        refundAmount: refundAmt,
        comments: reason,
      });
    } catch (callErr: any) {
      // Indeterminate state / Network error: DO NOT release reservation
      console.error('[Refund Gateway Indeterminate Error] Network/Call failure:', callErr?.message);
      await client
        .from('payment_refunds')
        .update({
          status: 'pending',
          reason: `${reason} (Awaiting reconciliation after timeout: ${callErr?.message})`,
          updated_at: new Date().toISOString(),
        })
        .eq('id', refundRecord.id);

      return {
        success: false,
        refundId: refundRefId,
        status: 'PENDING',
        remainingBalance: authoritativeRemainingBalance,
      };
    }

    // 7. PROCESS DETERMINATE RESULTS
    if (refundResult.status === 'SUCCESS') {
      // Payment record updated with authoritative values from DB reservation
      await client
        .from('payments')
        .update({
          status: isFullyRefunded ? 'refunded' : 'captured',
          refund_id: refundResult.refundId,
          refunded_amount: authoritativeNewRefundedTotal,
          refund_status: isFullyRefunded ? 'full' : 'partial',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', payment.id);

      await client
        .from('payment_refunds')
        .update({
          status: 'successful',
          paytm_refund_id: refundResult.refundId,
          raw_response: refundResult.rawResponse as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('id', refundRecord.id);

      if (isFullyRefunded) {
        await bookingsRepository.updateBookingStatus(
          client,
          bookingId,
          'refunded',
          adminId,
          `Payment fully refunded: ₹${refundAmt} (Ref: ${refundResult.refundId})`
        );
      }

      return {
        success: true,
        refundId: refundResult.refundId,
        status: 'SUCCESS',
        remainingBalance: authoritativeRemainingBalance,
      };
    } else if (refundResult.status === 'PENDING') {
      // Gateway is processing refund asynchronously: keep reservation intact
      await client
        .from('payments')
        .update({
          refund_id: refundResult.refundId,
          refunded_amount: authoritativeNewRefundedTotal,
          refund_status: 'pending',
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', payment.id);

      await client
        .from('payment_refunds')
        .update({
          status: 'pending',
          paytm_refund_id: refundResult.refundId,
          raw_response: refundResult.rawResponse as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('id', refundRecord.id);

      return {
        success: false,
        refundId: refundResult.refundId,
        status: 'PENDING',
        remainingBalance: authoritativeRemainingBalance,
      };
    } else {
      // Gateway confirmed definitive failure (e.g. TXN_FAILURE)
      // Check if the failure is due to a timeout: if timed out, it is indeterminate
      const isTimeout = refundResult.errorMessage?.toLowerCase().includes('timeout') ||
                        refundResult.errorMessage?.toLowerCase().includes('aborted');

      if (isTimeout) {
        // Indeterminate: keep reservation intact for reconciliation
        await client
          .from('payment_refunds')
          .update({
            status: 'pending',
            raw_response: refundResult.rawResponse as Record<string, unknown>,
            reason: `${reason} (Indeterminate gateway response: ${refundResult.errorMessage})`,
            updated_at: new Date().toISOString(),
          })
          .eq('id', refundRecord.id);

        return {
          success: false,
          refundId: refundRefId,
          status: 'PENDING',
          remainingBalance: authoritativeRemainingBalance,
        };
      }

      // Confirmed definitive failure from Paytm: release the atomic reservation
      try {
        await (client as any).rpc('release_refund_reservation', {
          p_payment_id: payment.id,
          p_refund_amount: refundAmt,
        });
      } catch (releaseErr) {
        console.error('[Release Reservation Error]', releaseErr);
      }

      await client
        .from('payment_refunds')
        .update({
          status: 'failed',
          raw_response: refundResult.rawResponse as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        })
        .eq('id', refundRecord.id);

      throw new BadRequestError(
        refundResult.errorMessage || 'Paytm gateway rejected the refund request'
      );
    }
  }
}

export const paymentService = new PaymentService();
