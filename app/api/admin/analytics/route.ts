import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = await createClient();

    const metrics = await adminService.getDashboardMetrics(supabase, adminUser.id);

    // Supplementary analytics calculations
    const [bookingsRes, paymentsRes] = await Promise.all([
      supabase.from('bookings').select('*, service:services(name), address:addresses(city:cities(name))'),
      supabase.from('payments').select('*'),
    ]);

    const bookings = bookingsRes.data || [];
    const payments = paymentsRes.data || [];

    const totalGrossRevenue = bookings
      .filter((b) => ['completed', 'paid'].includes(b.status))
      .reduce((sum, b) => sum + (b.total_amount || 0), 0);

    const totalPlatformFees = bookings
      .filter((b) => ['completed', 'paid'].includes(b.status))
      .reduce((sum, b) => sum + (b.platform_fee || 0), 0);

    const totalTaxes = bookings
      .filter((b) => ['completed', 'paid'].includes(b.status))
      .reduce((sum, b) => sum + (b.tax_amount || 0), 0);

    const totalDiscounts = bookings.reduce((sum, b) => sum + (b.discount_amount || 0), 0);

    const paymentMethods: Record<string, number> = {};
    payments.forEach((p) => {
      const method = (p as { payment_method?: string; method?: string }).method || (p as { payment_method?: string }).payment_method || 'UPI';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    return successResponse({
      analytics: {
        ...metrics,
        financials: {
          grossRevenue: totalGrossRevenue,
          platformFees: totalPlatformFees,
          taxesCollected: totalTaxes,
          discountsGiven: totalDiscounts,
          netCommissionRate: '15%',
        },
        paymentMethods,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
