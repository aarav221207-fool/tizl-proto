import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional().nullable(),
  role: z.enum(['customer', 'cook']).default('customer'),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validated = signupSchema.parse(body);

    const supabase = await createClient();

    // 1. Create Supabase Auth user
    const { data, error } = await supabase.auth.signUp({
      email: validated.email.toLowerCase().trim(),
      password: validated.password,
      options: {
        data: {
          full_name: validated.fullName.trim(),
          phone: validated.phone?.trim() || null,
          role: validated.role,
        },
      },
    });

    if (error) {
      throw new BadRequestError(error.message);
    }

    if (!data.user) {
      throw new BadRequestError('Failed to create account. Please try again.');
    }

    // 2. Reliably ensure public.profiles record exists
    const profilePayload = {
      id: data.user.id,
      email: validated.email.toLowerCase().trim(),
      phone: validated.phone?.trim() || null,
      full_name: validated.fullName.trim(),
      role: validated.role,
      status: validated.role === 'cook' ? 'pending' : 'active',
      updated_at: new Date().toISOString(),
    };

    try {
      // Attempt with service-role admin client to bypass any initial unconfirmed email RLS restriction
      const adminClient = createAdminClient();
      const { error: profileError } = await adminClient.from('profiles').upsert(profilePayload);
      if (profileError) {
        console.error('Error creating profile with service role:', profileError);
        throw new Error(`Profile synchronization failed: ${profileError.message}`);
      }
    } catch (adminErr: any) {
      // If service role is not configured in local dev, fallback to session client
      if (adminErr?.message?.includes('SUPABASE_SERVICE_ROLE_KEY is required')) {
        const { error: fallbackError } = await supabase.from('profiles').upsert(profilePayload);
        if (fallbackError) {
          console.error('Fallback profile creation failed:', fallbackError);
          // If the DB trigger handles it, this might be a constraint conflict or RLS; log but proceed
        }
      } else {
        throw new BadRequestError(adminErr?.message || 'Profile creation failed');
      }
    }

    const emailConfirmationRequired = !data.session;

    return successResponse(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: validated.role,
          fullName: validated.fullName,
        },
        requiresEmailConfirmation: emailConfirmationRequired,
        message: emailConfirmationRequired
          ? 'Signup successful. Please check your email to confirm your account before signing in.'
          : 'Signup successful. Welcome to Tizl!',
      },
      201
    );
  } catch (err) {
    return errorResponse(err);
  }
}
