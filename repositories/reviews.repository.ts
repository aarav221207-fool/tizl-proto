import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class ReviewsRepository extends BaseRepository<'reviews'> {
  constructor() {
    super('reviews');
  }

  async getCookReviews(client: SupabaseClient<Database>, cookId: string) {
    const { data, error } = await client
      .from('reviews')
      .select('*, customer:profiles!customer_id(full_name, avatar_url)')
      .eq('cook_id', cookId)
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
    const [reviewsRes, profilesRes, bookingsRes] = await Promise.all([
      client.from('reviews').select('*').order('created_at', { ascending: false }),
      client.from('profiles').select('id, full_name, email, phone, avatar_url, role'),
      client.from('bookings').select('id, booking_number, booking_date, services(name)'),
    ]);

    if (reviewsRes.error) throw reviewsRes.error;

    const reviews = reviewsRes.data || [];
    const profiles = profilesRes.data || [];
    const bookings = bookingsRes.data || [];

    const profileMap = new Map(profiles.map((p) => [p.id, p]));
    const bookingMap = new Map(bookings.map((b) => [b.id, b]));

    return reviews.map((r) => {
      const customer = r.customer_id ? profileMap.get(r.customer_id) : null;
      const cook = r.cook_id ? profileMap.get(r.cook_id) : null;
      const booking = r.booking_id ? bookingMap.get(r.booking_id) : null;
      return {
        ...r,
        customer,
        cook,
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
