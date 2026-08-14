import { SupabaseClient } from '@supabase/supabase-js';
import { Database, BookingStatus } from '@/types/database';
import { cooksRepository } from '@/repositories/cooks.repository';
import { customersRepository } from '@/repositories/customers.repository';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { adminRepository } from '@/repositories/admin.repository';
import { bookingService } from '@/services/booking.service';
import { BadRequestError, NotFoundError, ForbiddenError } from '@/lib/errors';

export class CookService {
  /**
   * Retrieves cook profile and detailed professional profile
   */
  async getProfile(client: SupabaseClient<Database>, cookId: string) {
    const [profile, cookDetails] = await Promise.all([
      customersRepository.getProfile(client, cookId),
      cooksRepository.getCookDetails(client, cookId),
    ]);

    return {
      profile,
      details: cookDetails,
    };
  }

  /**
   * Register or complete cook profile details
   */
  async registerCook(
    client: SupabaseClient<Database>,
    cookId: string,
    details: Omit<Database['public']['Tables']['cook_details']['Insert'], 'cook_id'>
  ) {
    // 1. Ensure user role is 'cook'
    await customersRepository.updateProfile(client, cookId, {
      role: 'cook',
      updated_at: new Date().toISOString(),
    });

    // 2. Register cook details
    const createdDetails = await cooksRepository.registerCookDetails(client, {
      cook_id: cookId,
      ...details,
      is_verified: false,
      police_verification_status: 'pending',
      updated_at: new Date().toISOString(),
    });

    return createdDetails;
  }

  /**
   * Updates cook profile and professional details
   */
  async updateProfile(
    client: SupabaseClient<Database>,
    cookId: string,
    updates: {
      full_name?: string;
      phone?: string;
      bio?: string;
      experience_years?: number;
      speciality?: string[];
      hourly_rate?: number;
    }
  ) {
    const { full_name, phone, ...cookUpdates } = updates;

    if (full_name || phone) {
      await customersRepository.updateProfile(client, cookId, {
        ...(full_name && { full_name }),
        ...(phone && { phone }),
        updated_at: new Date().toISOString(),
      });
    }

    if (Object.keys(cookUpdates).length > 0) {
      await cooksRepository.registerCookDetails(client, {
        cook_id: cookId,
        ...cookUpdates,
        updated_at: new Date().toISOString(),
      });
    }

    return this.getProfile(client, cookId);
  }

  /**
   * Gets cook availability status
   */
  async getAvailability(client: SupabaseClient<Database>, cookId: string) {
    const profile = await customersRepository.getProfile(client, cookId);
    return {
      cook_id: cookId,
      status: profile.status,
      is_online: profile.status === 'active' || profile.status === 'online',
    };
  }

  /**
   * Updates cook online/offline availability status
   */
  async updateAvailability(client: SupabaseClient<Database>, cookId: string, isOnline: boolean) {
    const status = isOnline ? 'active' : 'inactive';
    return customersRepository.updateProfile(client, cookId, {
      status,
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Updates current location (placeholder hook for future GPS matching)
   */
  async updateCurrentLocation(
    client: SupabaseClient<Database>,
    cookId: string,
    latitude: number,
    longitude: number
  ) {
    // Current database schema tracks availability status; latitude/longitude can be attached to cook_details bank_details or analytics
    return {
      cook_id: cookId,
      latitude,
      longitude,
      updated_at: new Date().toISOString(),
    };
  }

  /**
   * Lists verified cooks available for booking assignment
   */
  async listAvailableCooks(client: SupabaseClient<Database>, limit = 20) {
    return cooksRepository.listVerifiedCooks(client, limit);
  }

  /**
   * Fetch active assigned bookings for a cook
   */
  async getAssignedBookings(client: SupabaseClient<Database>, cookId: string) {
    const bookings = await bookingsRepository.getCookBookings(client, cookId);
    return bookings.filter((b) => !['completed', 'cancelled', 'refunded'].includes(b.status));
  }

  /**
   * Fetch booking history for a cook
   */
  async getBookingHistory(client: SupabaseClient<Database>, cookId: string) {
    return bookingsRepository.getCookBookings(client, cookId);
  }

  /**
   * Cook accepts an assigned booking
   */
  async acceptBooking(client: SupabaseClient<Database>, bookingId: string, cookId: string) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.cook_id && booking.cook_id !== cookId) {
      throw new BadRequestError('This booking is already assigned to another cook');
    }

    // Ensure cook is verified
    const details = await cooksRepository.getCookDetails(client, cookId);
    if (!details || !details.is_verified) {
      throw new ForbiddenError('Only verified cooks can accept bookings');
    }

    return bookingService.updateBookingStatus(
      client,
      bookingId,
      'accepted',
      cookId,
      'Booking accepted by cook'
    );
  }

  /**
   * Cook rejects an assigned booking
   */
  async rejectBooking(
    client: SupabaseClient<Database>,
    bookingId: string,
    cookId: string,
    reason: string
  ) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.cook_id !== cookId) {
      throw new BadRequestError('You are not assigned to this booking');
    }

    // Unassign cook and reset status to searching so another cook can be matched
    await bookingsRepository.updateBookingStatus(
      client,
      bookingId,
      'searching',
      cookId,
      `Cook rejected booking: ${reason}`,
      { cook_id: null }
    );

    return { success: true, message: 'Booking rejected' };
  }

  /**
   * Cook starts journey to customer location
   */
  async startJourney(client: SupabaseClient<Database>, bookingId: string, cookId: string) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.cook_id !== cookId) {
      throw new ForbiddenError('Not assigned to this booking');
    }

    return bookingService.updateBookingStatus(
      client,
      bookingId,
      'cook_arriving',
      cookId,
      'Cook is en route to customer location'
    );
  }

  /**
   * Cook arrives at customer location
   */
  async arriveAtCustomer(client: SupabaseClient<Database>, bookingId: string, cookId: string) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.cook_id !== cookId) {
      throw new ForbiddenError('Not assigned to this booking');
    }

    await bookingsRepository.recordTimeline(
      client,
      bookingId,
      'Cook Arrived',
      'Cook has arrived at the customer doorstep'
    );

    return booking;
  }

  /**
   * Cook starts cooking session
   */
  async startCooking(client: SupabaseClient<Database>, bookingId: string, cookId: string) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.cook_id !== cookId) {
      throw new ForbiddenError('Not assigned to this booking');
    }

    return bookingService.updateBookingStatus(
      client,
      bookingId,
      'cooking',
      cookId,
      'Cook started cooking session'
    );
  }

  /**
   * Cook completes booking with OTP verification
   */
  async completeBooking(
    client: SupabaseClient<Database>,
    bookingId: string,
    cookId: string,
    otp?: string
  ) {
    return bookingService.completeBooking(client, bookingId, cookId, otp);
  }

  /**
   * Upload verification documents (Aadhaar number, bank details)
   */
  async uploadVerificationDocuments(
    client: SupabaseClient<Database>,
    cookId: string,
    documents: {
      aadhaar_number?: string;
      bank_details?: Record<string, unknown>;
    }
  ) {
    return cooksRepository.registerCookDetails(client, {
      cook_id: cookId,
      ...documents,
      police_verification_status: 'pending',
      updated_at: new Date().toISOString(),
    });
  }

  /**
   * Admin approves cook verification status
   */
  async updateVerificationStatus(
    client: SupabaseClient<Database>,
    cookId: string,
    adminProfileId: string
  ) {
    return adminRepository.approveCookVerification(client, cookId, adminProfileId);
  }
}

export const cookService = new CookService();
