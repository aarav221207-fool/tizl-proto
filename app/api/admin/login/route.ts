import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, ForbiddenError, UnauthorizedError } from '@/lib/errors';
import { checkRateLimit, resetRateLimit } from '@/lib/rate-limit';
import { adminRepository } from '@/repositories/admin.repository';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    // Rate Limiting Protection (5 attempts per 15 minutes per email)
    const rateLimitKey = `admin_login_${email.toLowerCase().trim()}`;
    const rateCheck = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!rateCheck.allowed) {
      throw new BadRequestError(
        `Too many failed login attempts. Account temporarily locked for security. Try again in ${rateCheck.resetInSeconds} seconds.`
      );
    }

    const supabase = await createClient();

    // Authenticate credentials with Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.warn('[Admin Login API] Failed login attempt for email:', email);
      // Record failed login audit log using admin client if available
      try {
        const adminSupabase = createAdminClient();
        await adminRepository.recordAuditLog(
          adminSupabase,
          null,
          'ADMIN_LOGIN_FAILED',
          null,
          null,
          { email, reason: authError?.message || 'Invalid credentials' }
        );
      } catch {}

      throw new UnauthorizedError('Invalid admin email or password');
    }

    const user = authData.user;

    // Verify admin privileges using admin client to bypass any RLS hurdles
    let profile = null;
    let adminRecord = null;
    try {
      const adminSupabase = createAdminClient();
      const [pRes, aRes] = await Promise.all([
        adminSupabase.from('profiles').select('id, role, full_name, email').eq('id', user.id).maybeSingle(),
        adminSupabase.from('admin_users').select('*').eq('profile_id', user.id).maybeSingle(),
      ]);
      profile = pRes.data;
      adminRecord = aRes.data;
    } catch {
      const [pRes, aRes] = await Promise.all([
        supabase.from('profiles').select('id, role, full_name, email').eq('id', user.id).maybeSingle(),
        supabase.from('admin_users').select('*').eq('profile_id', user.id).maybeSingle(),
      ]);
      profile = pRes.data;
      adminRecord = aRes.data;
    }

    const isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin' || !!adminRecord;

    if (!isAdmin) {
      console.warn(`[Admin Login API] Access denied: non-admin user ${user.id} attempted login`);
      // Log out non-admin session immediately
      await supabase.auth.signOut();
      try {
        const adminSupabase = createAdminClient();
        await adminRepository.recordAuditLog(
          adminSupabase,
          user.id,
          'ADMIN_LOGIN_DENIED_NON_ADMIN',
          user.id,
          null,
          { email }
        );
      } catch {}

      throw new ForbiddenError('Access denied: Account does not possess administrator privileges.');
    }

    // Login successful - Reset rate limit
    resetRateLimit(rateLimitKey);

    // Record successful admin login
    try {
      const adminSupabase = createAdminClient();
      await adminRepository.recordAuditLog(
        adminSupabase,
        user.id,
        'ADMIN_LOGIN_SUCCESS',
        user.id,
        null,
        { email, designation: adminRecord?.designation || 'admin' }
      );
    } catch {}

    const designation = adminRecord?.designation || (profile?.role === 'admin' ? 'super_admin' : 'admin');
    const permissions = adminRecord?.permissions || {
      can_manage_admins: designation === 'super_admin',
      modify_settings: true,
      export_data: true,
      manage_bookings: true,
      manage_cooks: true,
      manage_customers: true,
      view_audit_logs: true,
    };

    return successResponse({
      user: {
        id: user.id,
        email: profile?.email || user.email,
        fullName: profile?.full_name || 'Admin User',
        role: 'admin',
        designation,
        permissions,
      },
      message: 'Admin authentication successful',
    });
  } catch (err: any) {
    console.error('[Admin Login API] Error:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

