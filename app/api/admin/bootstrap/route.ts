import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ForbiddenError, BadRequestError, UnauthorizedError } from '@/lib/errors';
import { adminRepository } from '@/repositories/admin.repository';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    // 1. Check if ANY Super Admin already exists
    const { data: existingSuperAdmins, error: checkError } = await supabase
      .from('admin_users')
      .select('id, profile_id')
      .eq('designation', 'super_admin');

    if (checkError) throw checkError;

    if (existingSuperAdmins && existingSuperAdmins.length > 0) {
      throw new ForbiddenError(
        'Bootstrap disabled: A Super Admin already exists. System initialization is complete.'
      );
    }

    // 2. Determine target user to promote
    let userId: string | null = null;

    const { data: { user: sessionUser } } = await supabase.auth.getUser();

    if (sessionUser) {
      userId = sessionUser.id;
    } else {
      // Allow passing credentials in body to authenticate & bootstrap in one call
      try {
        const body = await req.json();
        const { email, password } = body || {};
        if (email && password) {
          const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (authErr || !authData.user) {
            throw new UnauthorizedError('Invalid user credentials provided for bootstrap.');
          }
          userId = authData.user.id;
        }
      } catch {
        // No body or parsing failed
      }
    }

    if (!userId) {
      throw new BadRequestError('Authentication required to bootstrap Super Admin. Please log in first or supply credentials.');
    }

    // 3. Promote profile role to 'admin'
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ role: 'admin', updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (profileError) throw profileError;

    // 4. Create Super Admin record in admin_users
    const fullPermissions = {
      can_manage_admins: true,
      modify_settings: true,
      export_data: true,
      manage_bookings: true,
      manage_cooks: true,
      manage_customers: true,
      view_audit_logs: true,
    };

    const { data: newSuperAdmin, error: adminInsertError } = await supabase
      .from('admin_users')
      .upsert(
        {
          profile_id: userId,
          designation: 'super_admin',
          permissions: fullPermissions,
        },
        { onConflict: 'profile_id' }
      )
      .select()
      .single();

    if (adminInsertError) throw adminInsertError;

    // 5. Record Audit Log
    await adminRepository.recordAuditLog(
      supabase,
      userId,
      'BOOTSTRAP_SUPER_ADMIN_CREATED',
      newSuperAdmin.id,
      null,
      { designation: 'super_admin', profile_id: userId }
    );

    return successResponse({
      message: 'First Super Admin successfully initialized. Bootstrap route is now permanently disabled.',
      superAdmin: newSuperAdmin,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function GET() {
  try {
    const supabase = await createClient();

    // Check bootstrap availability status
    const { data: existingSuperAdmins } = await supabase
      .from('admin_users')
      .select('id')
      .eq('designation', 'super_admin');

    const isAvailable = !existingSuperAdmins || existingSuperAdmins.length === 0;

    return successResponse({
      bootstrapAvailable: isAvailable,
      message: isAvailable
        ? 'System initial state: No Super Admin detected. Bootstrap is enabled.'
        : 'Bootstrap disabled: Super Admin already exists.',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
