import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { adminRepository } from '@/repositories/admin.repository';
import { cooksRepository } from '@/repositories/cooks.repository';
import { bookingsRepository } from '@/repositories/bookings.repository';
import { ForbiddenError, NotFoundError } from '@/lib/errors';

export class AdminService {
  /**
   * Validates if user is an authorized admin
   */
  async verifyAdmin(client: SupabaseClient<Database>, userId: string) {
    const adminProfile = await adminRepository.getAdminProfile(client, userId);
    if (adminProfile) {
      return adminProfile;
    }

    const { data: profile } = await client
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single();

    if (profile?.role === 'admin') {
      return {
        id: profile.id,
        profile_id: profile.id,
        designation: 'super_admin',
        permissions: {
          can_manage_admins: true,
          modify_settings: true,
          export_data: true,
          manage_bookings: true,
          manage_cooks: true,
          manage_customers: true,
          view_audit_logs: true,
        },
        created_at: new Date().toISOString(),
      };
    }

    throw new ForbiddenError('Access denied: User is not an admin');
  }

  /**
   * List all cooks with aggregated stats and profiles for admin management
   */
  async listAllCooksAdmin(client: SupabaseClient<Database>, adminUserId: string) {
    await this.verifyAdmin(client, adminUserId);
    return cooksRepository.listAllCooksAdmin(client);
  }

  /**
   * Alias for listAllCooksAdmin
   */
  async listCooksForVerification(client: SupabaseClient<Database>, adminUserId: string) {
    return this.listAllCooksAdmin(client, adminUserId);
  }

  /**
   * Get full cook profile including documents, bookings, reviews, and audit logs
   */
  async getCookFullProfileAdmin(
    client: SupabaseClient<Database>,
    cookId: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);
    const fullProfile = await cooksRepository.getCookFullProfileAdmin(client, cookId);
    if (!fullProfile) throw new NotFoundError('Cook profile not found');
    return fullProfile;
  }

  /**
   * Approve cook verification status and activate profile
   */
  async approveCook(client: SupabaseClient<Database>, cookId: string, adminUserId: string) {
    await this.verifyAdmin(client, adminUserId);

    await cooksRepository.updateVerificationStatus(client, cookId, true, 'verified');
    const updatedProfile = await cooksRepository.updateProfileStatus(client, cookId, 'active');

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'APPROVE_COOK',
      cookId,
      null,
      { is_approved: true, verification_status: 'verified', status: 'active' }
    );

    return updatedProfile;
  }

  /**
   * Reject cook verification status
   */
  async rejectCook(
    client: SupabaseClient<Database>,
    cookId: string,
    reason: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);

    await cooksRepository.updateVerificationStatus(client, cookId, false, 'rejected');
    const updatedProfile = await cooksRepository.updateProfileStatus(client, cookId, 'rejected');

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'REJECT_COOK',
      cookId,
      null,
      { is_approved: false, verification_status: 'rejected', status: 'rejected', reason }
    );

    return updatedProfile;
  }

  /**
   * Request additional verification documents
   */
  async requestCookDocs(
    client: SupabaseClient<Database>,
    cookId: string,
    notes: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);

    await cooksRepository.updateVerificationStatus(client, cookId, false, 'pending_docs');

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'REQUEST_COOK_DOCUMENTS',
      cookId,
      null,
      { verification_status: 'pending_docs', notes }
    );

    return { cookId, notes };
  }

  /**
   * Suspend cook account
   */
  async suspendCook(
    client: SupabaseClient<Database>,
    cookId: string,
    reason: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);

    const updatedProfile = await cooksRepository.updateProfileStatus(client, cookId, 'suspended');

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'SUSPEND_COOK',
      cookId,
      null,
      { status: 'suspended', reason }
    );

    return updatedProfile;
  }

  /**
   * Reactivate cook account
   */
  async reactivateCook(client: SupabaseClient<Database>, cookId: string, adminUserId: string) {
    await this.verifyAdmin(client, adminUserId);

    const updatedProfile = await cooksRepository.updateProfileStatus(client, cookId, 'active');

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'REACTIVATE_COOK',
      cookId,
      null,
      { status: 'active' }
    );

    return updatedProfile;
  }

  /**
   * View system-wide bookings
   */
  async viewAllBookings(client: SupabaseClient<Database>, adminUserId: string, limit = 100) {
    await this.verifyAdmin(client, adminUserId);
    return bookingsRepository.listRecentBookings(client, limit);
  }

  /**
   * Get complete booking details including timeline, history, notes, and cancellations
   */
  async getBookingDetails(client: SupabaseClient<Database>, bookingId: string, adminUserId: string) {
    await this.verifyAdmin(client, adminUserId);
    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const notes = await bookingsRepository.getNotes(client, bookingId);
    return { ...booking, notes };
  }

  /**
   * Assign or reassign a cook to a booking
   */
  async assignCookToBooking(
    client: SupabaseClient<Database>,
    bookingId: string,
    cookId: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);

    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const oldCookId = booking.cook_id;
    const updated = await bookingsRepository.updateBookingStatus(
      client,
      bookingId,
      'cook_assigned',
      adminUserId,
      `Cook assigned by admin`,
      { cook_id: cookId }
    );

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'ASSIGN_COOK',
      bookingId,
      { cook_id: oldCookId },
      { cook_id: cookId }
    );

    return updated;
  }

  /**
   * Override booking status as admin
   */
  async updateBookingStatusAdmin(
    client: SupabaseClient<Database>,
    bookingId: string,
    newStatus: any,
    remarks: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);

    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const updated = await bookingsRepository.updateBookingStatus(
      client,
      bookingId,
      newStatus,
      adminUserId,
      remarks || 'Status override by admin'
    );

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'OVERRIDE_BOOKING_STATUS',
      bookingId,
      { status: booking.status },
      { status: newStatus, remarks }
    );

    return updated;
  }

  /**
   * Cancel booking as admin
   */
  async cancelBookingAdmin(
    client: SupabaseClient<Database>,
    bookingId: string,
    reason: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);

    const booking = await bookingsRepository.getBookingById(client, bookingId);
    if (!booking) throw new NotFoundError('Booking not found');

    const cancelled = await bookingsRepository.cancelBooking(
      client,
      bookingId,
      adminUserId,
      reason || 'Cancelled by admin',
      true
    );

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'CANCEL_BOOKING',
      bookingId,
      { status: booking.status },
      { status: 'cancelled', reason }
    );

    return cancelled;
  }

  /**
   * Add internal operational note to booking
   */
  async addBookingNoteAdmin(
    client: SupabaseClient<Database>,
    bookingId: string,
    note: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);

    const createdNote = await bookingsRepository.addNote(client, bookingId, adminUserId, note);

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'ADD_BOOKING_NOTE',
      createdNote.id,
      null,
      { note, booking_id: bookingId }
    );

    return createdNote;
  }

  /**
   * View system audit logs
   */
  async viewAuditLogs(client: SupabaseClient<Database>, adminUserId: string, limit = 50) {
    await this.verifyAdmin(client, adminUserId);
    return adminRepository.listAuditLogs(client, limit);
  }

  /**
   * Fetch aggregated admin dashboard metrics
   */
  async getDashboardMetrics(client: SupabaseClient<Database>, adminUserId: string) {
    // await this.verifyAdmin(client, adminUserId);
    return adminRepository.getDashboardMetrics(client);
  }

  /**
   * List all registered customers with aggregate stats
   */
  async listAllCustomersAdmin(client: SupabaseClient<Database>, adminUserId: string) {
    await this.verifyAdmin(client, adminUserId);
    const { customersRepository } = await import('@/repositories/customers.repository');
    return customersRepository.listAllCustomersAdmin(client);
  }

  /**
   * Get customer full profile including addresses, bookings, reviews, and audit logs
   */
  async getCustomerFullProfileAdmin(
    client: SupabaseClient<Database>,
    customerId: string,
    adminUserId: string
  ) {
    await this.verifyAdmin(client, adminUserId);
    const { customersRepository } = await import('@/repositories/customers.repository');
    const profile = await customersRepository.getCustomerFullProfileAdmin(client, customerId);
    if (!profile) throw new NotFoundError('Customer profile not found');
    return profile;
  }

  /**
   * Update customer status (active / suspended / inactive)
   */
  async updateCustomerStatusAdmin(
    client: SupabaseClient<Database>,
    customerId: string,
    status: 'active' | 'inactive' | 'suspended',
    adminUserId: string,
    reason?: string
  ) {
    await this.verifyAdmin(client, adminUserId);
    const { customersRepository } = await import('@/repositories/customers.repository');
    const updated = await customersRepository.updateCustomerStatus(client, customerId, status);

    await adminRepository.recordAuditLog(
      client,
      adminUserId,
      'UPDATE_CUSTOMER_STATUS',
      customerId,
      null,
      { status, reason }
    );

    return updated;
  }
}

export const adminService = new AdminService();
