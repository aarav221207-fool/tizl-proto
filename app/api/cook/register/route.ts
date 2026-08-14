import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { cookService } from '@/services/cook.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const registered = await cookService.registerCook(supabase, user.id, body);
    return successResponse({ cook: registered }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
