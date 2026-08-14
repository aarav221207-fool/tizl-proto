import { createClient } from '@/lib/supabase/server';
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
 */
export async function authenticateAdminRequest(): Promise<AuthenticatedAdminUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }

  // Fetch user profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, phone, role, full_name')
    .eq('id', user.id)
    .single();

  const isProfileAdmin =
    profile?.role === 'admin' || user.user_metadata?.role === 'admin';

  // Fetch admin_users record if it exists
  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('*')
    .eq('profile_id', user.id)
    .single();

  if (!isProfileAdmin && !adminRecord) {
    throw new ForbiddenError('Access denied: Administrator privileges required.');
  }

  const designation: AdminDesignation =
    (adminRecord?.designation as AdminDesignation) || 'admin';
  const permissions = (adminRecord?.permissions as Record<string, boolean>) || {};

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
