import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class ServicesRepository extends BaseRepository<'services'> {
  constructor() {
    super('services');
  }

  /**
   * Fetch all active service packages (breakfast, lunch prep, party cooking, etc.)
   */
  async listActiveServices(client: SupabaseClient<Database>) {
    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get single service details by ID
   */
  async getServiceById(
    client: SupabaseClient<Database>,
    serviceId: string
  ): Promise<Database['public']['Tables']['services']['Row']> {
    const { data, error } = await client
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .single();

    if (error || !data) {
      throw error || new Error('Service not found');
    }

    return data;
  }

  /**
   * Fetch all active operating cities
   */
  async listActiveCities(client: SupabaseClient<Database>) {
    const { data, error } = await client
      .from('cities')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }
}

export const servicesRepository = new ServicesRepository();
