import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const host = request.headers.get('x-forwarded-host') || request.headers.get('host');
  const proto = request.headers.get('x-forwarded-proto') || 'https';
  const effectiveOrigin = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : origin);

  const code = searchParams.get('code');
  const errorParam = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';
  const requestedRole = searchParams.get('role');

  // Handle explicit OAuth errors from provider
  if (errorParam) {
    console.error('OAuth callback error:', errorParam, errorDescription);
    const dest = requestedRole === 'cook' ? '/partner/login' : '/customer/login';
    return NextResponse.redirect(
      `${effectiveOrigin}${dest}?error=${encodeURIComponent(errorDescription || errorParam || 'OAuth provider authentication failed.')}`
    );
  }

  if (code) {
    const supabase = await createClient();
    const { error: exchangeError, data } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.user) {
      console.error('Error exchanging OAuth code for session:', exchangeError);
      const dest = requestedRole === 'cook' ? '/partner/login' : '/customer/login';
      return NextResponse.redirect(
        `${effectiveOrigin}${dest}?error=${encodeURIComponent(exchangeError?.message || 'Could not authenticate with Google. Please check your Supabase OAuth configuration.')}`
      );
    }

    const user = data.user;

    // Sanitize requested role: Strictly 'customer' or 'cook'. Admin is NEVER allowed from client params.
    const sanitizedRequestedRole = requestedRole === 'cook' ? 'cook' : 'customer';

    let userRole = sanitizedRequestedRole;
    let isExistingProfile = false;

    // 1. Check if user already has a profile in public.profiles
    try {
      let existingProfile: { role: string; status: string } | null = null;

      try {
        const adminClient = createAdminClient();
        const { data: prof } = await adminClient
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .single();
        existingProfile = prof;
      } catch {
        const { data: prof } = await supabase
          .from('profiles')
          .select('role, status')
          .eq('id', user.id)
          .single();
        existingProfile = prof;
      }

      if (existingProfile) {
        isExistingProfile = true;
        // CRITICAL: Always preserve existing role from database; do NOT overwrite with query param
        userRole = existingProfile.role;
      } else {
        // First-time OAuth user: Create their initial profile
        const newProfile = {
          id: user.id,
          email: user.email?.toLowerCase().trim() || null,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || 'User',
          avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
          role: sanitizedRequestedRole,
          status: sanitizedRequestedRole === 'cook' ? 'pending' : 'active',
          updated_at: new Date().toISOString(),
        };

        try {
          const adminClient = createAdminClient();
          await adminClient.from('profiles').insert(newProfile);
        } catch {
          await supabase.from('profiles').insert(newProfile);
        }
      }
    } catch (profErr) {
      console.error('Error synchronizing OAuth profile:', profErr);
    }

    // 2. Redirect based on verified role
    if (userRole === 'admin') {
      return NextResponse.redirect(`${effectiveOrigin}/admin`);
    }

    if (userRole === 'cook') {
      if (!isExistingProfile) {
        return NextResponse.redirect(`${effectiveOrigin}/partner/verification`);
      }
      return NextResponse.redirect(`${effectiveOrigin}/partner/dashboard`);
    }

    // Customer
    const safeRedirect = next.startsWith('/') ? next : '/';
    return NextResponse.redirect(`${effectiveOrigin}${safeRedirect}`);
  }

  // Fallback if no code received
  return NextResponse.redirect(`${effectiveOrigin}/customer/login?error=${encodeURIComponent('No authorization code received.')}`);
}
