import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { customerService } from '@/services/customer.service';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET() {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();

    const data = await customerService.getProfile(supabase, user.id);

    return successResponse(data);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await authenticateRequest();
    const supabase = await createClient();
    const body = await req.json();

    const { full_name, phone, dietary_preferences, allergies, house_type, kitchen_type } = body;

    const updatedProfile = await customerService.updateProfile(supabase, user.id, {
      ...(full_name && { full_name }),
      ...(phone && { phone }),
    });

    const updatedDetails = await customerService.updatePreferences(supabase, user.id, {
      ...(dietary_preferences && { dietary_preferences }),
      ...(allergies && { allergies }),
      ...(house_type && { house_type }),
      ...(kitchen_type && { kitchen_type }),
    });

    return successResponse({ profile: updatedProfile, details: updatedDetails });
  } catch (err) {
    return errorResponse(err);
  }
}

