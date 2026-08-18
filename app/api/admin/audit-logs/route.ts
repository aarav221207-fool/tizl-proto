import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_audit_logs');

    const supabase = createAdminClient();

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const actionFilter = searchParams.get('action');

    console.info(`[Admin Audit Logs API] Fetching audit logs for admin: ${adminUser.id}`);
    let query = supabase
      .from('audit_logs')
      .select('*, profile:profiles(full_name, email)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (actionFilter && actionFilter !== 'all') {
      query = query.eq('action', actionFilter);
    }

    const { data: logs, error } = await query;
    if (error) throw error;

    return successResponse({ logs: logs || [] });
  } catch (err: any) {
    console.error('[Admin Audit Logs API] Error loading audit logs:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

