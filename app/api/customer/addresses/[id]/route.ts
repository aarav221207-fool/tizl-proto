import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { customerService } from '@/services/customer.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const address = await customerService.updateAddress(supabase, id, user.id, body);
    return successResponse({ address });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await authenticateRequest();
    const supabase = await createClient();

    await customerService.deleteAddress(supabase, id, user.id);
    return successResponse({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}

