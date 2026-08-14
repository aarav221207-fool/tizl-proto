import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission, AdminDesignation } from '@/middleware/admin-auth';
import { adminRepository } from '@/repositories/admin.repository';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError, ForbiddenError, NotFoundError } from '@/lib/errors';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_admins');

    const supabase = await createClient();
    const body = await req.json();

    const { designation, status } = body;

    // Fetch existing admin user record
    const { data: targetAdmin, error: fetchError } = await supabase
      .from('admin_users')
      .select('*, profile:profiles(id, email, full_name)')
      .eq('id', id)
      .single();

    if (fetchError || !targetAdmin) {
      throw new NotFoundError('Admin user record not found');
    }

    const oldData = {
      designation: targetAdmin.designation,
      status: (targetAdmin.profile as { status?: string })?.status || 'active',
    };

    // If changing designation away from super_admin, verify there is at least one other super_admin remaining
    if (
      designation &&
      targetAdmin.designation === 'super_admin' &&
      designation !== 'super_admin'
    ) {
      const superAdminCount = await adminRepository.countSuperAdmins(supabase);
      if (superAdminCount <= 1) {
        throw new ForbiddenError(
          'Cannot demote the last Super Admin. System requires at least one active Super Admin.'
        );
      }
    }

    const updatePayload: Record<string, unknown> = {};

    if (designation) {
      const validDesignations: AdminDesignation[] = ['super_admin', 'admin', 'support'];
      if (!validDesignations.includes(designation as AdminDesignation)) {
        throw new BadRequestError(`Invalid designation: ${designation}`);
      }

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

      updatePayload.designation = designation;
      updatePayload.permissions = permissionsMap[designation as AdminDesignation];
    }

    // Update admin_users table if designation changed
    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('admin_users')
        .update(updatePayload)
        .eq('id', id);

      if (updateError) throw updateError;
    }

    // Update profile status if status provided ('active' | 'suspended')
    if (status) {
      const { error: profileStatusError } = await supabase
        .from('profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', targetAdmin.profile_id);

      if (profileStatusError) throw profileStatusError;
    }

    // Record immutable audit log
    await adminRepository.recordAuditLog(
      supabase,
      adminUser.id,
      'UPDATE_ADMIN_ROLE_OR_STATUS',
      id,
      oldData,
      { designation, status }
    );

    return successResponse({
      message: 'Admin user permissions updated successfully',
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'manage_admins');

    const supabase = await createClient();

    // Fetch existing admin user record
    const { data: targetAdmin, error: fetchError } = await supabase
      .from('admin_users')
      .select('*, profile:profiles(id, email)')
      .eq('id', id)
      .single();

    if (fetchError || !targetAdmin) {
      throw new NotFoundError('Admin user record not found');
    }

    // Prevent deleting oneself or the last super admin
    if (targetAdmin.profile_id === adminUser.id) {
      throw new ForbiddenError('You cannot remove your own admin account.');
    }

    if (targetAdmin.designation === 'super_admin') {
      const superAdminCount = await adminRepository.countSuperAdmins(supabase);
      if (superAdminCount <= 1) {
        throw new ForbiddenError(
          'Cannot delete the last Super Admin. System requires at least one active Super Admin.'
        );
      }
    }

    // 1. Delete admin_users record
    const { error: deleteError } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // 2. Reset profile role to 'customer'
    await supabase
      .from('profiles')
      .update({ role: 'customer', updated_at: new Date().toISOString() })
      .eq('id', targetAdmin.profile_id);

    // 3. Record Audit Log
    await adminRepository.recordAuditLog(
      supabase,
      adminUser.id,
      'REMOVE_ADMIN_USER',
      id,
      { designation: targetAdmin.designation, profile_id: targetAdmin.profile_id },
      null
    );

    return successResponse({
      message: 'Admin privileges removed successfully',
    });
  } catch (err) {
    return errorResponse(err);
  }
}
