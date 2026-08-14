import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { customerService } from '@/services/customer.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();

    const addresses = await customerService.getSavedAddresses(supabase, user.id);
    return successResponse({ addresses });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const address = await customerService.addAddress(supabase, user.id, body);

    return successResponse({ address }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

