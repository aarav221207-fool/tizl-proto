import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseAdminConfigured } from '@/lib/supabase/config';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminService } from '@/services/admin.service';
import { analyticsService } from '@/services/analytics.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    if (!isSupabaseAdminConfigured) {
      return errorResponse(
        new Error('Server configuration notice: SUPABASE_SERVICE_ROLE_KEY is required for live admin analytics.')
      );
    }

    const supabase = createAdminClient();
    console.info(`[Admin Analytics API] Fetching analytics for admin: ${adminUser.id}`);

    const range = req.nextUrl.searchParams.get('range') || '7d';
    const startDateParam = req.nextUrl.searchParams.get('startDate');
    const endDateParam = req.nextUrl.searchParams.get('endDate');

    let daysCount = 7;
    let startDateIso: string | undefined = undefined;
    let endDateIso: string | undefined = undefined;

    if (range === '30d') {
      daysCount = 30;
      startDateIso = new Date(Date.now() - 30 * 86400000).toISOString();
    } else if (range === '90d') {
      daysCount = 90;
      startDateIso = new Date(Date.now() - 90 * 86400000).toISOString();
    } else if (range === 'custom' && startDateParam) {
      startDateIso = new Date(startDateParam).toISOString();
      if (endDateParam) {
        const endD = new Date(endDateParam);
        endD.setHours(23, 59, 59, 999);
        endDateIso = endD.toISOString();
      }
    } else if (range === 'all') {
      daysCount = 3650;
    } else {
      // 7d default
      daysCount = 7;
      startDateIso = new Date(Date.now() - 7 * 86400000).toISOString();
    }

    const rangeOptions = {
      days: daysCount,
      startDate: startDateIso,
      endDate: endDateIso,
    };

    const [metrics, visitorAnalytics, eventTimeline, paymentsRes, bookingsRes] = await Promise.all([
      adminService.getDashboardMetrics(supabase, adminUser.id, rangeOptions),
      analyticsService.getVisitorMetrics(supabase, rangeOptions),
      analyticsService.getEventTimeline(supabase, 50, rangeOptions),
      supabase.from('payments').select('*'),
      supabase.from('bookings').select('*'),
    ]);

    if (bookingsRes.error) {
      console.error('[Admin Analytics API] Error loading bookings:', bookingsRes.error);
    }
    if (paymentsRes.error) {
      console.error('[Admin Analytics API] Error loading payments:', paymentsRes.error);
    }

    const allBookings = bookingsRes.data || [];
    const payments = paymentsRes.data || [];

    const startFilter = startDateIso ? startDateIso.split('T')[0] : null;
    const endFilter = endDateIso ? endDateIso.split('T')[0] : null;

    const filteredBookings = allBookings.filter((b: any) => {
      const bDate = b.booking_date || b.created_at?.split('T')[0];
      if (!bDate) return true;
      if (startFilter && bDate < startFilter) return false;
      if (endFilter && bDate > endFilter) return false;
      return true;
    });

    const totalGrossRevenue = filteredBookings
      .filter((b: any) => ['completed', 'paid'].includes(b.status))
      .reduce((sum: number, b: any) => sum + (b.total_amount || 0), 0);

    const totalPlatformFees = filteredBookings
      .filter((b: any) => ['completed', 'paid'].includes(b.status))
      .reduce((sum: number, b: any) => sum + (b.platform_fee || 0), 0);

    const totalTaxes = filteredBookings
      .filter((b: any) => ['completed', 'paid'].includes(b.status))
      .reduce((sum: number, b: any) => sum + (b.tax_amount || 0), 0);

    const totalDiscounts = filteredBookings.reduce((sum: number, b: any) => sum + (b.discount_amount || 0), 0);

    const paymentMethods: Record<string, number> = {};
    payments.forEach((p) => {
      const method =
        (p as { payment_method?: string; method?: string }).method ||
        (p as { payment_method?: string }).payment_method ||
        'UPI';
      paymentMethods[method] = (paymentMethods[method] || 0) + 1;
    });

    return successResponse({
      analytics: {
        ...metrics,
        visitorAnalytics,
        eventTimeline,
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

