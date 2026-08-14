import { env } from '@/lib/env';
import { PaytmChecksum } from './paytm-checksum';
import {
  IPaymentProvider,
  CreateOrderParams,
  CreateOrderResult,
  VerifyPaymentParams,
  VerifyPaymentResult,
  TransactionStatusResult,
  RefundParams,
  RefundResult,
  SupportedPaymentProvider,
} from './types';

export class PaytmPaymentProvider implements IPaymentProvider {
  public readonly name: SupportedPaymentProvider = 'paytm';

  private get mid(): string {
    return process.env.PAYTM_MID || env.PAYTM_MID || '';
  }

  private get merchantKey(): string {
    return process.env.PAYTM_MERCHANT_KEY || env.PAYTM_MERCHANT_KEY || '';
  }

  private get website(): string {
    return process.env.PAYTM_WEBSITE || env.PAYTM_WEBSITE || 'DEFAULT';
  }

  private get isStaging(): boolean {
    const environment = process.env.PAYTM_ENVIRONMENT || env.PAYTM_ENVIRONMENT;
    return environment !== 'production';
  }

  private get baseUrl(): string {
    return this.isStaging
      ? 'https://securegw-stage.paytm.in'
      : 'https://securegw.paytm.in';
  }

  private get callbackUrl(): string {
    return (
      process.env.PAYTM_CALLBACK_URL ||
      env.PAYTM_CALLBACK_URL ||
      'https://tizl.in/api/payments/callback'
    );
  }

  /**
   * Initiates a transaction on Paytm Payment Gateway and returns txnToken + checkout URLs
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paytmParams),
    });

    const data = await response.json();
    const body = data.body || {};
    const resultInfo = body.resultInfo || {};

    if (resultInfo.resultStatus !== 'S') {
      throw new Error(
        `Paytm initiateTransaction failed: ${resultInfo.resultMsg || 'Unknown error'} (Code: ${resultInfo.resultCode})`
      );
    }

    const txnToken = body.txnToken;
    const paymentUrl = `${this.baseUrl}/theia/api/v1/showPaymentPage?mid=${this.mid}&orderId=${params.orderId}&txnToken=${txnToken}`;
    const upiIntentUrl = `paytmmp://pay?mid=${this.mid}&orderId=${params.orderId}&txnToken=${txnToken}`;

    return {
      orderId: params.orderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      txnToken,
      paymentUrl,
      upiIntentUrl,
      mid: this.mid,
      provider: 'paytm',
      rawResponse: data,
    };
  }

  /**
   * Queries Paytm Order Status API to verify payment state
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paytmParams),
    });

    const data = await response.json();
    const body = data.body || {};
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
      rawResponse: data,
    };
  }

  /**
   * Verifies payment result server-to-server with Paytm
   */
  async verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult> {
    const statusResult = await this.getTransactionStatus(params.orderId);

    const isSuccess = statusResult.status === 'captured';

    return {
      isSuccess,
      status: statusResult.status,
      orderId: params.orderId,
      paymentId: statusResult.paymentId || params.paymentId,
      bankTxnId: statusResult.bankTxnId,
      amount: statusResult.amount,
      currency: statusResult.currency,
      gatewayResponse: statusResult.rawResponse,
      errorMessage: isSuccess ? undefined : 'Payment verification failed or was not captured',
    };
  }

  /**
   * Processes a refund via Paytm Refund API
   */
  async processRefund(params: RefundParams): Promise<RefundResult> {
    if (!this.mid || !this.merchantKey) {
      throw new Error(
        'Paytm credentials missing: PAYTM_MID and PAYTM_MERCHANT_KEY must be configured in environment variables to process refunds.'
      );
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

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paytmParams),
    });

    const data = await response.json();
    const body = data.body || {};
    const resultInfo = body.resultInfo || {};

    const isSuccess = resultInfo.resultStatus === 'TXN_SUCCESS';

    return {
      isSuccess,
      refundId: body.refundId || params.refId,
      status: isSuccess ? 'SUCCESS' : 'FAILURE',
      rawResponse: data,
      errorMessage: isSuccess ? undefined : resultInfo.resultMsg,
    };
  }

  /**
   * Verifies Webhook or Callback signature from Paytm
   */
  verifyWebhookSignature(payload: Record<string, unknown>, signature: string): boolean {
    if (!this.merchantKey || !signature) return false;
    return PaytmChecksum.verifySignature(payload, this.merchantKey, signature);
  }
}

export const paytmPaymentProvider = new PaytmPaymentProvider();
