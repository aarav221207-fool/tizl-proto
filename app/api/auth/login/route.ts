import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = loginSchema.parse(body);

    const supabase = await createClient();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: validated.email.toLowerCase().trim(),
      password: validated.password,
    });

    if (error) {
      throw new BadRequestError('Invalid email or password.');
    }

    if (!data.user) {
      throw new BadRequestError('Authentication failed. Please try again.');
    }

    // Retrieve verified profile from public.profiles
    let userRole = (data.user.user_metadata?.role as string) || 'customer';
    let fullName = data.user.user_metadata?.full_name || null;
    let status = 'active';

    try {
      // First try standard user query (respecting RLS)
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('role, full_name, status')
        .eq('id', data.user.id)
        .single();

      if (profile && !pErr) {
        userRole = profile.role;
        fullName = profile.full_name;
        status = profile.status;
      } else {
        // Try admin client if profile was not fetched
        try {
          const adminClient = createAdminClient();
          const { data: adminProfile } = await adminClient
            .from('profiles')
            .select('role, full_name, status')
            .eq('id', data.user.id)
            .single();

          if (adminProfile) {
            userRole = adminProfile.role;
            fullName = adminProfile.full_name;
            status = adminProfile.status;
          }
        } catch {
          // Admin client not configured
        }
      }
    } catch (fetchErr) {
      console.error('Error fetching profile on login:', fetchErr);
    }

    return successResponse({
      user: {
        id: data.user.id,
        email: data.user.email,
        role: userRole,
        fullName: fullName,
        status: status,
      },
      message: 'Login successful',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
