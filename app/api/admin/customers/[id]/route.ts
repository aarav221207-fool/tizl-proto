import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = createAdminClient();
    const { id } = await params;

    console.info(`[Admin Customer Profile API] Fetching customer ${id} for admin: ${adminUser.id}`);
    const customerProfile = await adminService.getCustomerFullProfileAdmin(supabase, id, adminUser.id);
    return successResponse({ customerProfile });
  } catch (err: any) {
    console.error('[Admin Customer Profile API] Error loading customer profile:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

