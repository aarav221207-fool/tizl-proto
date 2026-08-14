import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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

    const supabase = await createClient();
    const { id } = await params;

    const cookProfile = await adminService.getCookFullProfileAdmin(supabase, id, adminUser.id);
    return successResponse({ cookProfile });
  } catch (err) {
    return errorResponse(err);
  }
}
