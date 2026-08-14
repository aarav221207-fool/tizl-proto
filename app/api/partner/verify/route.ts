import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Please log in as a partner.' },
        { status: 401 }
      );
    }

    const clientId = process.env.DIGILOCKER_CLIENT_ID;
    const clientSecret = process.env.DIGILOCKER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return NextResponse.json(
        {
          success: false,
          configured: false,
          error: 'DigiLocker / Aadhaar identity provider credentials (DIGILOCKER_CLIENT_ID, DIGILOCKER_CLIENT_SECRET) are not configured in server environment variables.',
          status: 'pending_configuration',
        },
        { status: 501 }
      );
    }

    // Server-side integration point for authorized provider
    // In production, this generates state and redirect URL to DigiLocker OAuth sandbox/live
    const redirectUrl = `https://digilocker.gov.in/public/oauth2/1/authorize?response_type=code&client_id=${clientId}&state=${user.id}`;

    return NextResponse.json({
      success: true,
      configured: true,
      redirectUrl,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('status, verification_details')
      .eq('id', user.id)
      .single();

    const isConfigured = !!(process.env.DIGILOCKER_CLIENT_ID && process.env.DIGILOCKER_CLIENT_SECRET);

    return NextResponse.json({
      success: true,
      providerConfigured: isConfigured,
      verificationStatus: profile?.status || 'pending',
      message: isConfigured 
        ? 'Identity verification provider ready' 
        : 'DigiLocker/Aadhaar integration pending environment configuration',
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
