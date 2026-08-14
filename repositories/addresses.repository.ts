import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export class AddressesRepository extends BaseRepository<'addresses'> {
  constructor() {
    super('addresses');
  }

  async getCustomerAddresses(client: SupabaseClient<Database>, customerId: string) {
    const { data, error } = await client
      .from('addresses')
      .select('*, cities(id, name, state)')
      .eq('customer_id', customerId)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async getAddressById(client: SupabaseClient<Database>, addressId: string, customerId: string) {
    const { data, error } = await client
      .from('addresses')
      .select('*')
      .eq('id', addressId)
      .eq('customer_id', customerId)
      .single();

    if (error || !data) {
      throw error || new Error('Address not found');
    }

    return data;
  }

  async createAddress(
    client: SupabaseClient<Database>,
    addressData: Database['public']['Tables']['addresses']['Insert']
  ) {
    // If setting as default, clear existing defaults for customer
    if (addressData.is_default) {
      await client
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', addressData.customer_id);
    }

    const { data, error } = await client
      .from('addresses')
      .insert(addressData)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create address');
    }

    return data;
  }

  async updateAddress(
    client: SupabaseClient<Database>,
    addressId: string,
    customerId: string,
    updates: Database['public']['Tables']['addresses']['Update']
  ) {
    if (updates.is_default) {
      await client
        .from('addresses')
        .update({ is_default: false })
        .eq('customer_id', customerId);
    }

    const { data, error } = await client
      .from('addresses')
      .update(updates)
      .eq('id', addressId)
      .eq('customer_id', customerId)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to update address');
    }

    return data;
  }

  async deleteAddress(client: SupabaseClient<Database>, addressId: string, customerId: string) {
    const { error } = await client
      .from('addresses')
      .delete()
      .eq('id', addressId)
      .eq('customer_id', customerId);

    if (error) throw error;
    return true;
  }
}

export const addressesRepository = new AddressesRepository();
