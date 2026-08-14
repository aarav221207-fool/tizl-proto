import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { UnauthorizedError } from '@/lib/errors';
import { AuthenticatedUser } from '@/types/auth';
import { UserRole } from '@/types/database';

export async function authenticateRequest(): Promise<AuthenticatedUser> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new UnauthorizedError('Authentication required. Please log in.');
  }

  // 1. Fetch profile directly using session client (respects RLS)
  try {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, email, phone, role, full_name')
      .eq('id', user.id)
      .single();

    if (profile && !pErr) {
      return {
        id: profile.id,
        email: profile.email,
        phone: profile.phone,
        role: profile.role as UserRole,
        fullName: profile.full_name,
      };
    }

    // 2. If session client failed due to transient RLS / email confirmation, query with admin client
    try {
      const adminClient = createAdminClient();
      const { data: adminProf } = await adminClient
        .from('profiles')
        .select('id, email, phone, role, full_name')
        .eq('id', user.id)
        .single();

      if (adminProf) {
        return {
          id: adminProf.id,
          email: adminProf.email,
          phone: adminProf.phone,
          role: adminProf.role as UserRole,
          fullName: adminProf.full_name,
        };
      }
    } catch {
      // Service role not configured
    }
  } catch (err) {
    console.error('Error fetching profile in authenticateRequest:', err);
  }

  // 3. Safe fallback from auth metadata
  return {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    role: (user.user_metadata?.role as UserRole) || 'customer',
    fullName: user.user_metadata?.full_name || null,
  };
}
