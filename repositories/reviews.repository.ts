import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class ReviewsRepository extends BaseRepository<'reviews'> {
  constructor() {
    super('reviews');
  }

  async getCookReviews(client: SupabaseClient<Database>, cookIdOrProfileId: string) {
    let actualCookId = cookIdOrProfileId;
    const { data: cook } = await client
      .from('cooks')
      .select('id')
      .or(`id.eq.${cookIdOrProfileId},profile_id.eq.${cookIdOrProfileId}`)
      .maybeSingle();

    if (cook) {
      actualCookId = cook.id;
    }

    const { data, error } = await client
      .from('reviews')
      .select('*, customer:profiles!customer_id(full_name, avatar_url)')
      .eq('cook_id', actualCookId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createReview(
    client: SupabaseClient<Database>,
    reviewData: Database['public']['Tables']['reviews']['Insert']
  ) {
    const { data, error } = await client
      .from('reviews')
      .insert(reviewData)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create review');
    }

    return data;
  }

  async listAllReviewsAdmin(client: SupabaseClient<Database>) {
    const [reviewsRes, profilesRes, cooksRes, bookingsRes] = await Promise.all([
      client.from('reviews').select('*').order('created_at', { ascending: false }),
      client.from('profiles').select('id, full_name, email, phone, avatar_url, role'),
      client.from('cooks').select('id, profile_id, display_name'),
      client.from('bookings').select('id, booking_number, booking_date, services(name)'),
    ]);

    if (reviewsRes.error) throw reviewsRes.error;

    const reviews = reviewsRes.data || [];
    const profiles = profilesRes.data || [];
    const cooks = cooksRes.data || [];
    const bookings = bookingsRes.data || [];

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const cookMap = new Map(cooks.map((c) => [c.id, c]));
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));

    return reviews.map((r) => {
      const customer = r.customer_id ? profileMap.get(r.customer_id) : null;
      
      // reviews.cook_id -> cooks.id -> cooks.profile_id -> profiles.id
      let cookData: {
        id: string;
        full_name: string | null;
        email: string | null;
        phone: string | null;
        avatar_url: string | null;
      } | null = null;

      if (r.cook_id) {
        const cookRecord = cookMap.get(r.cook_id);
        if (cookRecord) {
          const cookProfile = profileMap.get(cookRecord.profile_id);
          cookData = {
            id: cookRecord.id,
            full_name: cookProfile?.full_name || cookRecord.display_name || 'Cook Partner',
            email: cookProfile?.email || null,
            phone: cookProfile?.phone || null,
            avatar_url: cookProfile?.avatar_url || null,
          };
        } else {
          // Fallback if cook_id directly matches a profile
          const directProfile = profileMap.get(r.cook_id);
          if (directProfile) {
            cookData = {
              id: directProfile.id,
              full_name: directProfile.full_name || 'Cook Partner',
              email: directProfile.email || null,
              phone: directProfile.phone || null,
              avatar_url: directProfile.avatar_url || null,
            };
          }
        }
      }

      const booking = r.booking_id ? bookingMap.get(r.booking_id) : null;
      return {
        ...r,
        customer,
        cook: cookData,
        booking,
      };
    });
  }

  async deleteReviewAdmin(client: SupabaseClient<Database>, reviewId: string) {
    const { error } = await client.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
    return true;
  }
}

export const reviewsRepository = new ReviewsRepository();
