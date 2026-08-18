import { SupabaseClient } from '@supabase/supabase-js';
import { Database, BookingStatus } from '@/types/database';
import { BaseRepository } from './base.repository';

export class BookingsRepository extends BaseRepository<'bookings'> {
  constructor() {
    super('bookings');
  }

  /**
   * Helper to generate unique booking number (e.g. TIZL-20260806-X8K2)
   */
  public generateBookingNumber(): string {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `TIZL-${dateStr}-${randomStr}`;
  }

  async createBooking(
    client: SupabaseClient<Database>,
    bookingData: Database['public']['Tables']['bookings']['Insert']
  ) {
    const { data: booking, error } = await client
      .from('bookings')
      .insert({
        ...bookingData,
        booking_number: bookingData.booking_number || this.generateBookingNumber(),
        status: bookingData.status || 'pending_confirmation',
      })
      .select('*, services(*), addresses(*)')
      .single();

    if (error || !booking) {
      throw error || new Error('Failed to create booking record');
    }

    // Initial timeline event
    await this.recordTimeline(client, booking.id, 'Booking Created', 'Customer requested a cook service.');
    // Initial history record
    await this.recordHistory(client, booking.id, null, booking.status as BookingStatus, booking.customer_id, 'Booking initiated by customer');

    return booking;
  }

  async getBookingById(client: SupabaseClient<Database>, bookingId: string) {
    const { data: booking, error } = await client
      .from('bookings')
      .select(`
        *,
        services (*),
        addresses (*),
        customer:profiles!customer_id (*),
        booking_timeline (*),
        booking_history (*),
        booking_cancellations (*)
      `)
      .eq('id', bookingId)
      .single();

    if (error) throw error;
    if (!booking) return null;

    // Resolve cook relationship: bookings.cook_id -> cooks.id -> cooks.profile_id -> profiles.id
    let cookData: {
      id: string;
      full_name: string | null;
      phone: string | null;
      email: string | null;
      avatar_url: string | null;
      display_name: string | null;
      hourly_rate: number | null;
      is_approved: boolean | null;
      verification_status: string | null;
    } | null = null;

    if (booking.cook_id) {
      const { data: cookRecord } = await client
        .from('cooks')
        .select('*')
        .eq('id', booking.cook_id)
        .maybeSingle();

      if (cookRecord) {
        const { data: cookProfile } = await client
          .from('profiles')
          .select('*')
          .eq('id', cookRecord.profile_id)
          .maybeSingle();

        cookData = {
          id: cookRecord.id,
          full_name: cookProfile?.full_name || cookRecord.display_name || 'Cook Partner',
          phone: cookProfile?.phone || null,
          email: cookProfile?.email || null,
          avatar_url: cookProfile?.avatar_url || null,
          display_name: cookRecord.display_name,
          hourly_rate: cookRecord.hourly_rate,
          is_approved: cookRecord.is_approved,
          verification_status: cookRecord.verification_status,
        };
      }
    }

    return {
      ...booking,
      cook: cookData,
    };
  }

  async getCustomerBookings(client: SupabaseClient<Database>, customerId: string) {
    const { data: bookings, error } = await client
      .from('bookings')
      .select('*, services(*), addresses(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    // Batch resolve cooks
    const cookIds = Array.from(new Set(bookings.map((b) => b.cook_id).filter(Boolean))) as string[];
    const cookMap = new Map<string, { full_name: string | null; phone: string | null; avatar_url: string | null }>();

    if (cookIds.length > 0) {
      const { data: cooks } = await client.from('cooks').select('id, profile_id, display_name').in('id', cookIds);
      if (cooks && cooks.length > 0) {
        const profileIds = cooks.map((c) => c.profile_id).filter(Boolean);
        const { data: profiles } = await client.from('profiles').select('id, full_name, phone, avatar_url').in('id', profileIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        cooks.forEach((c) => {
          const prof = profileMap.get(c.profile_id);
          cookMap.set(c.id, {
            full_name: prof?.full_name || c.display_name || 'Cook Partner',
            phone: prof?.phone || null,
            avatar_url: prof?.avatar_url || null,
          });
        });
      }
    }

    return bookings.map((b) => ({
      ...b,
      cook: b.cook_id ? cookMap.get(b.cook_id) || null : null,
    }));
  }

  async getCookBookings(client: SupabaseClient<Database>, cookIdOrProfileId: string) {
    // Resolve actual cooks.id
    let actualCookId = cookIdOrProfileId;
    const { data: cookRecord } = await client
      .from('cooks')
      .select('id')
      .or(`id.eq.${cookIdOrProfileId},profile_id.eq.${cookIdOrProfileId}`)
      .maybeSingle();

    if (cookRecord) {
      actualCookId = cookRecord.id;
    }

    const { data: bookings, error } = await client
      .from('bookings')
      .select('*, services(*), addresses(*), customer:profiles!customer_id(full_name, phone)')
      .eq('cook_id', actualCookId)
      .order('booking_date', { ascending: true });

    if (error) throw error;
    return bookings || [];
  }

  async listRecentBookings(client: SupabaseClient<Database>, limit = 50) {
    const { data: bookings, error } = await client
      .from('bookings')
      .select('*, services(*), addresses(*), customer:profiles!customer_id(full_name, phone, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    if (!bookings || bookings.length === 0) return [];

    // Batch resolve cooks
    const cookIds = Array.from(new Set(bookings.map((b) => b.cook_id).filter(Boolean))) as string[];
    const cookMap = new Map<string, { id: string; full_name: string | null; phone: string | null }>();

    if (cookIds.length > 0) {
      const { data: cooks } = await client.from('cooks').select('id, profile_id, display_name').in('id', cookIds);
      if (cooks && cooks.length > 0) {
        const profileIds = cooks.map((c) => c.profile_id).filter(Boolean);
        const { data: profiles } = await client.from('profiles').select('id, full_name, phone').in('id', profileIds);
        const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

        cooks.forEach((c) => {
          const prof = profileMap.get(c.profile_id);
          cookMap.set(c.id, {
            id: c.id,
            full_name: prof?.full_name || c.display_name || 'Cook Partner',
            phone: prof?.phone || null,
          });
        });
      }
    }

    return bookings.map((b) => ({
      ...b,
      cook: b.cook_id ? cookMap.get(b.cook_id) || null : null,
    }));
  }

  async updateBookingStatus(
    client: SupabaseClient<Database>,
    bookingId: string,
    newStatus: BookingStatus,
    changedById: string | null,
    remarks?: string,
    updates: Partial<Database['public']['Tables']['bookings']['Update']> = {}
  ) {
    // Get current status for history
    const current = await client
      .from('bookings')
      .select('status')
      .eq('id', bookingId)
      .single();

    const oldStatus = (current.data?.status as BookingStatus) || null;

    const { data: updated, error } = await client
      .from('bookings')
      .update({
        status: newStatus,
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId)
      .select()
      .single();

    if (error || !updated) {
      throw error || new Error('Failed to update booking status');
    }

    // Record timeline & status history
    await this.recordTimeline(
      client,
      bookingId,
      `Status changed to ${newStatus.replace('_', ' ')}`,
      remarks || `Booking status updated to ${newStatus}`
    );

    await this.recordHistory(client, bookingId, oldStatus, newStatus, changedById, remarks);

    return updated;
  }

  async cancelBooking(
    client: SupabaseClient<Database>,
    bookingId: string,
    cancelledById: string,
    reason: string,
    refundRequired = false
  ) {
    // 1. Record cancellation entry
    await client.from('booking_cancellations').insert({
      booking_id: bookingId,
      cancelled_by: cancelledById,
      reason,
      refund_required: refundRequired,
    });

    // 2. Update status to cancelled
    return this.updateBookingStatus(
      client,
      bookingId,
      'cancelled',
      cancelledById,
      `Cancelled: ${reason}`
    );
  }

  async recordTimeline(
    client: SupabaseClient<Database>,
    bookingId: string,
    eventTitle: string,
    eventDescription?: string
  ) {
    await client.from('booking_timeline').insert({
      booking_id: bookingId,
      event_title: eventTitle,
      event_description: eventDescription || null,
    });
  }

  async recordHistory(
    client: SupabaseClient<Database>,
    bookingId: string,
    oldStatus: BookingStatus | null,
    newStatus: BookingStatus,
    changedBy: string | null,
    remarks?: string
  ) {
    await client.from('booking_history').insert({
      booking_id: bookingId,
      old_status: oldStatus,
      new_status: newStatus,
      changed_by: changedBy,
      remarks: remarks || null,
    });
  }

  async addNote(
    client: SupabaseClient<Database>,
    bookingId: string,
    authorId: string,
    note: string
  ) {
    const { data, error } = await client
      .from('booking_notes')
      .insert({
        booking_id: bookingId,
        author_id: authorId,
        note,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getNotes(client: SupabaseClient<Database>, bookingId: string) {
    const { data, error } = await client
      .from('booking_notes')
      .select('*, author:profiles(full_name)')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
}

export const bookingsRepository = new BookingsRepository();
