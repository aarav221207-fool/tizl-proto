import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { cookies, headers } from 'next/headers';
import { UnauthorizedError, ForbiddenError } from '@/lib/errors';
import { AuthenticatedUser } from '@/types/auth';

export type AdminDesignation = 'super_admin' | 'admin' | 'support';

export interface AuthenticatedAdminUser extends AuthenticatedUser {
  adminId: string | null;
  designation: AdminDesignation;
  permissions: Record<string, boolean>;
}

/**
 * Verifies that the incoming request is from an authenticated user
 * who possesses administrative access (role = 'admin' or listed in admin_users).
 * Supports Supabase session cookies, dedicated admin_token / admin_session cookies,
 * and Authorization: Bearer <token> headers.
 */
export async function authenticateAdminRequest(): Promise<AuthenticatedAdminUser> {
  const cookieStore = await cookies();
  const supabase = await createClient();

  let user: any = null;

  // 1. Try standard Supabase session cookies first
  try {
    const { data: { user: sbUser }, error: sbError } = await supabase.auth.getUser();
    if (!sbError && sbUser) {
      user = sbUser;
    }
  } catch {
    // Continue to alternative auth mechanisms
  }

  // 2. Check dedicated admin_token or admin_session cookie
  if (!user) {
    const adminToken = cookieStore.get('admin_token')?.value || cookieStore.get('admin_session')?.value;
    if (adminToken) {
      try {
        const adminSupabase = createAdminClient();
        const { data: { user: tokenUser }, error: tokenError } = await adminSupabase.auth.getUser(adminToken);
        if (!tokenError && tokenUser) {
          user = tokenUser;
        }
      } catch {
        // Token invalid or expired
      }
    }
  }

  // 3. Check Authorization: Bearer <token> header
  if (!user) {
    try {
      const headerList = await headers();
      const authHeader = headerList.get('authorization') || headerList.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const bearerToken = authHeader.substring(7).trim();
        if (bearerToken) {
          const adminSupabase = createAdminClient();
          const { data: { user: bearerUser }, error: bearerError } = await adminSupabase.auth.getUser(bearerToken);
          if (!bearerError && bearerUser) {
            user = bearerUser;
          }
        }
      }
    } catch {
      // Header check failed
    }
  }

  if (!user) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }

  // Fetch user profile and admin record using admin client to bypass RLS hurdles safely
  let profile = null;
  let adminRecord = null;
  try {
    const adminSupabase = createAdminClient();
    const [pRes, aRes] = await Promise.all([
      adminSupabase.from('profiles').select('id, email, phone, role, full_name').eq('id', user.id).maybeSingle(),
      adminSupabase.from('admin_users').select('*').eq('profile_id', user.id).maybeSingle(),
    ]);
    profile = pRes.data;
    adminRecord = aRes.data;
  } catch {
    const [pRes, aRes] = await Promise.all([
      supabase.from('profiles').select('id, email, phone, role, full_name').eq('id', user.id).maybeSingle(),
      supabase.from('admin_users').select('*').eq('profile_id', user.id).maybeSingle(),
    ]);
    profile = pRes.data;
    adminRecord = aRes.data;
  }

  const isProfileAdmin =
    profile?.role === 'admin' || user.user_metadata?.role === 'admin' || !!adminRecord;

  if (!isProfileAdmin && !adminRecord) {
    throw new ForbiddenError('This account does not have administrator access.');
  }

  const designation: AdminDesignation =
    (adminRecord?.designation as AdminDesignation) || (profile?.role === 'admin' ? 'super_admin' : 'admin');
  const defaultPermissions: Record<string, boolean> = {
    can_manage_admins: designation === 'super_admin',
    modify_settings: true,
    export_data: true,
    manage_bookings: true,
    manage_cooks: true,
    manage_customers: true,
    view_audit_logs: true,
  };

  let permissions: Record<string, boolean> = defaultPermissions;
  if (adminRecord?.permissions && typeof adminRecord.permissions === 'object' && !Array.isArray(adminRecord.permissions)) {
    permissions = {
      ...defaultPermissions,
      ...(adminRecord.permissions as Record<string, boolean>),
    };
  } else if (Array.isArray(adminRecord?.permissions)) {
    permissions = {
      ...defaultPermissions,
      ...Object.fromEntries((adminRecord.permissions as string[]).map((p) => [p, true])),
    };
  }

  return {
    id: user.id,
    email: profile?.email || user.email || null,
    phone: profile?.phone || user.phone || null,
    role: 'admin',
    fullName: profile?.full_name || user.user_metadata?.full_name || null,
    adminId: adminRecord?.id || null,
    designation,
    permissions,
  };
}

export type PermissionAction =
  | 'manage_admins'
  | 'modify_settings'
  | 'export_data'
  | 'manage_bookings'
  | 'manage_cooks'
  | 'manage_customers'
  | 'view_audit_logs'
  | 'view_data';

/**
 * Enforces server-side permission checks according to the Admin Role System:
 * - Super Admin: Full access to all actions
 * - Admin: Operations, management, analytics. Cannot manage admins
 * - Support: View bookings/cooks/customers only. Cannot change settings, export, or manage admins
 */
export function checkAdminPermission(
  adminUser: AuthenticatedAdminUser,
  requiredPermission: PermissionAction
) {
  // Super Admin has unrestricted authorization
  if (adminUser.designation === 'super_admin') {
    return true;
  }

  // Admin Role System Rules
  if (requiredPermission === 'manage_admins') {
    throw new ForbiddenError('Access denied: Only Super Admins can manage administrative users.');
  }

  if (adminUser.designation === 'support') {
    if (
      requiredPermission === 'modify_settings' ||
      requiredPermission === 'export_data' ||
      requiredPermission === 'manage_bookings' ||
      requiredPermission === 'manage_cooks' ||
      requiredPermission === 'manage_customers' ||
      requiredPermission === 'view_audit_logs'
    ) {
      throw new ForbiddenError(
        `Access denied: Support staff role cannot perform '${requiredPermission}'.`
      );
    }
  }

  return true;
}
