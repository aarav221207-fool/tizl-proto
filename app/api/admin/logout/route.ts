import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    try {
      const supabase = await createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[Admin Logout] Supabase signOut notice:', err instanceof Error ? err.message : String(err));
    }

    const response = NextResponse.json(
      {
        success: true,
        data: { message: 'Logged out successfully' },
        message: 'Logged out successfully',
      },
      { status: 200 }
    );

    // Clear all admin tokens and supabase auth cookies
    const allCookies = cookieStore.getAll();
    for (const c of allCookies) {
      if (
        c.name.startsWith('sb-') ||
        c.name.includes('auth-token') ||
        c.name.startsWith('admin_') ||
        c.name === 'tizl_admin_session'
      ) {
        try {
          cookieStore.set(c.name, '', { path: '/', maxAge: 0 });
        } catch {}
        response.cookies.set(c.name, '', { path: '/', maxAge: 0 });
      }
    }
    response.cookies.set('admin_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('admin_session', '', { path: '/', maxAge: 0 });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Logout failed',
        message: err?.message || 'Logout failed',
      },
      { status: 500 }
    );
  }
}
