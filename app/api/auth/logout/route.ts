import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return successResponse({ message: 'Logged out successfully' });
  } catch (err) {
    return errorResponse(err);
  }
}
