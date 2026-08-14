import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { paymentService } from '@/services/payment.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_bookings');

    const supabase = await createClient();
    const body = await req.json();

    if (!body.bookingId) {
      throw new BadRequestError('Missing bookingId parameter');
    }

    const result = await paymentService.processRefund(
      supabase,
      body.bookingId,
      body.amount,
      body.reason || 'Admin Initiated Refund',
      adminUser.id
    );

    return successResponse({ refund: result });
  } catch (err) {
    return errorResponse(err);
  }
}
