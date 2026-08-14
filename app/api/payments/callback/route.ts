import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paymentService } from '@/services/payment.service';

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const contentType = req.headers.get('content-type') || '';
    let payload: Record<string, unknown> = {};

    if (contentType.includes('application/x-www-form-urlencoded') || contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      payload = await req.json();
    }

    const { processed, orderId } = await paymentService.handlePaytmWebhook(supabase, payload);

    // If browser redirected POST from Paytm gateway, redirect customer to dashboard
    const isBrowserRequest = req.headers.get('accept')?.includes('text/html');
    if (isBrowserRequest) {
      const status = (payload.STATUS as string || '').toUpperCase();
      const redirectUrl = new URL(
        `/customer/dashboard?payment=${status === 'TXN_SUCCESS' ? 'success' : 'failed'}&orderId=${orderId || ''}`,
        req.url
      );
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json({
      success: true,
      data: { processed, orderId },
    });
  } catch (err) {
    console.error('Paytm callback error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYTM_CALLBACK_ERROR',
          message: err instanceof Error ? err.message : 'Error processing callback',
        },
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Handle any GET redirect from gateway
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('ORDERID') || searchParams.get('orderId');
  const status = searchParams.get('STATUS') || searchParams.get('status');

  const redirectUrl = new URL(
    `/customer/dashboard?payment=${status === 'TXN_SUCCESS' ? 'success' : 'pending'}&orderId=${orderId || ''}`,
    req.url
  );
  return NextResponse.redirect(redirectUrl, 303);
}
