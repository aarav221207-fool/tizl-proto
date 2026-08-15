import { SupabaseClient } from '@supabase/supabase-js';
import { Database, PaymentStatus } from '@/types/database';
import { BaseRepository } from './base.repository';

export class PaymentsRepository extends BaseRepository<'payments'> {
  constructor() {
    super('payments');
  }

  async createPaymentRecord(
    client: SupabaseClient<Database>,
    paymentData: Database['public']['Tables']['payments']['Insert']
  ) {
    const { data, error } = await client
      .from('payments')
      .insert(paymentData)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create payment record');
    }

    return data;
  }

  async getPaymentByOrderId(client: SupabaseClient<Database>, providerOrderId: string) {
    const { data } = await client
      .from('payments')
      .select('*')
      .eq('provider_order_id', providerOrderId)
      .single();

    return data || null;
  }

  async getPaymentByBookingId(client: SupabaseClient<Database>, bookingId: string) {
    const { data } = await client
      .from('payments')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    return data || null;
  }

  async updatePaymentStatus(
    client: SupabaseClient<Database>,
    paymentId: string,
    status: PaymentStatus,
    updateData?: {
      providerPaymentId?: string;
      providerSignature?: string;
      bankTxnId?: string;
      rawResponse?: Record<string, unknown>;
      method?: string;
    }
  ) {
    const updatePayload: Database['public']['Tables']['payments']['Update'] = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (updateData?.providerPaymentId) {
      updatePayload.provider_payment_id = updateData.providerPaymentId;
    }
    if (updateData?.providerSignature) {
      updatePayload.provider_signature = updateData.providerSignature;
    }
    if (updateData?.bankTxnId) {
      updatePayload.bank_txn_id = updateData.bankTxnId;
    }
    if (updateData?.rawResponse) {
      updatePayload.raw_response = updateData.rawResponse;
    }
    if (updateData?.method) {
      updatePayload.method = updateData.method;
    }

    const { data, error } = await client
      .from('payments')
      .update(updatePayload)
      .eq('id', paymentId)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to update payment status');
    }

    return data;
  }

  async listAllPaymentsAdmin(client: SupabaseClient<Database>) {
    const [paymentsRes, bookingsRes, profilesRes] = await Promise.all([
      client.from('payments').select('*').order('created_at', { ascending: false }),
      client.from('bookings').select('id, booking_number, booking_date, service_id, total_amount, status, services(name)'),
      client.from('profiles').select('id, full_name, email, phone, role'),
    ]);

    if (paymentsRes.error) throw paymentsRes.error;

    const payments = paymentsRes.data || [];
    const bookings = bookingsRes.data || [];
    const profiles = profilesRes.data || [];

    const bookingMap = new Map(bookings.map((b) => [b.id, b]));
    const profileMap = new Map(profiles.map((p) => [p.id, p]));

    return payments.map((p) => {
      const booking = p.booking_id ? bookingMap.get(p.booking_id) : null;
      const customer = p.customer_id ? profileMap.get(p.customer_id) : null;
      return {
        ...p,
        booking,
        customer,
      };
    });
  }
}

export const paymentsRepository = new PaymentsRepository();
