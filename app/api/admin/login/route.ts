import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured, isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { adminRepository } from '@/repositories/admin.repository';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('[Admin Login] login request received');

    // 1. Explicitly validate environment configuration
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (
      !supabaseUrl ||
      !supabaseAnonKey ||
      supabaseUrl.includes('placeholder') ||
      supabaseAnonKey.includes('placeholder') ||
      !isSupabaseConfigured
    ) {
      console.error('[Admin Login] Supabase configuration missing or invalid placeholder detected');
      console.log('[Admin Login] response status: 500');
      return NextResponse.json(
        {
          success: false,
          error: 'Unable to sign in. Please try again.',
          message: 'Unable to sign in. Please try again.',
        },
        { status: 500 }
      );
    }

    // 2. Safe request body parsing
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      console.log('[Admin Login] response status: 400');
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required.',
          message: 'Email and password are required.',
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== 'object') {
      console.log('[Admin Login] response status: 400');
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required.',
          message: 'Email and password are required.',
        },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // 3. Validate email and password before calling Supabase
    if (
      !email ||
      !password ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.trim() ||
      !password.trim()
    ) {
      console.log('[Admin Login] response status: 400');
      return NextResponse.json(
        {
          success: false,
          error: 'Email and password are required.',
          message: 'Email and password are required.',
        },
        { status: 400 }
      );
    }

    const cleanEmail = email.toLowerCase().trim();

    // 4. Authenticate credentials with real Supabase Auth signInWithPassword
    const cookieStore = await cookies();
    const cookiesToSetOnResponse: Array<{ name: string; value: string; options: any }> = [];
    const isProduction = process.env.NODE_ENV === 'production';

    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              const opts = {
                path: '/',
                sameSite: 'lax' as const,
                ...options,
                secure: options?.secure !== undefined ? options.secure : isProduction,
              };
              try {
                cookieStore.set(name, value, opts);
              } catch {}
              cookiesToSetOnResponse.push({ name, value, options: opts });
            });
          },
        },
      }
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (authError || !authData.user) {
      console.log('[Admin Login] Supabase authentication failed');

      // Record failed login audit log using admin client if available
      if (isSupabaseAdminConfigured) {
        try {
          const adminSupabase = createAdminClient();
          await adminRepository.recordAuditLog(
            adminSupabase,
            null,
            'ADMIN_LOGIN_FAILED',
            null,
            null,
            { email: cleanEmail, reason: authError?.message || 'Invalid credentials' }
          );
        } catch {}
      }

      console.log('[Admin Login] response status: 401');
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid email or password.',
          message: 'Invalid email or password.',
        },
        { status: 401 }
      );
    }

    console.log('[Admin Login] Supabase authentication succeeded');
    const user = authData.user;

    // 5. Verify admin privileges using existing admin authorization logic
    let profile = null;
    let adminRecord = null;

    if (isSupabaseAdminConfigured) {
      try {
        const adminSupabase = createAdminClient();
        const [pRes, aRes] = await Promise.all([
          adminSupabase.from('profiles').select('id, role, full_name, email').eq('id', user.id).maybeSingle(),
          adminSupabase.from('admin_users').select('*').eq('profile_id', user.id).maybeSingle(),
        ]);
        profile = pRes.data;
        adminRecord = aRes.data;
      } catch (err) {
        console.warn('[Admin Login] Admin client privilege lookup warning:', err);
      }
    }

    if (!profile && !adminRecord) {
      try {
        const [pRes, aRes] = await Promise.all([
          supabase.from('profiles').select('id, role, full_name, email').eq('id', user.id).maybeSingle(),
          supabase.from('admin_users').select('*').eq('profile_id', user.id).maybeSingle(),
        ]);
        profile = pRes.data;
        adminRecord = aRes.data;
      } catch (err) {
        console.warn('[Admin Login] User client privilege lookup warning:', err);
      }
    }

    const isAdmin = profile?.role === 'admin' || user.user_metadata?.role === 'admin' || !!adminRecord;

    if (!isAdmin) {
      console.log('[Admin Login] admin authorization failed');
      // Terminate the authenticated session for non-admin accounts
      try {
        await supabase.auth.signOut();
      } catch {}

      if (isSupabaseAdminConfigured) {
        try {
          const adminSupabase = createAdminClient();
          await adminRepository.recordAuditLog(
            adminSupabase,
            user.id,
            'ADMIN_LOGIN_DENIED_NON_ADMIN',
            user.id,
            null,
            { email: cleanEmail }
          );
        } catch {}
      }

      console.log('[Admin Login] response status: 403');
      return NextResponse.json(
        {
          success: false,
          error: 'This account does not have administrator access.',
          message: 'This account does not have administrator access.',
        },
        { status: 403 }
      );
    }

    console.log('[Admin Login] admin authorization succeeded');

    if (isSupabaseAdminConfigured) {
      try {
        const adminSupabase = createAdminClient();
        await adminRepository.recordAuditLog(
          adminSupabase,
          user.id,
          'ADMIN_LOGIN_SUCCESS',
          user.id,
          null,
          { email: cleanEmail, designation: adminRecord?.designation || 'admin' }
        );
      } catch {}
    }

    const designation = adminRecord?.designation || (profile?.role === 'admin' ? 'super_admin' : 'admin');
    const defaultPermissions = {
      can_manage_admins: designation === 'super_admin',
      modify_settings: true,
      export_data: true,
      manage_bookings: true,
      manage_cooks: true,
      manage_customers: true,
      view_audit_logs: true,
    };

    let permissions = defaultPermissions;
    if (adminRecord?.permissions && typeof adminRecord.permissions === 'object' && !Array.isArray(adminRecord.permissions)) {
      permissions = adminRecord.permissions;
    } else if (Array.isArray(adminRecord?.permissions)) {
      permissions = {
        ...defaultPermissions,
        ...Object.fromEntries((adminRecord.permissions as string[]).map((p) => [p, true])),
      };
    }

    // Prepare response data without leaking access_token or refresh_token
    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: {
            id: user.id,
            email: profile?.email || user.email,
            fullName: profile?.full_name || 'Admin User',
            role: 'admin',
            designation,
            permissions,
          },
        },
      },
      { status: 200 }
    );

    // Apply Supabase SSR session cookies to the response
    for (const { name, value, options } of cookiesToSetOnResponse) {
      response.cookies.set(name, value, options);
    }

    // Set dedicated admin cookies for compatibility with existing admin authorization checks
    const accessToken = authData.session?.access_token || '';
    if (accessToken) {
      const cookieOptions = {
        path: '/',
        httpOnly: true,
        sameSite: 'lax' as const,
        secure: isProduction,
        maxAge: 7 * 24 * 60 * 60,
      };
      try {
        cookieStore.set('admin_token', accessToken, cookieOptions);
        cookieStore.set('admin_session', accessToken, cookieOptions);
      } catch {}
      response.cookies.set('admin_token', accessToken, cookieOptions);
      response.cookies.set('admin_session', accessToken, cookieOptions);
    }

    console.log('[Admin Login] response status: 200');
    return response;
  } catch (err: unknown) {
    console.error('[Admin Login] Unexpected error:', err instanceof Error ? err.message : 'Server error');
    console.log('[Admin Login] response status: 500');
    return NextResponse.json(
      {
        success: false,
        error: 'Unable to sign in. Please try again.',
        message: 'Unable to sign in. Please try again.',
      },
      { status: 500 }
    );
  }
}
