import { IPaymentProvider } from './types';
import { paytmPaymentProvider } from './paytm.provider';

export * from './types';
export * from './paytm-checksum';
export * from './paytm.provider';

export function getPaymentProvider(providerName: string = 'paytm'): IPaymentProvider {
  switch (providerName.toLowerCase()) {
    case 'paytm':
    case 'upi':
    default:
      return paytmPaymentProvider;
  }
}

export const defaultPaymentProvider = paytmPaymentProvider;
