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
      .from('cooks')
      .update({
        is_approved: true,
        verification_status: 'verified',
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${cookId},profile_id.eq.${cookId}`)
      .select()
      .maybeSingle();

    if (updated.error) throw updated.error;

    await this.recordAuditLog(
      client,
      adminProfileId,
      'APPROVE_COOK_VERIFICATION',
      cookId,
      null,
      { is_approved: true, verification_status: 'verified' },
      'cooks'
    );

    return updated.data;
  }

  public async recordAuditLog(
    client: SupabaseClient<Database>,
    profileId: string | null,
    action: string,
    recordId: string | null,
    oldData?: Record<string, unknown> | null,
    newData?: Record<string, unknown> | null,
    tableName: string = 'admin_users'
  ) {
    await client.from('audit_logs').insert({
      profile_id: profileId,
      action,
      table_name: tableName,
      record_id: recordId || null,
      old_data: oldData || null,
      new_data: newData || null,
    });
  }

  async getDashboardMetrics(
    client: SupabaseClient<Database>,
    options?: { days?: number; startDate?: string; endDate?: string }
  ) {
    const [
      bookingsRes,
      cooksProfilesRes,
      cooksRes,
      customersRes,
      servicesRes,
      citiesRes,
      addressesRes,
    ] = await Promise.all([
      client.from('bookings').select('*'),
      client.from('profiles').select('*').eq('role', 'cook'),
      client.from('cooks').select('*'),
      client.from('profiles').select('*').eq('role', 'customer'),
      client.from('services').select('*'),
      client.from('cities').select('*'),
      client.from('addresses').select('*'),
    ]);

    if (bookingsRes.error) {
      console.error('[Dashboard Metrics] Error querying "bookings":', {
        code: bookingsRes.error.code,
        message: bookingsRes.error.message,
        details: bookingsRes.error.details,
        hint: bookingsRes.error.hint,
      });
    }
    if (cooksProfilesRes.error) {
      console.error('[Dashboard Metrics] Error querying "profiles" (cooks):', {
        code: cooksProfilesRes.error.code,
        message: cooksProfilesRes.error.message,
        details: cooksProfilesRes.error.details,
        hint: cooksProfilesRes.error.hint,
      });
    }
    if (cooksRes.error) {
      console.error('[Dashboard Metrics] Error querying "cooks":', {
        code: cooksRes.error.code,
        message: cooksRes.error.message,
        details: cooksRes.error.details,
        hint: cooksRes.error.hint,
      });
    }
    if (customersRes.error) {
      console.error('[Dashboard Metrics] Error querying "profiles" (customers):', {
        code: customersRes.error.code,
        message: customersRes.error.message,
        details: customersRes.error.details,
        hint: customersRes.error.hint,
      });
    }
    if (servicesRes.error) {
      console.error('[Dashboard Metrics] Error querying "services":', {
        code: servicesRes.error.code,
        message: servicesRes.error.message,
        details: servicesRes.error.details,
        hint: servicesRes.error.hint,
      });
    }
    if (citiesRes.error) {
      console.error('[Dashboard Metrics] Error querying "cities":', {
        code: citiesRes.error.code,
        message: citiesRes.error.message,
        details: citiesRes.error.details,
        hint: citiesRes.error.hint,
      });
    }
    if (addressesRes.error) {
      console.error('[Dashboard Metrics] Error querying "addresses":', {
        code: addressesRes.error.code,
        message: addressesRes.error.message,
        details: addressesRes.error.details,
        hint: addressesRes.error.hint,
      });
    }

    const criticalErrors = [
      bookingsRes.error ? `bookings: ${bookingsRes.error.message}` : null,
    ].filter(Boolean);

    if (criticalErrors.length > 0) {
      throw new Error(`Database query failed — ${criticalErrors.join('; ')}`);
    }

    const bookings = bookingsRes.data || [];
    const cooksProfiles = cooksProfilesRes.data || [];
    const cooksList = cooksRes.data || [];

    // In-memory join for cooks and cook profiles ensuring all cooks are represented
    const cookProfileMap = new Map(cooksProfiles.map((p) => [p.id, p]));
    const cooks: any[] = cooksList.map((c) => {
      const profile = cookProfileMap.get(c.profile_id) || cookProfileMap.get(c.id);
      return {
        ...(profile || {
          id: c.profile_id || c.id,
          full_name: c.display_name || 'Cook Partner',
          email: '',
          phone: null,
          role: 'cook',
          status: 'active',
          created_at: c.created_at,
          updated_at: c.updated_at,
        }),
        cook_details: c,
      };
    });

    // Also include any profiles with role='cook' that don't have a cooks row yet
    cooksProfiles.forEach((p) => {
      if (!cooks.some((c) => c.id === p.id || c.cook_details?.profile_id === p.id)) {
        cooks.push({
          ...p,
          cook_details: null,
        });
      }
    });

    const customers = customersRes.data || [];
    const services = servicesRes.data || [];
    const cities = citiesRes.data || [];
    const addresses = addressesRes.data || [];

    // Determine date range filter
    let startIso: string | null = null;
    let endIso: string | null = null;
    let daysCount = 7;

    if (options?.days) {
      daysCount = options.days;
      const d = new Date();
      d.setDate(d.getDate() - daysCount);
      startIso = d.toISOString().split('T')[0];
    } else if (options?.startDate) {
      startIso = options.startDate.split('T')[0];
      endIso = options.endDate ? options.endDate.split('T')[0] : new Date().toISOString().split('T')[0];
      const startMs = new Date(startIso).getTime();
      const endMs = new Date(endIso).getTime();
      daysCount = Math.max(1, Math.min(180, Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)) + 1));
    }

    // Filter bookings if date range is specified
    const rangeBookings = bookings.filter((b) => {
      const bDate = b.booking_date || b.created_at?.split('T')[0];
      if (!bDate) return true;
      if (startIso && bDate < startIso) return false;
      if (endIso && bDate > endIso) return false;
      return true;
    });

    // Calculate total revenue from completed/paid bookings
    const completedBookings = rangeBookings.filter((b) => ['completed', 'paid'].includes(b.status));
    const totalRevenue = completedBookings.reduce(
      (sum, b) => sum + (Number(b.total_amount) || 0),
      0
    );

    // Cooks metrics using cooks.is_approved, cooks.verification_status, cooks.is_available
    const activeCooks = cooks.filter((c) => {
      const details = c.cook_details;
      const isApproved = details?.is_approved === true || details?.verification_status === 'verified';
      return isApproved || c.status === 'active';
    }).length;
    const onlineCooks = cooks.filter(
      (c) => c.cook_details?.is_available === true || c.status === 'active' || c.status === 'online'
    ).length;

    // Funnel breakdown for range
    const bookingFunnel: Record<string, number> = {
      pending_confirmation: 0,
      searching: 0,
      matched: 0,
      accepted: 0,
      cook_assigned: 0,
      cook_arriving: 0,
      cooking: 0,
      completed: 0,
      cancelled: 0,
      refunded: 0,
    };

    rangeBookings.forEach((b) => {
      const statusKey = b.status || 'pending_confirmation';
      bookingFunnel[statusKey] = (bookingFunnel[statusKey] || 0) + 1;
    });

    // Top services aggregation
    const serviceMap = new Map(services.map((s) => [s.id, s.name]));
    const serviceCountMap: Record<string, { name: string; count: number; revenue: number }> = {};
    rangeBookings.forEach((b) => {
      const sName = serviceMap.get(b.service_id) || 'Standard Cooking';
      if (!serviceCountMap[sName]) {
        serviceCountMap[sName] = { name: sName, count: 0, revenue: 0 };
      }
      serviceCountMap[sName].count += 1;
      if (['completed', 'paid'].includes(b.status)) {
        serviceCountMap[sName].revenue += Number(b.total_amount) || 0;
      }
    });
    const topServices = Object.values(serviceCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top cities aggregation
    const addressCityMap = new Map(addresses.map((a) => [a.id, a.city_id]));
    const cityMap = new Map(cities.map((c) => [c.id, c.name]));
    const cityCountMap: Record<string, { name: string; count: number }> = {};
    rangeBookings.forEach((b) => {
      const cityId = addressCityMap.get(b.address_id);
      const cityName = cityId ? cityMap.get(cityId) || 'Delhi NCR' : 'Delhi NCR';
      if (!cityCountMap[cityName]) {
        cityCountMap[cityName] = { name: cityName, count: 0 };
      }
      cityCountMap[cityName].count += 1;
    });
    const topCities = Object.values(cityCountMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Daily trends for range
    const trendsMap: Record<string, { date: string; bookings: number; revenue: number }> = {};
    const refDate = endIso ? new Date(endIso) : new Date();
    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date(refDate);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      trendsMap[dateStr] = { date: dateStr, bookings: 0, revenue: 0 };
    }

    rangeBookings.forEach((b) => {
      const bDate = b.booking_date || b.created_at?.split('T')[0];
      if (bDate && trendsMap[bDate]) {
        trendsMap[bDate].bookings += 1;
        if (['completed', 'paid'].includes(b.status)) {
          trendsMap[bDate].revenue += Number(b.total_amount) || 0;
        }
      }
    });

    return {
      totalRevenue,
      totalBookings: rangeBookings.length,
      allTimeBookingsCount: bookings.length,
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
