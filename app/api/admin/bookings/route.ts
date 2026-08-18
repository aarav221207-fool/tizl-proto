import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = createAdminClient();

    console.info(`[Admin Bookings API] Fetching bookings for admin: ${adminUser.id}`);
    const bookings = await adminService.viewAllBookings(supabase, adminUser.id, 200);

    // Also fetch available cooks, services, cities for filter dropdowns and assignment
    const cooks = await adminService.listCooksForVerification(supabase, adminUser.id);
    const { data: services, error: servicesErr } = await supabase.from('services').select('id, name, category');
    if (servicesErr) console.error('[Admin Bookings API] Error fetching services:', servicesErr);

    const { data: cities, error: citiesErr } = await supabase.from('cities').select('id, name, state');
    if (citiesErr) console.error('[Admin Bookings API] Error fetching cities:', citiesErr);

    return successResponse({
      bookings: bookings || [],
      cooks: cooks || [],
      services: services || [],
      cities: cities || [],
    });
  } catch (err: any) {
    console.error('[Admin Bookings API] Error loading bookings:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

