import {
  SupportedPaymentProvider,
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  TransactionStatusResult,
  RefundParams,
  RefundResult,
  IPaymentProvider,
} from './types';
import { PaytmChecksum } from './paytm-checksum';
import { env } from '../env';

export class PaytmPaymentProvider implements IPaymentProvider {
  name: SupportedPaymentProvider = 'paytm';
  private mid: string;
  private merchantKey: string;
  private website: string;
  private environment: 'staging' | 'production';
  private callbackUrl: string;

  constructor() {
    this.mid = env.PAYTM_MID || process.env.PAYTM_MID || '';
    this.merchantKey = env.PAYTM_MERCHANT_KEY || process.env.PAYTM_MERCHANT_KEY || '';
    this.website = env.PAYTM_WEBSITE || process.env.PAYTM_WEBSITE || 'DEFAULT';
    this.environment = (env.PAYTM_ENVIRONMENT || process.env.PAYTM_ENVIRONMENT || 'staging') as
      | 'staging'
      | 'production';
    this.callbackUrl =
      env.PAYTM_CALLBACK_URL ||
      process.env.PAYTM_CALLBACK_URL ||
      `${env.NEXT_PUBLIC_APP_URL || 'https://tizl.in'}/api/payments/callback`;
  }

  private get baseUrl(): string {
    return this.environment === 'production'
      ? 'https://securegw.paytm.in'
      : 'https://securegw-stage.paytm.in';
  }

  /**
   * Helper to perform safe HTTPS POST to Paytm with timeout and error wrapping
   */
  private async safePost(endpoint: string, payload: unknown, timeoutMs = 10000): Promise<{ ok: boolean; data: any; error?: string }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!response.ok) {
        return { ok: false, data: null, error: `Paytm gateway HTTP error: ${response.status} ${response.statusText}` };
      }

      const text = await response.text();
      let data: any = {};
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        return { ok: false, data: null, error: 'Malformed JSON response from Paytm gateway' };
      }

      return { ok: true, data };
    } catch (err: any) {
      clearTimeout(timer);
      const isTimeout = err?.name === 'AbortError' || err?.message?.includes('aborted');
      return {
        ok: false,
        data: null,
        error: isTimeout ? 'Paytm gateway request timed out (10s)' : (err?.message || 'Network error reaching Paytm'),
      };
    }
  }

  /**
   * Initiates transaction via official Paytm v1/initiateTransaction API
   */
  async createOrder(params: CreateOrderParams): Promise<CreateOrderResult> {
    if (!this.mid || !this.merchantKey) {
      throw new Error(
        'Paytm credentials missing: PAYTM_MID and PAYTM_MERCHANT_KEY must be configured in environment variables to initiate transactions.'
      );
    }

    const paytmParams = {
      body: {
        requestType: 'Payment',
        mid: this.mid,
        websiteName: this.website,
        orderId: params.orderId,
        callbackUrl: params.callbackUrl || this.callbackUrl,
        txnAmount: {
          value: params.amount.toFixed(2),
          currency: params.currency || 'INR',
        },
        userInfo: {
          custId: params.customerId,
          email: params.customerEmail || undefined,
          mobile: params.customerPhone || undefined,
        },
      },
      head: {
        signature: '',
      },
    };

    // Generate Paytm checksum signature
    const checksum = PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      this.merchantKey
    );
    paytmParams.head.signature = checksum;

    const endpoint = `${this.baseUrl}/theia/api/v1/initiateTransaction?mid=${this.mid}&orderId=${params.orderId}`;
    const result = await this.safePost(endpoint, paytmParams);

    if (!result.ok) {
      throw new Error(result.error);
    }

    const body = result.data.body || {};
    const resultInfo = body.resultInfo || {};

    if (resultInfo.resultStatus !== 'S') {
      throw new Error(
        `Paytm transaction token initiation failed: ${resultInfo.resultMsg || 'Unknown gateway error'} (Code: ${resultInfo.resultCode || 'N/A'})`
      );
    }

    const txnToken = body.txnToken;
    const paymentUrl = `${this.baseUrl}/theia/api/v1/showPaymentPage?mid=${this.mid}&orderId=${params.orderId}&txnToken=${txnToken}`;
    const upiIntentUrl = `upi://pay?pa=paytm-${this.mid}@paytm&pn=Tizl&am=${params.amount.toFixed(2)}&cu=INR&tn=${params.orderId}`;

    return {
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      txnToken,
      paymentUrl,
      upiIntentUrl,
      mid: this.mid,
      provider: 'paytm',
      rawResponse: result.data,
    };
  }

  /**
   * Queries authoritative transaction status via Paytm v3/order/status API
   */
  async getTransactionStatus(orderId: string): Promise<TransactionStatusResult> {
    if (!this.mid || !this.merchantKey) {
      throw new Error(
        'Paytm credentials missing: PAYTM_MID and PAYTM_MERCHANT_KEY must be configured in environment variables to check transaction status.'
      );
    }

    const paytmParams = {
      body: {
        mid: this.mid,
        orderId: orderId,
      },
      head: {
        signature: '',
      },
    };

    const checksum = PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      this.merchantKey
    );
    paytmParams.head.signature = checksum;

    const endpoint = `${this.baseUrl}/v3/order/status`;
    const result = await this.safePost(endpoint, paytmParams);

    if (!result.ok) {
      throw new Error(result.error);
    }

    const body = result.data.body || {};
    const resultInfo = body.resultInfo || {};

    let status: 'pending' | 'captured' | 'failed' = 'pending';
    if (resultInfo.resultStatus === 'TXN_SUCCESS') {
      status = 'captured';
    } else if (resultInfo.resultStatus === 'TXN_FAILURE') {
      status = 'failed';
    }

    return {
      status,
      orderId,
      paymentId: body.txnId,
      bankTxnId: body.bankTxnId,
      amount: parseFloat(body.txnAmount || '0'),
      currency: body.currency || 'INR',
      rawResponse: result.data,
      errorMessage: resultInfo.resultMsg,
    };
  }

  /**
   * Verifies payment result server-to-server with Paytm
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    try {
      const statusRes = await this.getTransactionStatus(params.orderId);
      const isSuccess = statusRes.status === 'captured';

      return {
        isSuccess,
        status: statusRes.status,
        orderId: params.orderId,
        paymentId: statusRes.paymentId,
        bankTxnId: statusRes.bankTxnId,
        amount: statusRes.amount,
        currency: statusRes.currency,
        gatewayResponse: statusRes.rawResponse,
        errorMessage: statusRes.errorMessage,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        isSuccess: false,
        status: 'pending',
        orderId: params.orderId,
        errorMessage: msg,
      };
    }
  }

  /**
   * Submits a refund to Paytm /refund/apply API
   * Notice: Uses actual Paytm transaction ID (txnId) as required by official Paytm API
   */
  async processRefund(params: RefundParams): Promise<RefundResult> {
    if (!this.mid || !this.merchantKey) {
      throw new Error(
        'Paytm credentials missing: PAYTM_MID and PAYTM_MERCHANT_KEY must be configured in environment variables to process refunds.'
      );
    }

    if (!params.txnId) {
      throw new Error('Missing Paytm transaction ID (txnId) for refund. Paytm requires the original txnId.');
    }

    const paytmParams = {
      body: {
        mid: this.mid,
        txnType: 'REFUND',
        orderId: params.orderId,
        txnId: params.txnId,
        refId: params.refId,
        refundAmount: params.refundAmount.toFixed(2),
        comments: params.comments || 'Tizl Booking Refund',
      },
      head: {
        signature: '',
      },
    };

    const checksum = PaytmChecksum.generateSignature(
      JSON.stringify(paytmParams.body),
      this.merchantKey
    );
    paytmParams.head.signature = checksum;

    const endpoint = `${this.baseUrl}/refund/apply`;
    const result = await this.safePost(endpoint, paytmParams);

    if (!result.ok) {
      return {
        isSuccess: false,
        refundId: params.refId,
        status: 'FAILURE',
        rawResponse: {},
        errorMessage: result.error,
      };
    }

    const body = result.data.body || {};
    const resultInfo = body.resultInfo || {};

    // Paytm refund statuses: TXN_SUCCESS, PENDING, TXN_FAILURE
    let status: 'SUCCESS' | 'PENDING' | 'FAILURE' = 'FAILURE';
    if (resultInfo.resultStatus === 'TXN_SUCCESS') {
      status = 'SUCCESS';
    } else if (resultInfo.resultStatus === 'PENDING') {
      status = 'PENDING';
    }

    const isSuccess = status === 'SUCCESS';

    return {
      isSuccess,
      refundId: body.refundId || params.refId,
      status,
      rawResponse: result.data,
      errorMessage: isSuccess ? undefined : resultInfo.resultMsg,
    };
  }

  /**
   * Verifies Webhook or Callback checksum signature using configured server merchant key
   */
  verifyWebhookSignature(payload: Record<string, unknown>, signature: string): boolean {
    const activeKey = process.env.PAYTM_MERCHANT_KEY || this.merchantKey;
    if (!activeKey) {
      console.error('PAYTM_MERCHANT_KEY missing on server: cannot verify webhook signature');
      return false;
    }
    return PaytmChecksum.verifySignature(payload, activeKey, signature);
  }
}

export const paytmPaymentProvider = new PaytmPaymentProvider();
