import { createClient } from '@supabase/supabase-js';

/**
 * Service Role Supabase Client
 * WARNING: This client bypasses Row Level Security (RLS).
 * MUST ONLY be imported and used in server-side services and API routes.
 * NEVER expose to client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!serviceRoleKey || serviceRoleKey === 'placeholder-service-role-key') {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for server-side admin operations.');
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
