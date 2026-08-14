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

    const customers = await adminService.listAllCustomersAdmin(supabase, adminUser.id);
    return successResponse({ customers });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_customers');

    const supabase = await createClient();
    const body = await req.json();

    const { customer_id, status, reason } = body;

    if (!customer_id) throw new BadRequestError('Customer ID is required');
    if (!status) throw new BadRequestError('Status is required');

    const updated = await adminService.updateCustomerStatusAdmin(
      supabase,
      customer_id,
      status,
      adminUser.id,
      reason
    );

    return successResponse({ customer: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
