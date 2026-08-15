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
}

export const reviewsRepository = new ReviewsRepository();
