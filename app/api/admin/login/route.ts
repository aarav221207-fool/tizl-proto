import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
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
      // Record failed login audit log
      await adminRepository.recordAuditLog(
        supabase,
        null,
        'ADMIN_LOGIN_FAILED',
        null,
        null,
        { email, reason: authError?.message || 'Invalid credentials' }
      );
      throw new UnauthorizedError('Invalid admin email or password');
    }

    const user = authData.user;

    // Verify admin privileges
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, role, full_name, email')
      .eq('id', user.id)
      .single();

    const { data: adminRecord } = await supabase
      .from('admin_users')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    const isAdmin = profile?.role === 'admin' || !!adminRecord;

    if (!isAdmin) {
      // Log out non-admin session immediately
      await supabase.auth.signOut();
      await adminRepository.recordAuditLog(
        supabase,
        user.id,
        'ADMIN_LOGIN_DENIED_NON_ADMIN',
        user.id,
        null,
        { email }
      );
      throw new ForbiddenError('Access denied: Account does not possess administrator privileges.');
    }

    // Login successful - Reset rate limit
    resetRateLimit(rateLimitKey);

    // Record successful admin login
    await adminRepository.recordAuditLog(
      supabase,
      user.id,
      'ADMIN_LOGIN_SUCCESS',
      user.id,
      null,
      { email, designation: adminRecord?.designation || 'admin' }
    );

    const designation = adminRecord?.designation || 'admin';
    const permissions = adminRecord?.permissions || {};

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
  } catch (err) {
    return errorResponse(err);
  }
}
