import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class AdminRepository extends BaseRepository<'admin_users'> {
  constructor() {
    super('admin_users');
  }

  async getAdminProfile(client: SupabaseClient<Database>, profileId: string) {
    return this.handleOptionalQuery(
      client.from('admin_users').select('*').eq('profile_id', profileId).single()
    );
  }

  async listAllAdmins(client: SupabaseClient<Database>) {
    const { data, error } = await client
      .from('admin_users')
      .select('*, profile:profiles(id, full_name, email, phone, status, role, created_at)')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async countSuperAdmins(client: SupabaseClient<Database>) {
    const { count, error } = await client
      .from('admin_users')
      .select('id', { count: 'exact', head: true })
      .eq('designation', 'super_admin');

    if (error) throw error;
    return count || 0;
  }

  async listAuditLogs(client: SupabaseClient<Database>, limit = 50) {
    const { data, error } = await client
      .from('audit_logs')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async createAnnouncement(
    client: SupabaseClient<Database>,
    announcement: Database['public']['Tables']['announcements']['Insert']
  ) {
    const { data, error } = await client
      .from('announcements')
      .insert(announcement)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async approveCookVerification(
    client: SupabaseClient<Database>,
    cookId: string,
    adminProfileId: string
  ) {
    const updated = await client
      .from('cook_details')
      .update({
        is_verified: true,
        police_verification_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .eq('cook_id', cookId)
      .select()
      .single();

    if (updated.error) throw updated.error;

    await this.recordAuditLog(
      client,
      adminProfileId,
      'APPROVE_COOK_VERIFICATION',
      cookId,
      null,
      { is_verified: true }
    );

    return updated.data;
  }

  public async recordAuditLog(
    client: SupabaseClient<Database>,
    profileId: string | null,
    action: string,
    recordId: string | null,
    oldData?: Record<string, unknown> | null,
    newData?: Record<string, unknown> | null
  ) {
    await client.from('audit_logs').insert({
      profile_id: profileId,
      action,
      table_name: this.tableName,
      record_id: recordId || null,
      old_data: oldData || null,
      new_data: newData || null,
    });
  }

  async getDashboardMetrics(client: SupabaseClient<Database>) {
    const [bookingsRes, cooksRes, customersRes, servicesRes, citiesRes, addressesRes] = await Promise.all([
      client.from('bookings').select('*'),
      client.from('profiles').select('*, cook_details(*)').eq('role', 'cook'),
      client.from('profiles').select('*').eq('role', 'customer'),
      client.from('services').select('*'),
      client.from('cities').select('*'),
      client.from('addresses').select('*'),
    ]);

    const bookings = bookingsRes.data || [];
    const cooks = cooksRes.data || [];
    const customers = customersRes.data || [];
    const services = servicesRes.data || [];
    const cities = citiesRes.data || [];
    const addresses = addressesRes.data || [];

    // Calculate total revenue from completed/paid bookings
    const completedBookings = bookings.filter((b) => ['completed', 'paid'].includes(b.status));
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    // Cooks metrics
    const activeCooks = cooks.filter((c) => {
      const details = Array.isArray(c.cook_details) ? c.cook_details[0] : c.cook_details;
      return typeof details === 'object' && details !== null && 'is_verified' in details ? (details as { is_verified: boolean }).is_verified : false;
    }).length;
    const onlineCooks = cooks.filter((c) => c.status === 'active' || c.status === 'online').length;

    // Funnel breakdown
    const bookingFunnel: Record<string, number> = {
      pending_confirmation: 0,
      searching: 0,
      accepted: 0,
      cook_arriving: 0,
      cooking: 0,
      completed: 0,
      cancelled: 0,
    };

    bookings.forEach((b) => {
      if (bookingFunnel[b.status] !== undefined) {
        bookingFunnel[b.status]++;
      }
    });

    // Top services aggregation
    const serviceMap = new Map(services.map((s) => [s.id, s.name]));
    const serviceCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
    bookings.forEach((b) => {
      const sName = serviceMap.get(b.service_id) || 'Standard Cooking';
      if (!serviceCountMap[sName]) {
        serviceCountMap[sName] = { name: sName, count: 0, revenue: 0 };
      }
      serviceCountMap[sName].count += 1;
      if (['completed', 'paid'].includes(b.status)) {
        serviceCountMap[sName].revenue += b.total_amount || 0;
      }
    });
    const topServices = Object.values(serviceCountMap).sort((a, b) => b.count - a.count).slice(0, 5);

    // Top cities aggregation
    const addressCityMap = new Map(addresses.map((a) => [a.id, a.city_id]));
    const cityMap = new Map(cities.map((c) => [c.id, c.name]));
    const cityCountMap: Record<string, { name: string; count: number }> = {};
    bookings.forEach((b) => {
      const cityId = addressCityMap.get(b.address_id);
      const cityName = cityId ? cityMap.get(cityId) || 'Delhi NCR' : 'Delhi NCR';
      if (!cityCountMap[cityName]) {
        cityCountMap[cityName] = { name: cityName, count: 0 };
      }
      cityCountMap[cityName].count += 1;
    });
    const topCities = Object.values(cityCountMap).sort((a, b) => b.count - a.count).slice(0, 5);

    // Daily trends (last 7 days)
    const trendsMap: Record<string, { date: string; bookings: number; revenue: number }> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendsMap[dateStr] = { date: dateStr, bookings: 0, revenue: 0 };
    }

    bookings.forEach((b) => {
      const bDate = b.booking_date || b.created_at?.split('T')[0];
      if (bDate && trendsMap[bDate]) {
        trendsMap[bDate].bookings += 1;
        if (['completed', 'paid'].includes(b.status)) {
          trendsMap[bDate].revenue += b.total_amount || 0;
        }
      }
    });

    return {
      totalRevenue,
      totalBookings: bookings.length,
      activeCooks,
      onlineCooks,
      newCustomers: customers.length,
      bookingFunnel,
      topServices,
      topCities,
      dailyTrends: Object.values(trendsMap),
    };
  }
}

export const adminRepository = new AdminRepository();
