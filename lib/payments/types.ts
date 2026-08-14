export type SupportedPaymentProvider = 'paytm' | 'upi';

export type PaymentTransactionStatus = 'pending' | 'captured' | 'failed' | 'refunded';

export interface CreateOrderParams {
  orderId: string;
  amount: number;
  currency?: string;
  customerId: string;
  customerEmail?: string;
  customerPhone?: string;
  bookingId: string;
  callbackUrl?: string;
}

export interface CreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  txnToken?: string;
  upiIntentUrl?: string;
  paymentUrl?: string;
  mid?: string;
  provider: SupportedPaymentProvider;
  rawResponse?: Record<string, unknown>;
}

export interface VerifyPaymentParams {
  orderId: string;
  bookingId: string;
  checksum?: string;
  txnToken?: string;
  paymentId?: string;
}

export interface VerifyPaymentResult {
  isSuccess: boolean;
  status: PaymentTransactionStatus;
  orderId: string;
  paymentId?: string;
  bankTxnId?: string;
  amount?: number;
  currency?: string;
  paymentMode?: string;
  gatewayResponse?: Record<string, unknown>;
  errorMessage?: string;
}

export interface TransactionStatusResult {
  status: PaymentTransactionStatus;
  orderId: string;
  paymentId?: string;
  bankTxnId?: string;
  amount: number;
  currency: string;
  rawResponse: Record<string, unknown>;
}

export interface RefundParams {
  orderId: string;
  refId: string;
  txnId: string;
  refundAmount: number;
  comments?: string;
}

export interface RefundResult {
  isSuccess: boolean;
  refundId: string;
  status: 'SUCCESS' | 'PENDING' | 'FAILURE';
  rawResponse: Record<string, unknown>;
  errorMessage?: string;
}

export interface IPaymentProvider {
  name: SupportedPaymentProvider;
  createOrder(params: CreateOrderParams): Promise<CreateOrderResult>;
  verifyPayment(params: VerifyPaymentParams): Promise<VerifyPaymentResult>;
  getTransactionStatus(orderId: string): Promise<TransactionStatusResult>;
  processRefund(params: RefundParams): Promise<RefundResult>;
  verifyWebhookSignature(payload: Record<string, unknown>, signature: string): boolean;
}
