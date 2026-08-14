import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function GET() {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = await createClient();
    const cooks = await adminService.listAllCooksAdmin(supabase, adminUser.id);
    return successResponse({ cooks });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_cooks');

    const supabase = await createClient();
    const body = await req.json();

    const { cook_id, action, reason, notes } = body;

    if (!cook_id) throw new BadRequestError('Cook ID is required');

    if (action === 'approve') {
      const res = await adminService.approveCook(supabase, cook_id, adminUser.id);
      return successResponse({ result: res });
    } else if (action === 'reject') {
      const res = await adminService.rejectCook(supabase, cook_id, reason || 'Document verification failed', adminUser.id);
      return successResponse({ result: res });
    } else if (action === 'request_docs') {
      const res = await adminService.requestCookDocs(supabase, cook_id, notes || 'Please upload updated documents', adminUser.id);
      return successResponse({ result: res });
    } else if (action === 'suspend') {
      const res = await adminService.suspendCook(supabase, cook_id, reason || 'Policy violation', adminUser.id);
      return successResponse({ result: res });
    } else if (action === 'reactivate') {
      const res = await adminService.reactivateCook(supabase, cook_id, adminUser.id);
      return successResponse({ result: res });
    }

    throw new BadRequestError('Invalid action specified');
  } catch (err) {
    return errorResponse(err);
  }
}
