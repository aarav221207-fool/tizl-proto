import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, isSupabaseAdminConfigured } from './config';

export { isSupabaseConfigured, isSupabaseAdminConfigured };

/**
 * Service Role Supabase Client
 * WARNING: This client bypasses Row Level Security (RLS).
 * MUST ONLY be imported and used in server-side services and API routes.
 * NEVER expose to client components.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!serviceRoleKey || serviceRoleKey.includes('placeholder') || !supabaseUrl || supabaseUrl.includes('placeholder')) {
    throw new Error('Valid SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required for server-side admin operations.');
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

