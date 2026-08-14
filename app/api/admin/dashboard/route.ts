import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = await createClient();

    const metrics = await adminService.getDashboardMetrics(supabase, adminUser.id);
    return successResponse({ metrics });
  } catch (err) {
    return errorResponse(err);
  }
}
