import { authenticateRequest } from '@/middleware/authentication';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await authenticateRequest();
    return successResponse({ user });
  } catch (err) {
    return errorResponse(err);
  }
}
