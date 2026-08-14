import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class CustomersRepository extends BaseRepository<'profiles'> {
  constructor() {
    super('profiles');
  }

  async getProfile(
    client: SupabaseClient<Database>,
    profileId: string
  ): Promise<Database['public']['Tables']['profiles']['Row']> {
    const { data, error } = await client
      .from('profiles')
      .select('*')
      .eq('id', profileId)
      .single();

    if (error || !data) {
      throw error || new Error('Profile not found');
    }

    return data;
  }

  async updateProfile(
    client: SupabaseClient<Database>,
    profileId: string,
    updates: Database['public']['Tables']['profiles']['Update']
  ): Promise<Database['public']['Tables']['profiles']['Row']> {
    const { data, error } = await client
      .from('profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to update profile');
    }

    return data;
  }

  async listAllCustomersAdmin(client: SupabaseClient<Database>) {
    const [profilesRes, bookingsRes, reviewsRes] = await Promise.all([
      client
        .from('profiles')
        .select('*, customer_details(*)')
        .eq('role', 'customer')
        .order('created_at', { ascending: false }),
      client.from('bookings').select('customer_id, status, total_amount'),
      client.from('reviews').select('customer_id, rating'),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const profiles = profilesRes.data || [];
    const bookings = bookingsRes.data || [];
    const reviews = reviewsRes.data || [];

    const customerStatsMap = new Map<
      string,
      { totalBookings: number; activeBookings: number; totalSpend: number }
    >();

    bookings.forEach((b) => {
      if (!b.customer_id) return;
      const curr = customerStatsMap.get(b.customer_id) || {
        totalBookings: 0,
        activeBookings: 0,
        totalSpend: 0,
      };
      curr.totalBookings += 1;
      if (['pending_confirmation', 'searching', 'accepted', 'cook_arriving', 'cooking'].includes(b.status)) {
        curr.activeBookings += 1;
      }
      if (['completed', 'paid'].includes(b.status)) {
        curr.totalSpend += b.total_amount || 0;
      }
      customerStatsMap.set(b.customer_id, curr);
    });

    return profiles.map((p) => {
      const stats = customerStatsMap.get(p.id) || {
        totalBookings: 0,
        activeBookings: 0,
        totalSpend: 0,
      };
      const details = Array.isArray(p.customer_details) ? p.customer_details[0] : p.customer_details;

      return {
        ...p,
        customer_details: details || null,
        stats,
      };
    });
  }

  async getCustomerFullProfileAdmin(client: SupabaseClient<Database>, customerId: string) {
    const [profileRes, detailsRes, bookingsRes, addressesRes, reviewsRes, auditRes] =
      await Promise.all([
        client.from('profiles').select('*').eq('id', customerId).single(),
        client.from('customer_details').select('*').eq('customer_id', customerId).maybeSingle(),
        client
          .from('bookings')
          .select('*, service:services(name, category), cook:profiles!bookings_cook_id_fkey(full_name, phone)')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false }),
        client.from('addresses').select('*, city:cities(name)').eq('customer_id', customerId),
        client
          .from('reviews')
          .select('*, cook:profiles!reviews_cook_id_fkey(full_name)')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false }),
        client
          .from('audit_logs')
          .select('*')
          .eq('record_id', customerId)
          .order('created_at', { ascending: false }),
      ]);

    if (profileRes.error) throw profileRes.error;

    const profile = profileRes.data;
    const details = detailsRes.data || null;
    const bookings = bookingsRes.data || [];
    const addresses = addressesRes.data || [];
    const reviews = reviewsRes.data || [];
    const auditLogs = auditRes.data || [];

    const activeBookings = bookings.filter((b) =>
      ['pending_confirmation', 'searching', 'accepted', 'cook_arriving', 'cooking'].includes(b.status)
    );
    const completedBookings = bookings.filter((b) => ['completed', 'paid'].includes(b.status));
    const totalSpend = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    return {
      profile,
      details,
      bookings,
      addresses,
      reviews,
      auditLogs,
      summary: {
        totalBookings: bookings.length,
        activeBookings: activeBookings.length,
        completedBookings: completedBookings.length,
        totalSpend,
        totalReviews: reviews.length,
        savedAddresses: addresses.length,
      },
    };
  }

  async updateCustomerStatus(
    client: SupabaseClient<Database>,
    customerId: string,
    status: 'active' | 'inactive' | 'suspended'
  ) {
    const { data, error } = await client
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', customerId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getCustomerDetails(client: SupabaseClient<Database>, customerId: string) {
    const { data } = await client
      .from('customer_details')
      .select('*')
      .eq('customer_id', customerId)
      .single();

    return data || null;
  }

  async upsertCustomerDetails(
    client: SupabaseClient<Database>,
    details: Database['public']['Tables']['customer_details']['Insert']
  ) {
    const { data, error } = await client
      .from('customer_details')
      .upsert(details, { onConflict: 'customer_id' })
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to update customer details');
    }

    return data;
  }
}

export const customersRepository = new CustomersRepository();
