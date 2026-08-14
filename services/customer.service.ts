import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { customersRepository } from '@/repositories/customers.repository';
import { addressesRepository } from '@/repositories/addresses.repository';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { BadRequestError } from '@/lib/errors';

export class CustomerService {
  /**
   * Retrieves full profile and culinary preferences
   */
  async getProfile(client: SupabaseClient<Database>, customerId: string) {
    const [profile, details] = await Promise.all([
      customersRepository.getProfile(client, customerId),
      customersRepository.getCustomerDetails(client, customerId),
    ]);

    return {
      profile,
      details,
    };
  }

  /**
   * Updates basic profile information (e.g., full name, phone number)
   */
  async updateProfile(
    client: SupabaseClient<Database>,
    customerId: string,
    updates: { full_name?: string; phone?: string; avatar_url?: string }
  ) {
    return customersRepository.updateProfile(client, customerId, {
      ...updates,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Updates culinary preferences, dietary needs, house & kitchen types
   */
  async updatePreferences(
    client: SupabaseClient<Database>,
    customerId: string,
    preferences: {
      dietary_preferences?: string[];
      allergies?: string[];
      house_type?: string;
      kitchen_type?: string;
    }
  ) {
    return customersRepository.upsertCustomerDetails(client, {
      customer_id: customerId,
      ...preferences,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Gets customer dashboard metrics & aggregated summaries
   */
  async getDashboard(client: SupabaseClient<Database>, customerId: string) {
    const [profile, details, addresses, allBookings] = await Promise.all([
      customersRepository.getProfile(client, customerId),
      customersRepository.getCustomerDetails(client, customerId),
      addressesRepository.getCustomerAddresses(client, customerId),
      bookingsRepository.getCustomerBookings(client, customerId),
    ]);

    const activeBookings = allBookings.filter(
      (b) => !['completed', 'cancelled', 'refunded'].includes(b.status)
    );
    const completedBookings = allBookings.filter((b) => b.status === 'completed');
    const totalSpent = completedBookings.reduce((sum, b) => sum + (b.total_amount || 0), 0);

    return {
      profile,
      details,
      addressesCount: addresses.length,
      defaultAddress: addresses.find((a) => a.is_default) || addresses[0] || null,
      metrics: {
        totalBookings: allBookings.length,
        activeBookingsCount: activeBookings.length,
        completedBookingsCount: completedBookings.length,
        totalSpent,
      },
      activeBookings,
      recentBookings: allBookings.slice(0, 5),
    };
  }

  /**
   * Gets complete list of customer bookings
   */
  async getBookingHistory(client: SupabaseClient<Database>, customerId: string) {
    return bookingsRepository.getCustomerBookings(client, customerId);
  }

  /**
   * Gets active/upcoming bookings
   */
  async getUpcomingBookings(client: SupabaseClient<Database>, customerId: string) {
    const bookings = await bookingsRepository.getCustomerBookings(client, customerId);
    return bookings.filter((b) => !['completed', 'cancelled', 'refunded'].includes(b.status));
  }

  /**
   * Gets past completed bookings
   */
  async getCompletedBookings(client: SupabaseClient<Database>, customerId: string) {
    const bookings = await bookingsRepository.getCustomerBookings(client, customerId);
    return bookings.filter((b) => b.status === 'completed');
  }

  /**
   * Gets cancelled bookings
   */
  async getCancelledBookings(client: SupabaseClient<Database>, customerId: string) {
    const bookings = await bookingsRepository.getCustomerBookings(client, customerId);
    return bookings.filter((b) => ['cancelled', 'refunded'].includes(b.status));
  }

  /**
   * Address Management: List customer saved addresses
   */
  async getSavedAddresses(client: SupabaseClient<Database>, customerId: string) {
    return addressesRepository.getCustomerAddresses(client, customerId);
  }

  /**
   * Address Management: Add a new saved address
   */
  async addAddress(
    client: SupabaseClient<Database>,
    customerId: string,
    addressData: Omit<Database['public']['Tables']['addresses']['Insert'], 'customer_id'>
  ) {
    if (!addressData.house_number || !addressData.street || !addressData.pincode) {
      throw new BadRequestError('House number, street name, and pincode are required');
    }

    return addressesRepository.createAddress(client, {
      ...addressData,
      customer_id: customerId,
    });
  }

  /**
   * Address Management: Update an existing saved address
   */
  async updateAddress(
    client: SupabaseClient<Database>,
    addressId: string,
    customerId: string,
    updates: Database['public']['Tables']['addresses']['Update']
  ) {
    return addressesRepository.updateAddress(client, addressId, customerId, updates);
  }

  /**
   * Address Management: Delete a saved address
   */
  async deleteAddress(client: SupabaseClient<Database>, addressId: string, customerId: string) {
    return addressesRepository.deleteAddress(client, addressId, customerId);
  }
}

export const customerService = new CustomerService();
