import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    // Require SUPABASE_SERVICE_ROLE_KEY for privileged admin-wide database queries.
    if (
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.SUPABASE_SERVICE_ROLE_KEY === 'placeholder-service-role-key'
    ) {
      return errorResponse(
        new Error('Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for privileged admin dashboard metrics.')
      );
    }

    const supabaseClient = createAdminClient();

    console.info(
      `[Admin Dashboard API] Fetching metrics for admin user: ${adminUser.id} (${adminUser.designation})`
    );

    const metrics = await adminService.getDashboardMetrics(supabaseClient, adminUser.id);
    return successResponse({ metrics });
  } catch (err: any) {
    console.error('[Admin Dashboard API] Error loading dashboard metrics:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

