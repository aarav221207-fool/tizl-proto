import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { paymentService } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, TooManyRequestsError } from '@/lib/errors';
import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_bookings');

    // Admin rate limiting: max 10 refund actions per 10 minutes
    const rateLimitKey = `rate:admin_refund:${adminUser.id}`;
    const rateCheck = await checkRateLimit(rateLimitKey, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      throw new TooManyRequestsError(
        `Refund action limit reached. Please wait ${rateCheck.resetInSeconds} seconds before initiating another refund.`
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.bookingId || !body.amount) {
      throw new BadRequestError('Missing bookingId or amount in refund request');
    }

    const refundAmount = parseFloat(body.amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      throw new BadRequestError('Refund amount must be a valid positive number');
    }

    const supabase = await createClient();
    const refundResult = await paymentService.processRefund(
      supabase,
      body.bookingId,
      refundAmount,
      body.reason || 'Admin initiated refund',
      adminUser.id
    );

    return successResponse({ refund: refundResult });
  } catch (err) {
    return errorResponse(err);
  }
}
