import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Explicitly bypass public login/auth endpoints so middleware never interferes with login
  if (
    pathname === '/api/admin/login' ||
    pathname.startsWith('/api/admin/login') ||
    pathname === '/api/auth/login' ||
    pathname.startsWith('/api/auth/login')
  ) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const hasAuthCookie = request.cookies
      .getAll()
      .some(
        (c) =>
          c.name.startsWith('sb-') ||
          c.name.includes('auth-token') ||
          c.name.startsWith('admin_') ||
          c.name === 'tizl_admin_session'
      );

    if (hasAuthCookie) {
      // Refresh auth token safely with timeout so requests never hang
      await Promise.race([
        supabase.auth.getUser(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Auth refresh timeout')), 2500)),
      ]).catch((err) => {
        console.warn('[Middleware] Note during session refresh:', err instanceof Error ? err.message : String(err));
      });
    }
  } catch (error) {
    console.warn('[Middleware] Note during session refresh:', error);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static image formats (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
