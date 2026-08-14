import { createBrowserClient } from '@supabase/ssr';

/**
 * Browser-side Supabase Client
 * Safe for client components: only uses public URL and anon key.
 * NEVER import SUPABASE_SERVICE_ROLE_KEY here.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
