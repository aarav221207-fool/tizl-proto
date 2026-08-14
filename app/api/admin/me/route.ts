import { authenticateAdminRequest } from '@/middleware/admin-auth';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const adminUser = await authenticateAdminRequest();
    return successResponse({ user: adminUser });
  } catch (err) {
    return errorResponse(err);
  }
}
