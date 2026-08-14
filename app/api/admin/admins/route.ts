import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission, AdminDesignation } from '@/middleware/admin-auth';
import { adminRepository } from '@/repositories/admin.repository';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, NotFoundError } from '@/lib/errors';

export async function GET() {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_admins');

    const supabase = await createClient();
    const admins = await adminRepository.listAllAdmins(supabase);

    return successResponse({ admins });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_admins');

    const supabase = await createClient();
    const body = await req.json();

    const { email, full_name, designation, phone } = body;

    if (!email || !designation) {
      throw new BadRequestError('Email and designation are required');
    }

    const validDesignations: AdminDesignation[] = ['super_admin', 'admin', 'support'];
    if (!validDesignations.includes(designation as AdminDesignation)) {
      throw new BadRequestError(`Invalid designation. Must be one of: ${validDesignations.join(', ')}`);
    }

    // 1. Look up existing profile by email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .eq('email', email.trim().toLowerCase())
      .single();

    let targetProfileId: string;

    if (profile) {
      targetProfileId = profile.id;
      // Update profile role to 'admin'
      await supabase
        .from('profiles')
        .update({ role: 'admin', updated_at: new Date().toISOString() })
        .eq('id', profile.id);
    } else {
      // Create new profile record if user doesn't exist yet
      const newProfileId = crypto.randomUUID();
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: newProfileId,
          email: email.trim().toLowerCase(),
          full_name: full_name || 'Admin User',
          phone: phone || null,
          role: 'admin',
          status: 'active',
        })
        .select()
        .single();

      if (createError) throw createError;
      targetProfileId = newProfile.id;
    }

    // Default permissions based on designation
    const permissionsMap: Record<AdminDesignation, Record<string, boolean>> = {
      super_admin: {
        can_manage_admins: true,
        modify_settings: true,
        export_data: true,
        manage_bookings: true,
        manage_cooks: true,
        manage_customers: true,
        view_audit_logs: true,
      },
      admin: {
        can_manage_admins: false,
        modify_settings: true,
        export_data: true,
        manage_bookings: true,
        manage_cooks: true,
        manage_customers: true,
        view_audit_logs: true,
      },
      support: {
        can_manage_admins: false,
        modify_settings: false,
        export_data: false,
        manage_bookings: false,
        manage_cooks: false,
        manage_customers: false,
        view_audit_logs: false,
      },
    };

    // 2. Upsert admin_users entry
    const { data: newAdmin, error: adminError } = await supabase
      .from('admin_users')
      .upsert(
        {
          profile_id: targetProfileId,
          designation,
          permissions: permissionsMap[designation as AdminDesignation],
        },
        { onConflict: 'profile_id' }
      )
      .select('*, profile:profiles(id, full_name, email, phone, status, role)')
      .single();

    if (adminError) throw adminError;

    // 3. Record immutable audit log
    await adminRepository.recordAuditLog(
      supabase,
      adminUser.id,
      'CREATE_ADMIN_USER',
      newAdmin.id,
      null,
      {
        created_admin_id: newAdmin.id,
        target_profile_id: targetProfileId,
        designation,
        email,
      }
    );

    return successResponse({
      admin: newAdmin,
      message: `Admin user '${email}' created with '${designation}' role.`,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
