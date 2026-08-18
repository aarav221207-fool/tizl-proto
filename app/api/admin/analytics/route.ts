import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { analyticsService } from '@/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = createAdminClient();
    console.info(`[Admin Analytics API] Fetching analytics for admin: ${adminUser.id}`);

    const [metrics, visitorAnalytics, bookingsRes, paymentsRes] = await Promise.all([
      adminService.getDashboardMetrics(supabase, adminUser.id),
      analyticsService.getVisitorMetrics(supabase, 30),
      supabase.from('bookings').select('*, service:services(name), address:addresses(city:cities(name))'),
      supabase.from('payments').select('*'),
    ]);

    if (bookingsRes.error) {
      console.error('[Admin Analytics API] Error loading bookings:', bookingsRes.error);
    }
    if (paymentsRes.error) {
      console.error('[Admin Analytics API] Error loading payments:', paymentsRes.error);
    }

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
        visitorAnalytics,
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
  } catch (err: any) {
    console.error('[Admin Analytics API] Error loading analytics:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

