import { NextRequest } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { authenticateRequest } from '@/middleware/authentication';
import { cookService } from '@/services/cook.service';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, ForbiddenError } from '@/lib/errors';

const registerCookSchema = z.object({
  display_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  city_id: z.string().optional().default(''),
  hourly_rate: z.number().min(50, 'Minimum hourly rate is ₹50').max(5000, 'Maximum hourly rate is ₹5000').optional().default(150),
  experience_years: z.number().min(0).max(50).optional().default(1),
  speciality_cuisines: z.array(z.string()).optional().default([]),
  bio: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await authenticateRequest();

    // Prevent administrators or unverified accounts from creating inconsistent roles
    if (user.role === 'admin') {
      throw new ForbiddenError('Administrative accounts cannot register as partner cooks.');
    }

    const supabase = await createClient();
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      throw new BadRequestError('Request body must be valid JSON');
    }

    const parsed = registerCookSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0]?.message || 'Invalid registration details');
    }

    // Server enforces that is_approved is false and verification_status is pending
    const registered = await cookService.registerCook(supabase, user.id, parsed.data);
    return successResponse({ cook: registered }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
