import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { exportService, ExportType, ExportFormat } from '@/services/export.service';
import { errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';
import { BookingStatus } from '@/types/database';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'export_data');

    const supabase = createAdminClient();

    const { searchParams } = new URL(req.url);
    const type = (searchParams.get('type') || 'bookings') as ExportType;
    const format = (searchParams.get('format') || 'xlsx') as ExportFormat;

    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const status = (searchParams.get('status') || undefined) as BookingStatus | undefined;
    const cityId = searchParams.get('cityId') || undefined;
    const customerId = searchParams.get('customerId') || undefined;
    const cookId = searchParams.get('cookId') || undefined;
    const serviceId = searchParams.get('serviceId') || undefined;

    const validTypes: ExportType[] = ['bookings', 'customers', 'cooks', 'payments', 'reviews', 'services', 'cities'];
    if (!validTypes.includes(type)) {
      throw new BadRequestError(`Invalid export type. Must be one of: ${validTypes.join(', ')}`);
    }

    const validFormats: ExportFormat[] = ['xlsx', 'csv'];
    if (!validFormats.includes(format)) {
      throw new BadRequestError(`Invalid export format. Must be one of: ${validFormats.join(', ')}`);
    }

    console.info(`[Admin Export API] Exporting ${type} as ${format} by admin: ${adminUser.id}`);
    const result = await exportService.exportData(supabase, adminUser.id, type, format, {
      startDate,
      endDate,
      status,
      cityId,
      customerId,
      cookId,
      serviceId,
    });

    return new NextResponse(new Uint8Array(result.content), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (err: any) {
    console.error('[Admin Export API] Error performing export:', {
      message: err?.message || String(err),
      stack: err?.stack,
    });
    return errorResponse(err);
  }
}

