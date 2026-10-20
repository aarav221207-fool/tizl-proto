import { SupabaseClient } from '@supabase/supabase-js';
import { Database, BookingStatus } from '@/types/database';
import { BaseRepository } from '@/repositories/base.repository';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  status?: BookingStatus;
  cityId?: string;
  customerId?: string;
  cookId?: string;
  serviceId?: string;
}

export class ExportRepository extends BaseRepository<'bookings'> {
  constructor() {
    super('bookings');
  }

  /**
   * Export Bookings with dynamic filters
   */
  async getBookingsData(client: SupabaseClient<Database>, filters: ExportFilters) {
    let query = client
      .from('bookings')
      .select(`
        id,
        booking_number,
        customer_id,
        cook_id,
        service_id,
        address_id,
        booking_date,
        start_time,
        duration_hours,
        guest_count,
        cooking_notes,
        status,
        hourly_rate,
        subtotal,
        discount_amount,
        tax_amount,
        platform_fee,
        total_amount,
        created_at,
        customer:profiles!customer_id(full_name, phone, email),
        service:services(name, category),
        address:addresses(house_number, street, locality, pincode, city_id)
      `)
      .order('created_at', { ascending: false });

    if (filters.startDate) query = query.gte('booking_date', filters.startDate);
    if (filters.endDate) query = query.lte('booking_date', filters.endDate);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.cookId) query = query.eq('cook_id', filters.cookId);
    if (filters.serviceId) query = query.eq('service_id', filters.serviceId);

    const { data: rawBookings, error } = await query;
    if (error) throw error;
    if (!rawBookings || rawBookings.length === 0) return [];

    // Batch resolve cooks: bookings.cook_id -> cooks.id -> cooks.profile_id -> profiles.id
    const cookIds = Array.from(new Set(rawBookings.map((b) => b.cook_id).filter(Boolean))) as string[];
    const cookMap = new Map<string, { full_name: string | null; phone: string | null }>();

    if (cookIds.length > 0) {
      const { data: cooks } = await client.from('cooks').select('id, profile_id, display_name').in('id', cookIds);
      if (cooks && cooks.length > 0) {
        const profileIds = cooks.map((c) => c.profile_id).filter(Boolean);
        const { data: profiles } = await client.from('profiles').select('id, full_name, phone').in('id', profileIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        cooks.forEach((c) => {
          const prof = profileMap.get(c.profile_id);
          cookMap.set(c.id, {
            full_name: prof?.full_name || c.display_name || 'Cook Partner',
            phone: prof?.phone || null,
          });
        });
      }
    }

    return rawBookings.map((b) => ({
      ...b,
      cook: b.cook_id ? cookMap.get(b.cook_id) || null : null,
    }));
  }

  /**
   * Export Customers data
   */
  async getCustomersData(client: SupabaseClient<Database>, filters: ExportFilters) {
    let query = client
      .from('profiles')
      .select(`
        id,
        full_name,
        email,
        phone,
        status,
        created_at,
        customer_details(dietary_preferences, allergies, house_type, kitchen_type)
      `)
      .eq('role', 'customer')
      .order('created_at', { ascending: false });

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Export Cooks data
   */
  async getCooksData(client: SupabaseClient<Database>, filters: ExportFilters) {
    let query = client
      .from('profiles')
      .select('id, full_name, email, phone, status, created_at')
      .eq('role', 'cook')
      .order('created_at', { ascending: false });

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    const [profilesRes, cooksRes] = await Promise.all([
      query,
      client.from('cooks').select('*'),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const profiles = profilesRes.data || [];
    const cooksList = cooksRes.data || [];

    return profiles.map((p) => {
      const details = cooksList.find(
        (c) => c.profile_id === p.id || c.id === p.id
      );
      return {
        ...p,
        cook_details: details || null,
      };
    });
  }

  /**
   * Export Payments data
   */
  async getPaymentsData(client: SupabaseClient<Database>, filters: ExportFilters) {
    let query = client
      .from('payments')
      .select(`
        id,
        booking_id,
        customer_id,
        provider,
        provider_order_id,
        provider_payment_id,
        bank_txn_id,
        amount,
        currency,
        status,
        method,
        refund_id,
        created_at
      `)
      .order('created_at', { ascending: false });

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  /**
   * Export Reviews data
   */
  async getReviewsData(client: SupabaseClient<Database>, filters: ExportFilters) {
    let query = client
      .from('reviews')
      .select(`
        id,
        booking_id,
        customer_id,
        cook_id,
        rating,
        comment,
        created_at,
        customer:profiles!customer_id(full_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.cookId) query = query.eq('cook_id', filters.cookId);

    const { data: rawReviews, error } = await query;
    if (error) throw error;
    if (!rawReviews || rawReviews.length === 0) return [];

    // Batch resolve cooks: reviews.cook_id -> cooks.id -> cooks.profile_id -> profiles.id
    const cookIds = Array.from(new Set(rawReviews.map((r) => r.cook_id).filter(Boolean))) as string[];
    const cookMap = new Map<string, { full_name: string | null }>();

    if (cookIds.length > 0) {
      const { data: cooks } = await client.from('cooks').select('id, profile_id, display_name').in('id', cookIds);
      if (cooks && cooks.length > 0) {
        const profileIds = cooks.map((c) => c.profile_id).filter(Boolean);
        const { data: profiles } = await client.from('profiles').select('id, full_name').in('id', profileIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        cooks.forEach((c) => {
          const prof = profileMap.get(c.profile_id);
          cookMap.set(c.id, {
            full_name: prof?.full_name || c.display_name || 'Cook Partner',
          });
        });
      }
    }

    return rawReviews.map((r) => ({
      ...r,
      cook: r.cook_id ? cookMap.get(r.cook_id) || null : null,
    }));
  }

  /**
   * Export Services data
   */
  async getServicesData(client: SupabaseClient<Database>) {
    const { data, error } = await client
      .from('services')
      .select('id, name, description, base_price, duration_hours, category, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Export Cities data
   */
  async getCitiesData(client: SupabaseClient<Database>) {
    const { data, error } = await client
      .from('cities')
      .select('id, name, state, is_active, created_at')
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

export const exportRepository = new ExportRepository();
