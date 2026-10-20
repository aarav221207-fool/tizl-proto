import { SupabaseClient } from '@supabase/supabase-js';
import { Database, BookingStatus } from '@/types/database';
import { BaseRepository } from './base.repository';
import { analyticsService } from '@/services/analytics.service';

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
    let booking: any = null;

    const { data: deepBooking, error } = await client
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
      .maybeSingle();

    if (error || !deepBooking) {
      console.warn('[BookingsRepository] Deep join getBookingById failed or had error, using fallback:', error?.message);
      const { data: rawBooking, error: rawError } = await client
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .maybeSingle();

      if (rawError) throw rawError;
      if (!rawBooking) return null;

      const [servicesRes, addressesRes, customerRes, timelineRes, historyRes, cancelRes] = await Promise.all([
        rawBooking.service_id ? client.from('services').select('*').eq('id', rawBooking.service_id).maybeSingle() : { data: null },
        rawBooking.address_id ? client.from('addresses').select('*').eq('id', rawBooking.address_id).maybeSingle() : { data: null },
        rawBooking.customer_id ? client.from('profiles').select('*').eq('id', rawBooking.customer_id).maybeSingle() : { data: null },
        client.from('booking_timeline').select('*').eq('booking_id', bookingId).order('created_at', { ascending: true }),
        client.from('booking_history').select('*').eq('booking_id', bookingId).order('created_at', { ascending: false }),
        client.from('booking_cancellations').select('*').eq('booking_id', bookingId).maybeSingle(),
      ]);

      booking = {
        ...rawBooking,
        services: servicesRes.data || null,
        addresses: addressesRes.data || null,
        customer: customerRes.data || null,
        booking_timeline: timelineRes.data || [],
        booking_history: historyRes.data || [],
        booking_cancellations: cancelRes.data ? [cancelRes.data] : [],
      };
    } else {
      booking = deepBooking;
    }

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
      } else {
        const { data: directProfile } = await client
          .from('profiles')
          .select('*')
          .eq('id', booking.cook_id)
          .maybeSingle();
        if (directProfile) {
          cookData = {
            id: directProfile.id,
            full_name: directProfile.full_name || 'Cook Partner',
            phone: directProfile.phone || null,
            email: directProfile.email || null,
            avatar_url: directProfile.avatar_url || null,
            display_name: directProfile.full_name,
            hourly_rate: null,
            is_approved: true,
            verification_status: 'verified',
          };
        }
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
    let bookingsList: any[] = [];

    const { data: bookings, error } = await client
      .from('bookings')
      .select('*, services(*), addresses(*), customer:profiles!customer_id(full_name, phone, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error || !bookings) {
      console.warn('[BookingsRepository] Complex join error, using resilient fallback:', error?.message);
      const baseResult = await client
        .from('bookings')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (baseResult.error) throw baseResult.error;
      const rawBookings = baseResult.data || [];
      if (rawBookings.length === 0) return [];

      const serviceIds = Array.from(new Set(rawBookings.map((b) => b.service_id).filter(Boolean))) as string[];
      const addressIds = Array.from(new Set(rawBookings.map((b) => b.address_id).filter(Boolean))) as string[];
      const customerIds = Array.from(new Set(rawBookings.map((b) => b.customer_id).filter(Boolean))) as string[];

      const [servicesRes, addressesRes, customersRes] = await Promise.all([
        serviceIds.length ? client.from('services').select('*').in('id', serviceIds) : { data: [] },
        addressIds.length ? client.from('addresses').select('*').in('id', addressIds) : { data: [] },
        customerIds.length
          ? client.from('profiles').select('id, full_name, phone, email').in('id', customerIds)
          : { data: [] },
      ]);

      const serviceMap = new Map((servicesRes.data || []).map((s) => [s.id, s]));
      const addressMap = new Map((addressesRes.data || []).map((a) => [a.id, a]));
      const customerMap = new Map((customersRes.data || []).map((c) => [c.id, c]));

      bookingsList = rawBookings.map((b) => ({
        ...b,
        services: b.service_id ? serviceMap.get(b.service_id) || null : null,
        addresses: b.address_id ? addressMap.get(b.address_id) || null : null,
        customer: b.customer_id ? customerMap.get(b.customer_id) || null : null,
      }));
    } else {
      bookingsList = bookings;
    }

    if (bookingsList.length === 0) return [];

    // Batch resolve cooks
    const cookIds = Array.from(new Set(bookingsList.map((b) => b.cook_id).filter(Boolean))) as string[];
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

      // Check for cooks that weren't found in cooks table (in case cook_id was a profile_id directly)
      const missingCookIds = cookIds.filter((id) => !cookMap.has(id));
      if (missingCookIds.length > 0) {
        const { data: directProfiles } = await client
          .from('profiles')
          .select('id, full_name, phone')
          .in('id', missingCookIds);
        (directProfiles || []).forEach((p) => {
          cookMap.set(p.id, {
            id: p.id,
            full_name: p.full_name || 'Cook Partner',
            phone: p.phone || null,
          });
        });
      }
    }

    return bookingsList.map((b) => ({
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

    // Record booking_status_changed event in Supabase analytics
    try {
      await analyticsService.recordEvent(client, {
        profileId: changedById || updated.customer_id,
        eventName: 'booking_status_changed',
        eventData: {
          booking_id: bookingId,
          booking_number: updated.booking_number,
          old_status: oldStatus,
          new_status: newStatus,
          changed_by: changedById,
          remarks: remarks || null,
          customer_id: updated.customer_id,
          cook_id: updated.cook_id,
          timestamp: new Date().toISOString(),
        },
        path: `/admin/bookings/${bookingId}`,
      });
    } catch (statusEvtErr) {
      console.warn('[BookingsRepository] Failed to record booking_status_changed event:', statusEvtErr);
    }

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
