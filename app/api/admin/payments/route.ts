import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { paymentsRepository } from '@/repositories/payments.repository';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = await createClient();
    const payments = await paymentsRepository.listAllPaymentsAdmin(supabase);

    // Compute summary metrics
    const totalVolume = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const captured = payments.filter((p) => p.status === 'captured');
    const capturedAmount = captured.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const pending = payments.filter((p) => p.status === 'pending');
    const failed = payments.filter((p) => p.status === 'failed');
    const refunded = payments.filter((p) => p.status === 'refunded');

    const isPaytmConfigured = Boolean(process.env.PAYTM_MID && process.env.PAYTM_MERCHANT_KEY);

    return successResponse({
      payments,
      summary: {
        totalTransactions: payments.length,
        totalVolume,
        capturedCount: captured.length,
        capturedAmount,
        pendingCount: pending.length,
        failedCount: failed.length,
        refundCount: refunded.length,
      },
      isPaytmConfigured,
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        designation: adminUser.designation,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
