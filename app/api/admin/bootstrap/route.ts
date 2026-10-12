import { NextRequest } from 'next/server';
import { createAdminClient, isSupabaseAdminConfigured } from '@/lib/supabase/admin';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ForbiddenError } from '@/lib/errors';

/**
 * Public administrative self-promotion is disabled for security.
 * Initial administrator provisioning must be performed via trusted database seeding:
 * INSERT INTO public.admin_users (profile_id, designation, permissions) VALUES (...);
 * or via an existing authenticated Super Admin using the administrative management portal.
 */
export async function POST(req: NextRequest) {
  try {
    // Only an existing authenticated Super Admin may provision additional administrative seats
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_admins');

    throw new ForbiddenError(
      'Self-service bootstrap is disabled. Administrative users must be provisioned by a Super Admin or via database administration.'
    );
  } catch (err: any) {
    return errorResponse(err);
  }
}

export async function GET() {
  return successResponse({
    bootstrapAvailable: false,
    message: 'Self-service bootstrap is disabled for security. Administrative accounts are strictly provisioned by existing Super Admins or direct database administration.',
  });
}
