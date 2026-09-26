import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    // Require SUPABASE_SERVICE_ROLE_KEY for privileged admin-wide database queries.
    if (!isSupabaseAdminConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for privileged admin dashboard metrics.',
          message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required for privileged admin dashboard metrics.',
        },
        { status: 500 }
      );
    }

    const supabaseClient = createAdminClient();

    console.info(
      `[Admin Dashboard API] Fetching metrics for admin user: ${adminUser.id} (${adminUser.designation})`
    );

    const metrics = await adminService.getDashboardMetrics(supabaseClient, adminUser.id);
    return NextResponse.json(
      {
        success: true,
        data: { metrics },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (err: any) {
    const isForbidden =
      err?.code === 'FORBIDDEN' ||
      err?.statusCode === 403 ||
      String(err?.message || '').toLowerCase().includes('administrator access') ||
      String(err?.message || '').toLowerCase().includes('permission');

    const isUnauthorized =
      !isForbidden &&
      (err?.code === 'UNAUTHORIZED' ||
        err?.statusCode === 401 ||
        String(err?.message || '').toLowerCase().includes('authentication required') ||
        String(err?.message || '').toLowerCase().includes('log in'));

    const statusCode = isForbidden ? 403 : isUnauthorized ? 401 : (err?.statusCode >= 400 && err?.statusCode < 600 ? err.statusCode : 500);
    const message = isForbidden
      ? (err?.message || 'Access denied: Administrator privileges required.')
      : isUnauthorized
      ? 'Authentication required. Please log in.'
      : (err?.message || 'Failed to load dashboard metrics.');

    return NextResponse.json(
      {
        success: false,
        error: message,
        message,
        code: isForbidden ? 'FORBIDDEN' : isUnauthorized ? 'UNAUTHORIZED' : (err?.code || 'INTERNAL_SERVER_ERROR'),
      },
      { status: statusCode }
    );
  }
}
