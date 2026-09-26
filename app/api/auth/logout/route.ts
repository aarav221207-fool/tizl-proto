import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();
    await supabase.auth.signOut();

    try {
      cookieStore.set('admin_token', '', { path: '/', maxAge: 0 });
      cookieStore.set('admin_session', '', { path: '/', maxAge: 0 });
    } catch {}

    const response = successResponse({ message: 'Logged out successfully' });
    response.cookies.set('admin_token', '', { path: '/', maxAge: 0 });
    response.cookies.set('admin_session', '', { path: '/', maxAge: 0 });

    return response;
  } catch (err) {
    return errorResponse(err);
  }
}
