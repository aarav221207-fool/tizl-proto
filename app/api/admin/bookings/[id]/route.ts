import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = createAdminClient();

    console.info(`[Admin Booking Details API] Fetching booking ${id} for admin: ${adminUser.id}`);
    const bookingDetails = await adminService.getBookingDetails(supabase, id, adminUser.id);
    return successResponse({ booking: bookingDetails });
  } catch (err: any) {
    console.error('[Admin Booking Details API] Error loading booking:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_bookings');

    const supabase = createAdminClient();
    const body = await req.json();

    const { action } = body;

    if (action === 'assign_cook') {
      const { cook_id } = body;
      if (!cook_id) throw new BadRequestError('Cook ID is required for assignment');
      const updated = await adminService.assignCookToBooking(supabase, id, cook_id, adminUser.id);
      return successResponse({ booking: updated, message: 'Cook assigned successfully' });
    }

    if (action === 'update_status') {
      const { status, remarks } = body;
      if (!status) throw new BadRequestError('Status is required');
      const updated = await adminService.updateBookingStatusAdmin(
        supabase,
        id,
        status,
        remarks,
        adminUser.id
      );
      return successResponse({ booking: updated, message: 'Booking status updated successfully' });
    }

    if (action === 'cancel') {
      const { reason } = body;
      if (!reason) throw new BadRequestError('Cancellation reason is required');
      const cancelled = await adminService.cancelBookingAdmin(supabase, id, reason, adminUser.id);
      return successResponse({ booking: cancelled, message: 'Booking cancelled successfully' });
    }

    if (action === 'add_note') {
      const { note } = body;
      if (!note) throw new BadRequestError('Note content is required');
      const createdNote = await adminService.addBookingNoteAdmin(supabase, id, note, adminUser.id);
      return successResponse({ note: createdNote, message: 'Note added successfully' });
    }

    throw new BadRequestError('Invalid or unsupported action specified');
  } catch (err: any) {
    console.error('[Admin Booking Action API] Error processing action:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

