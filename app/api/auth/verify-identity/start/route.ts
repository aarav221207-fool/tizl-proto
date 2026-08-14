import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { UnauthorizedError } from '@/lib/errors';
import { identityVerificationService } from '@/services/identity-verification.service';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new UnauthorizedError();
    }

    // Call our identity verification service abstraction
    // In dev mode, this will simulate success
    const result = await identityVerificationService.initializeVerification(
      supabase,
      user.id,
      `${req.nextUrl.origin}/api/auth/verify-identity/callback`
    );

    return successResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
