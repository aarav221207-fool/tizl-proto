import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { identityVerificationService } from '@/services/identity-verification.service';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.redirect(new URL('/partner/login', req.nextUrl.origin));
    }

    if (!identityVerificationService.isConfigured()) {
      const errUrl = new URL('/partner/verification', req.nextUrl.origin);
      errUrl.searchParams.set(
        'error',
        'DigiLocker / Aadhaar provider is not configured on the server. Please contact system administrator.'
      );
      return NextResponse.redirect(errUrl);
    }

    const searchParams = req.nextUrl.searchParams;
    const payload = Object.fromEntries(searchParams.entries());
    const signature = req.headers.get('x-digilocker-signature') || searchParams.get('signature') || '';

    if (!signature) {
      const errUrl = new URL('/partner/verification', req.nextUrl.origin);
      errUrl.searchParams.set(
        'error',
        'Missing authoritative cryptographic signature from identity provider.'
      );
      return NextResponse.redirect(errUrl);
    }

    await identityVerificationService.processCallback(supabase, user.id, payload, signature);
    const successUrl = new URL('/partner/verification', req.nextUrl.origin);
    successUrl.searchParams.set('status', 'under_review');
    return NextResponse.redirect(successUrl);
  } catch (err: any) {
    console.error('Identity verification callback error:', err?.message || err);
    const errUrl = new URL('/partner/verification', req.nextUrl.origin);
    errUrl.searchParams.set('error', err?.message || 'Verification callback validation failed.');
    return NextResponse.redirect(errUrl);
  }
}
