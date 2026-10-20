import { createBrowserClient } from '@supabase/ssr';
import { isSupabaseConfigured } from './config';

export { isSupabaseConfigured };

/**
 * Browser-side Supabase Client
 * Safe for client components: only uses public URL and anon key.
 * NEVER import SUPABASE_SERVICE_ROLE_KEY here.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

