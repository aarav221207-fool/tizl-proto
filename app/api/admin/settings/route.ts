import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateAdminRequest, checkAdminPermission } from '@/middleware/admin-auth';
import { adminRepository } from '@/repositories/admin.repository';
import { successResponse, errorResponse } from '@/lib/api-response';
import { BadRequestError } from '@/lib/errors';

export async function GET() {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'view_data');

    const supabase = await createClient();

    const [citiesRes, servicesRes, adminUsersRes] = await Promise.all([
      supabase.from('cities').select('*').order('name'),
      supabase.from('services').select('*').order('name'),
      supabase.from('admin_users').select('*, profile:profiles(full_name, email)'),
    ]);

    // System configuration state
    const systemConfig = {
      platformFeePercentage: 15,
      gstTaxPercentage: 5,
      cancellationPolicy: 'Free cancellation up to 2 hours before booking start time. 50% fee thereafter.',
      referralRewardCustomer: 150,
      referralRewardCook: 300,
      maintenanceMode: false,
      featureFlags: {
        instantBooking: true,
        multiCookAssignment: true,
        aiMealPlanner: true,
      },
    };

    return successResponse({
      cities: citiesRes.data || [],
      services: servicesRes.data || [],
      adminUsers: adminUsersRes.data || [],
      systemConfig,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminUser = await authenticateAdminRequest();
    checkAdminPermission(adminUser, 'modify_settings');

    const supabase = await createClient();
    const body = await req.json();

    const { action, payload } = body;

    if (!action) throw new BadRequestError('Setting action is required');

    if (action === 'TOGGLE_CITY') {
      const { id, is_active } = payload;
      const { data, error } = await supabase
        .from('cities')
        .update({ is_active, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await adminRepository.recordAuditLog(supabase, adminUser.id, 'TOGGLE_CITY_ACTIVE', id, null, { is_active });
      return successResponse({ result: data });
    }

    if (action === 'ADD_CITY') {
      const { name, state } = payload;
      if (!name || !state) throw new BadRequestError('City name and state are required');

      const { data, error } = await supabase
        .from('cities')
        .insert({ name, state, is_active: true })
        .select()
        .single();
      if (error) throw error;

      await adminRepository.recordAuditLog(supabase, adminUser.id, 'ADD_OPERATIONAL_CITY', data.id, null, { name, state });
      return successResponse({ result: data });
    }

    if (action === 'UPDATE_SERVICE_PRICE') {
      const { id, base_price, category } = payload;
      const { data, error } = await supabase
        .from('services')
        .update({ base_price, category })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;

      await adminRepository.recordAuditLog(supabase, adminUser.id, 'UPDATE_SERVICE_PRICE', id, null, { base_price, category });
      return successResponse({ result: data });
    }

    if (action === 'UPDATE_SYSTEM_CONFIG') {
      await adminRepository.recordAuditLog(supabase, adminUser.id, 'UPDATE_SYSTEM_CONFIG', null, null, payload);
      return successResponse({ success: true, updatedConfig: payload });
    }

    throw new BadRequestError('Invalid settings action');
  } catch (err) {
    return errorResponse(err);
  }
}
