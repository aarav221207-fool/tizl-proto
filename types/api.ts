export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface CreateBookingRequest {
  serviceId: string;
  addressId: string;
  bookingDate: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  durationHours: number;
  guestCount: number;
  cookingNotes?: string;
}

export interface CreateAddressRequest {
  title?: string;
  houseNumber?: string;
  street?: string;
  landmark?: string;
  locality?: string;
  cityId: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface CreatePaymentOrderRequest {
  bookingId: string;
  paymentMethod?: 'UPI' | 'PAYTM_PG' | 'NET_BANKING' | 'CARDS';
}

export interface VerifyPaymentRequest {
  bookingId: string;
  orderId: string;
  paymentId?: string;
  checksum?: string;
  txnToken?: string;
}

export interface RefundPaymentRequest {
  bookingId: string;
  amount?: number;
  reason?: string;
}

export interface CookRegistrationRequest {
  bio?: string;
  experienceYears: number;
  speciality: string[];
  hourlyRate: number;
  aadhaarNumber?: string;
}
