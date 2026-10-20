import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { paymentService } from '@/services/payment.service';

export async function POST(req: NextRequest) {
  try {
    const supabase = createAdminClient();
    const contentType = req.headers.get('content-type') || '';
    let payload: Record<string, unknown> = {};

    if (
      contentType.includes('application/x-www-form-urlencoded') ||
      contentType.includes('multipart/form-data')
    ) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      payload = await req.json().catch(() => ({}));
    }

    // Process through central handlePaytmWebhook (validates checksum, amount, order existence, and updates status)
    const { processed, orderId } = await paymentService.handlePaytmWebhook(supabase, payload);

    // If browser redirected POST from Paytm gateway, redirect customer to dashboard for verification
    const isBrowserRequest = req.headers.get('accept')?.includes('text/html');
    if (isBrowserRequest) {
      // Notice: Redirect does NOT convey trusted status to dashboard.
      // Dashboard MUST poll /api/payments/status/[orderId] for authoritative DB status.
      const redirectUrl = new URL(
        `/customer/dashboard?orderId=${encodeURIComponent(orderId || '')}&checkPayment=1`,
        req.url
      );
      return NextResponse.redirect(redirectUrl, 303);
    }

    return NextResponse.json({
      success: true,
      data: { processed, orderId },
    });
  } catch (err) {
    console.error('[Paytm Callback] Processing error:', (err as Error)?.message);
    const isBrowserRequest = req.headers.get('accept')?.includes('text/html');
    if (isBrowserRequest) {
      const redirectUrl = new URL('/customer/dashboard?paymentError=1', req.url);
      return NextResponse.redirect(redirectUrl, 303);
    }
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'PAYTM_CALLBACK_ERROR',
          message: err instanceof Error ? err.message : 'Error processing callback',
        },
      },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const orderId = searchParams.get('ORDERID') || searchParams.get('orderId');

  // Redirection only passes orderId; client dashboard fetches authoritative server verification
  const redirectUrl = new URL(
    `/customer/dashboard?orderId=${encodeURIComponent(orderId || '')}&checkPayment=1`,
    req.url
  );
  return NextResponse.redirect(redirectUrl, 303);
}
