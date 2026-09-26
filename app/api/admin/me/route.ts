import { NextRequest, NextResponse } from 'next/server';
import { authenticateAdminRequest } from '@/middleware/admin-auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    return NextResponse.json(
      {
        success: true,
        data: { user: adminUser },
        meta: { timestamp: new Date().toISOString() },
      },
      { status: 200 }
    );
  } catch (err: any) {
    const isForbidden =
      err?.code === 'FORBIDDEN' ||
      err?.statusCode === 403 ||
      String(err?.message || '').toLowerCase().includes('administrator access');

    const isUnauthorized =
      !isForbidden &&
      (err?.code === 'UNAUTHORIZED' ||
        err?.statusCode === 401 ||
        String(err?.message || '').toLowerCase().includes('authentication required') ||
        String(err?.message || '').toLowerCase().includes('log in'));

    const statusCode = isForbidden ? 403 : isUnauthorized ? 401 : (err?.statusCode >= 400 && err?.statusCode < 600 ? err.statusCode : 500);
    const message = isForbidden
      ? 'This account does not have administrator access.'
      : isUnauthorized
      ? 'Authentication required. Please log in.'
      : (err?.message || 'An unexpected internal error occurred.');

    return NextResponse.json(
      {
        success: false,
        error: message,
        message,
        code: isForbidden ? 'FORBIDDEN' : isUnauthorized ? 'UNAUTHORIZED' : (err?.code || 'INTERNAL_SERVER_ERROR'),
      },
      { status: statusCode }
    );
  }
}
