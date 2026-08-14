import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class CooksRepository extends BaseRepository<'cook_details'> {
  constructor() {
    super('cook_details');
  }

  async getCookDetails(client: SupabaseClient<Database>, cookId: string) {
    const { data, error } = await client
      .from('cook_details')
      .select('*, profiles!inner(full_name, phone, avatar_url, status)')
      .eq('cook_id', cookId)
      .single();

    if (error) return null;
    return data;
  }

  async listVerifiedCooks(client: SupabaseClient<Database>, limit = 20) {
    const { data, error } = await client
      .from('cook_details')
      .select('*, profiles!inner(id, full_name, avatar_url, status)')
      .eq('is_verified', true)
      .eq('police_verification_status', 'verified')
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async listAllCooksAdmin(client: SupabaseClient<Database>) {
    const [profilesRes, bookingsRes, reviewsRes] = await Promise.all([
      client
        .from('profiles')
        .select('*, cook_details(*)')
        .eq('role', 'cook')
        .order('created_at', { ascending: false }),
      client.from('bookings').select('cook_id, status, total_amount'),
      client.from('reviews').select('cook_id, rating'),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const profiles = profilesRes.data || [];
    const bookings = bookingsRes.data || [];
    const reviews = reviewsRes.data || [];

    // Aggregate booking stats per cook
    const cookStatsMap = new Map<
      string,
      { totalBookings: number; completedBookings: number; totalEarnings: number }
    >();

    bookings.forEach((b) => {
      if (!b.cook_id) return;
      const curr = cookStatsMap.get(b.cook_id) || {
        totalBookings: 0,
        completedBookings: 0,
        totalEarnings: 0,
      };
      curr.totalBookings += 1;
      if (['completed', 'paid'].includes(b.status)) {
        curr.completedBookings += 1;
        curr.totalEarnings += b.total_amount || 0;
      }
      cookStatsMap.set(b.cook_id, curr);
    });

    // Aggregate review rating per cook
    const cookRatingMap = new Map<string, { totalRatings: number; sumRatings: number }>();
    reviews.forEach((r) => {
      if (!r.cook_id) return;
      const curr = cookRatingMap.get(r.cook_id) || { totalRatings: 0, sumRatings: 0 };
      curr.totalRatings += 1;
      curr.sumRatings += r.rating || 0;
      cookRatingMap.set(r.cook_id, curr);
    });

    return profiles.map((p) => {
      const stats = cookStatsMap.get(p.id) || {
        totalBookings: 0,
        completedBookings: 0,
        totalEarnings: 0,
      };
      const rating = cookRatingMap.get(p.id);
      const avgRating = rating && rating.totalRatings > 0 ? rating.sumRatings / rating.totalRatings : 0;

      const details = Array.isArray(p.cook_details) ? p.cook_details[0] : p.cook_details;

      return {
        ...p,
        cook_details: details || null,
        stats: {
          totalBookings: stats.totalBookings,
          completedBookings: stats.completedBookings,
          totalEarnings: stats.totalEarnings,
          avgRating: Number(avgRating.toFixed(1)),
          totalReviews: rating ? rating.totalRatings : 0,
        },
      };
    });
  }

  async getCookFullProfileAdmin(client: SupabaseClient<Database>, cookId: string) {
    const [profileRes, detailsRes, bookingsRes, reviewsRes, auditRes] = await Promise.all([
      client.from('profiles').select('*').eq('id', cookId).single(),
      client.from('cook_details').select('*').eq('cook_id', cookId).maybeSingle(),
      client
        .from('bookings')
        .select('*, service:services(name, category), customer:profiles!bookings_customer_id_fkey(full_name, phone)')
        .eq('cook_id', cookId)
        .order('created_at', { ascending: false }),
      client
        .from('reviews')
        .select('*, customer:profiles!reviews_customer_id_fkey(full_name)')
        .eq('cook_id', cookId)
        .order('created_at', { ascending: false }),
      client
        .from('audit_logs')
        .select('*')
        .eq('record_id', cookId)
        .order('created_at', { ascending: false }),
    ]);

    if (profileRes.error) throw profileRes.error;

    const profile = profileRes.data;
    const details = detailsRes.data || null;
    const bookings = bookingsRes.data || [];
    const reviews = reviewsRes.data || [];
    const auditLogs = auditRes.data || [];

    const completedBookings = bookings.filter((b) => ['completed', 'paid'].includes(b.status));
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    return {
      profile,
      details,
      bookings,
      reviews,
      auditLogs,
      summary: {
        totalBookings: bookings.length,
        completedBookings: completedBookings.length,
        totalEarnings,
        avgRating: Number(avgRating.toFixed(1)),
        totalReviews: reviews.length,
      },
    };
  }

  async updateVerificationStatus(
    client: SupabaseClient<Database>,
    cookId: string,
    isVerified: boolean,
    policeStatus: string
  ) {
    const { data, error } = await client
      .from('cook_details')
      .update({
        is_verified: isVerified,
        police_verification_status: policeStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('cook_id', cookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfileStatus(
    client: SupabaseClient<Database>,
    cookId: string,
    status: 'active' | 'inactive' | 'suspended' | 'rejected' | 'pending'
  ) {
    const { data, error } = await client
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', cookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async registerCookDetails(
    client: SupabaseClient<Database>,
    cookDetails: Database['public']['Tables']['cook_details']['Insert']
  ) {
    return this.handleQuery(
      client
        .from('cook_details')
        .upsert(cookDetails, { onConflict: 'cook_id' })
        .select()
        .single()
    );
  }
}

export const cooksRepository = new CooksRepository();
