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
        customer:profiles!bookings_customer_id_fkey(full_name, phone, email),
        cook:profiles!bookings_cook_id_fkey(full_name, phone),
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

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
      .select(`
        id,
        full_name,
        email,
        phone,
        status,
        created_at,
        cook_details(bio, experience_years, speciality, hourly_rate, is_verified, police_verification_status)
      `)
      .eq('role', 'cook')
      .order('created_at', { ascending: false });

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
        customer:profiles!reviews_customer_id_fkey(full_name),
        cook:profiles!reviews_cook_id_fkey(full_name)
      `)
      .order('created_at', { ascending: false });

    if (filters.startDate) query = query.gte('created_at', filters.startDate);
    if (filters.endDate) query = query.lte('created_at', filters.endDate);
    if (filters.customerId) query = query.eq('customer_id', filters.customerId);
    if (filters.cookId) query = query.eq('cook_id', filters.cookId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
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
