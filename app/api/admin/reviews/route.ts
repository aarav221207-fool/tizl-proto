import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { reviewsRepository } from '@/repositories/reviews.repository';
import { adminRepository } from '@/repositories/admin.repository';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = await createClient();
    const reviews = await reviewsRepository.listAllReviewsAdmin(supabase);

    const totalReviews = reviews.length;
    const avgRating =
      totalReviews > 0
        ? reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / totalReviews
        : 0;

    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const star = Math.min(5, Math.max(1, Math.round(Number(r.rating) || 0))) as 1 | 2 | 3 | 4 | 5;
      if (starCounts[star] !== undefined) {
        starCounts[star] += 1;
      }
    });

    return successResponse({
      reviews,
      summary: {
        totalReviews,
        avgRating: Number(avgRating.toFixed(1)),
        starCounts,
      },
      adminUser: {
        id: adminUser.id,
        email: adminUser.email,
        designation: adminUser.designation,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'modify_settings');

    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      throw new BadRequestError('Review ID is required for deletion');
    }

    await reviewsRepository.deleteReviewAdmin(supabase, id);

    await adminRepository.recordAuditLog(
      supabase,
      adminUser.id,
      'DELETE_REVIEW',
      id,
      null,
      { reviewId: id, deletedAt: new Date().toISOString() }
    );

    return successResponse({ deleted: true, id });
  } catch (err) {
    return errorResponse(err);
  }
}
