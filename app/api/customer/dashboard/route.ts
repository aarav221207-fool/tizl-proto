import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { customerService } from '@/services/customer.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();

    const dashboard = await customerService.getDashboard(supabase, user.id);
    return successResponse(dashboard);
  } catch (err) {
    return errorResponse(err);
  }
}
