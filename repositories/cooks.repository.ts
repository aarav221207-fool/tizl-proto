import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class CooksRepository extends BaseRepository<'cooks'> {
  constructor() {
    super('cooks');
  }

  async getCookDetails(client: SupabaseClient<Database>, cookId: string) {
    const { data, error } = await client
      .from('cooks')
      .select('*')
      .or(`id.eq.${cookId},profile_id.eq.${cookId}`)
      .maybeSingle();

    if (error) return null;
    return data;
  }

  async listVerifiedCooks(client: SupabaseClient<Database>, limit = 20) {
    const { data, error } = await client
      .from('cooks')
      .select('*')
      .eq('is_approved', true)
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async listAllCooksAdmin(client: SupabaseClient<Database>) {
    const [profilesRes, cooksRes, bookingsRes, reviewsRes] = await Promise.all([
      client
        .from('profiles')
        .select('*')
        .eq('role', 'cook')
        .order('created_at', { ascending: false }),
      client.from('cooks').select('*'),
      client.from('bookings').select('cook_id, status, total_amount'),
      client.from('reviews').select('cook_id, rating'),
    ]);

    if (profilesRes.error) throw profilesRes.error;

    const profiles = profilesRes.data || [];
    const cooksList = cooksRes.data || [];
    const bookings = bookingsRes.data || [];
    const reviews = reviewsRes.data || [];

    // Aggregate booking stats per cook (using bookings.cook_id -> cooks.id)
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

    // Aggregate review rating per cook (using reviews.cook_id -> cooks.id)
    const cookRatingMap = new Map<string, { totalRatings: number; sumRatings: number }>();
    reviews.forEach((r) => {
      if (!r.cook_id) return;
      const curr = cookRatingMap.get(r.cook_id) || { totalRatings: 0, sumRatings: 0 };
      curr.totalRatings += 1;
      curr.sumRatings += r.rating || 0;
      cookRatingMap.set(r.cook_id, curr);
    });

    return profiles.map((p) => {
      const details = cooksList.find(
        (c) => c.profile_id === p.id || c.id === p.id
      ) || null;

      // Look up stats by cooks.id first, then fallback to p.id
      const actualCookId = details?.id || p.id;
      const stats = cookStatsMap.get(actualCookId) || cookStatsMap.get(p.id) || {
        totalBookings: 0,
        completedBookings: 0,
        totalEarnings: 0,
      };
      const rating = cookRatingMap.get(actualCookId) || cookRatingMap.get(p.id);
      const avgRating = rating && rating.totalRatings > 0 ? rating.sumRatings / rating.totalRatings : 0;

      return {
        ...p,
        cook_details: details,
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

  async getCookFullProfileAdmin(client: SupabaseClient<Database>, cookIdOrProfileId: string) {
    // 1. Resolve cook record & profile record
    const { data: cookRecord } = await client
      .from('cooks')
      .select('*')
      .or(`id.eq.${cookIdOrProfileId},profile_id.eq.${cookIdOrProfileId}`)
      .maybeSingle();

    const targetProfileId = cookRecord?.profile_id || cookIdOrProfileId;
    const targetCookId = cookRecord?.id || cookIdOrProfileId;

    const { data: profileRecord, error: profileError } = await client
      .from('profiles')
      .select('*')
      .eq('id', targetProfileId)
      .single();

    if (profileError || !profileRecord) {
      throw profileError || new Error('Cook profile not found');
    }

    const [bookingsRes, reviewsRes, auditRes, docsRes, availRes] = await Promise.all([
      client
        .from('bookings')
        .select('*, service:services(name, category), customer:profiles!customer_id(full_name, phone)')
        .eq('cook_id', targetCookId)
        .order('created_at', { ascending: false }),
      client
        .from('reviews')
        .select('*, customer:profiles!customer_id(full_name)')
        .eq('cook_id', targetCookId)
        .order('created_at', { ascending: false }),
      client
        .from('audit_logs')
        .select('*')
        .or(`record_id.eq.${targetCookId},record_id.eq.${targetProfileId}`)
        .order('created_at', { ascending: false }),
      client.from('cook_documents').select('*').eq('cook_id', targetCookId),
      client.from('cook_availability').select('*').eq('cook_id', targetCookId),
    ]);

    const bookings = bookingsRes.data || [];
    const reviews = reviewsRes.data || [];
    const auditLogs = auditRes.data || [];
    const documents = docsRes.data || [];
    const availability = availRes.data || [];

    const completedBookings = bookings.filter((b) => ['completed', 'paid'].includes(b.status));
    const totalEarnings = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        : 0;

    return {
      profile: profileRecord,
      details: cookRecord || null,
      documents,
      availability,
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
    cookIdOrProfileId: string,
    isApproved: boolean,
    verificationStatus: string = 'verified'
  ) {
    const { data, error } = await client
      .from('cooks')
      .update({
        is_approved: isApproved,
        verification_status: verificationStatus,
        updated_at: new Date().toISOString(),
      })
      .or(`id.eq.${cookIdOrProfileId},profile_id.eq.${cookIdOrProfileId}`)
      .select()
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async updateProfileStatus(
    client: SupabaseClient<Database>,
    cookIdOrProfileId: string,
    status: 'active' | 'inactive' | 'suspended' | 'rejected' | 'pending'
  ) {
    // If given a cooks.id, resolve to profile_id
    let profileId = cookIdOrProfileId;
    const { data: cook } = await client
      .from('cooks')
      .select('profile_id')
      .or(`id.eq.${cookIdOrProfileId},profile_id.eq.${cookIdOrProfileId}`)
      .maybeSingle();

    if (cook?.profile_id) {
      profileId = cook.profile_id;
    }

    const { data, error } = await client
      .from('profiles')
      .update({
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async registerCookDetails(
    client: SupabaseClient<Database>,
    cookData: Database['public']['Tables']['cooks']['Insert']
  ) {
    return this.handleQuery(
      client
        .from('cooks')
        .upsert(cookData)
        .select()
        .single()
    );
  }
}

export const cooksRepository = new CooksRepository();
