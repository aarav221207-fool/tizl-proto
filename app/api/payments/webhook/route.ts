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

    const result = await paymentService.handlePaytmWebhook(supabase, payload);

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('[Paytm Webhook] Processing error:', err);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'WEBHOOK_ERROR',
          message: err instanceof Error ? err.message : 'Error processing webhook',
        },
      },
      { status: 400 }
    );
  }
}
