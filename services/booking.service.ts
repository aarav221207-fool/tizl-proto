import { SupabaseClient } from '@supabase/supabase-js';
import { Database, BookingStatus } from '@/types/database';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { servicesRepository } from '@/repositories/services.repository';
import { addressesRepository } from '@/repositories/addresses.repository';
import { cooksRepository } from '@/repositories/cooks.repository';
import { BadRequestError, NotFoundError } from '@/lib/errors';

/**
 * Valid Booking State Transition Rules
 */
const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending_confirmation: ['searching', 'cancelled'],
  searching: ['matched', 'cancelled'],
  matched: ['accepted', 'cancelled'],
  accepted: ['cook_assigned', 'cancelled'],
  cook_assigned: ['cook_arriving', 'cancelled'],
  cook_arriving: ['cooking', 'cancelled'],
  cooking: ['completed', 'cancelled'],
  completed: [],
  cancelled: ['refunded'],
  refunded: [],
};

export class BookingService {
  /**
   * Validates if a state transition from `currentStatus` to `newStatus` is allowed
   */
  public validateTransition(currentStatus: BookingStatus, newStatus: BookingStatus): void {
    if (currentStatus === newStatus) return;

    const allowedNext = ALLOWED_TRANSITIONS[currentStatus] || [];
    if (!allowedNext.includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: [${allowedNext.join(', ')}]`
      );
    }
  }

  /**
   * Creates a new booking with validation, pricing computation, and timeline event
   */
  async createBooking(
    client: SupabaseClient<Database>,
    customerId: string,
    data: {
      service_id: string;
      address_id: string;
      booking_date: string;
      start_time: string;
      duration_hours: number;
      guest_count?: number;
      cooking_notes?: string;
    }
  ) {
    if (!data.booking_date || !data.start_time || !data.duration_hours) {
      throw new BadRequestError('Missing required booking parameters');
    }

    if (data.duration_hours <= 0 || data.duration_hours > 12) {
      throw new BadRequestError('Duration must be between 1 and 12 hours');
    }

    // 1. Fetch Service details (by ID or fallback to first active service)
    let service: Database['public']['Tables']['services']['Row'] | null = null;
    if (data.service_id) {
      try {
        service = await servicesRepository.getServiceById(client, data.service_id);
      } catch {
        const activeServices = await servicesRepository.listActiveServices(client);
        service = activeServices.find(s => s.id === data.service_id || s.name.toLowerCase().includes(data.service_id.toLowerCase())) || activeServices[0] || null;
      }
    } else {
      const activeServices = await servicesRepository.listActiveServices(client);
      service = activeServices[0] || null;
    }

    if (!service) {
      throw new BadRequestError('No active cooking service found');
    }

    // 2. Ensure customer address
    let addressId = data.address_id;
    if (!addressId || addressId === 'default') {
      const addresses = await addressesRepository.getCustomerAddresses(client, customerId);
      if (addresses.length > 0) {
        addressId = addresses[0].id;
      } else {
        const newAddr = await addressesRepository.createAddress(client, {
          customer_id: customerId,
          title: 'Home',
          house_number: '1',
          street: 'Main Street',
          locality: 'Delhi NCR',
          is_default: true,
        });
        addressId = newAddr.id;
      }
    }

    // 3. Compute exact pricing breakdown
    const hourlyRate = service.base_price || 299;
    const subtotal = hourlyRate * Number(data.duration_hours);
    const platformFee = Math.round(subtotal * 0.1); // 10% platform fee
    const taxAmount = Math.round(subtotal * 0.05);   // 5% GST/Tax
    const totalAmount = subtotal + platformFee + taxAmount;

    // 4. Generate 4-digit session start OTP
    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    // 5. Create record via repository
    const booking = await bookingsRepository.createBooking(client, {
      customer_id: customerId,
      service_id: service.id,
      address_id: addressId,
      booking_date: data.booking_date,
      start_time: data.start_time,
      duration_hours: Number(data.duration_hours),
      guest_count: Number(data.guest_count || 2),
      cooking_notes: data.cooking_notes || null,
      hourly_rate: hourlyRate,
      subtotal,
      platform_fee: platformFee,
      tax_amount: taxAmount,
      discount_amount: 0,
      total_amount: totalAmount,
      otp,
      otp_verified: false,
      booking_number: bookingsRepository.generateBookingNumber(),
      status: 'pending_confirmation',
    });

    return booking;
  }

  /**
   * Finds available verified cooks for a given booking
   */
  async searchAvailableCooks(client: SupabaseClient<Database>, _bookingId: string) {
    const cooks = await cooksRepository.listVerifiedCooks(client, 20);
    return cooks;
  }

  /**
   * Assigns a cook to a booking and updates state to 'cook_assigned'
   */
  async assignCook(
    client: SupabaseClient<Database>,
    bookingId: string,
    cookId: string,
    assignedBy: string
  ) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    this.validateTransition(booking.status as BookingStatus, 'cook_assigned');

    return bookingsRepository.updateBookingStatus(
      client,
      bookingId,
      'cook_assigned',
      assignedBy,
      'Cook assigned to booking',
      { cook_id: cookId }
    );
  }

  /**
   * Updates booking status with strict state machine verification
   */
  async updateBookingStatus(
    client: SupabaseClient<Database>,
    bookingId: string,
    newStatus: BookingStatus,
    changedById: string,
    remarks?: string
  ) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    this.validateTransition(booking.status as BookingStatus, newStatus);

    return bookingsRepository.updateBookingStatus(
      client,
      bookingId,
      newStatus,
      changedById,
      remarks || `Status transitioned to ${newStatus}`
    );
  }

  /**
   * Cancels a booking safely with reason logging
   */
  async cancelBooking(
    client: SupabaseClient<Database>,
    bookingId: string,
    cancelledById: string,
    reason: string
  ) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.status === 'completed' || booking.status === 'cancelled') {
      throw new BadRequestError(`Cannot cancel a booking that is already ${booking.status}`);
    }

    this.validateTransition(booking.status as BookingStatus, 'cancelled');

    return bookingsRepository.cancelBooking(client, bookingId, cancelledById, reason);
  }

  /**
   * Completes a booking with optional OTP verification
   */
  async completeBooking(
    client: SupabaseClient<Database>,
    bookingId: string,
    cookId: string,
    otp?: string
  ) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    if (booking.cook_id && booking.cook_id !== cookId) {
      throw new BadRequestError('Unauthorized cook attempting to complete booking');
    }

    if (otp && booking.otp && booking.otp !== otp) {
      throw new BadRequestError('Invalid OTP code');
    }

    this.validateTransition(booking.status as BookingStatus, 'completed');

    return bookingsRepository.updateBookingStatus(
      client,
      bookingId,
      'completed',
      cookId,
      'Booking completed successfully',
      { otp_verified: true }
    );
  }

  /**
   * Fetch full details for a booking including timeline and history
   */
  async getBookingDetails(client: SupabaseClient<Database>, bookingId: string) {
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');
    return booking;
  }
}

export const bookingService = new BookingService();
