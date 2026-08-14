import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = await createClient();

    const bookings = await adminService.viewAllBookings(supabase, adminUser.id, 200);

    // Also fetch available cooks, services, cities for filter dropdowns and assignment
    const cooks = await adminService.listCooksForVerification(supabase, adminUser.id);
    const { data: services } = await supabase.from('services').select('id, name, category');
    const { data: cities } = await supabase.from('cities').select('id, name, state');

    return successResponse({
      bookings,
      cooks: cooks || [],
      services: services || [],
      cities: cities || [],
    });
  } catch (err) {
    return errorResponse(err);
  }
}
