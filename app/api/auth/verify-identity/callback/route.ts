import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { identityVerificationService } from '@/services/identity-verification.service';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.redirect(`${req.nextUrl.origin}/partner/login`);
    }

    // In a real implementation, Digilocker sends POST with a payload, or GET with a query string.
    // For this simulation, we'll extract query params.
    const searchParams = req.nextUrl.searchParams;
    const payload = Object.fromEntries(searchParams.entries());
    const signature = 'simulated_signature';

    await identityVerificationService.processCallback(supabase, user.id, payload, signature);

    return NextResponse.redirect(`${req.nextUrl.origin}/partner/verification`);
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${req.nextUrl.origin}/partner/verification?error=callback_failed`);
  }
}
