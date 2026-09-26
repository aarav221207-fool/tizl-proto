import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { analyticsRepository, VisitorAnalyticsSummary } from '@/repositories/analytics.repository';

const FORBIDDEN_KEYS = new Set([
  'password',
  'password_hash',
  'token',
  'access_token',
  'refresh_token',
  'secret',
  'key',
  'api_key',
  'service_role',
  'service_role_key',
  'authorization',
  'auth',
  'bearer',
  'cookie',
  'cookies',
  'credit_card',
  'card_number',
  'card',
  'cvv',
  'cvc',
  'pan',
  'aadhaar',
  'aadhaar_number',
  'bank_details',
  'bank_account',
  'otp',
  'pin',
  'ssn',
]);

/**
 * Sanitize event data recursively to strictly strip any sensitive parameters or secrets
 */
export function sanitizeAnalyticsData(data: Record<string, unknown> | null | undefined): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};

  const clean: Record<string, unknown> = {};

  for (const [k, v] of Object.entries(data)) {
    const lowerKey = k.toLowerCase().replace(/[-_]/g, '');

    // Check if key matches or contains forbidden secret terms
    const isForbidden = Array.from(FORBIDDEN_KEYS).some(
      (f) => lowerKey === f || lowerKey.includes(f)
    );

    if (isForbidden) {
      continue;
    }

    if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      clean[k] = sanitizeAnalyticsData(v as Record<string, unknown>);
    } else if (typeof v === 'string' && v.length > 500) {
      clean[k] = v.substring(0, 500); // Truncate excessively long strings
    } else {
      clean[k] = v;
    }
  }

  return clean;
}

export class AnalyticsService {
  /**
   * Record pageview or custom client event safely
   */
  async recordEvent(
    client: SupabaseClient<Database> | null | undefined,
    payload: {
      profileId?: string | null;
      visitorId?: string | null;
      eventName: string;
      eventData?: Record<string, unknown> | null;
      path?: string | null;
      referrer?: string | null;
      userAgent?: string | null;
      ipAddress?: string | null;
    }
  ) {
    const sanitizedName = (payload.eventName || 'page_view').trim().slice(0, 64);
    const sanitizedData = sanitizeAnalyticsData(payload.eventData);

    return analyticsRepository.recordEvent(client, {
      profile_id: payload.profileId || null,
      visitor_id: payload.visitorId || null,
      event_name: sanitizedName,
      event_data: sanitizedData,
      path: payload.path || (sanitizedData.path as string) || null,
      referrer: payload.referrer || (sanitizedData.referrer as string) || null,
      user_agent: payload.userAgent || (sanitizedData.user_agent as string) || null,
      ip_address: payload.ipAddress || null,
    });
  }

  /**
   * Retrieve visitor metrics summary for admin dashboard
   */
  async getVisitorMetrics(
    client?: SupabaseClient<Database> | null,
    options?: number | { days?: number; startDate?: string; endDate?: string }
  ): Promise<VisitorAnalyticsSummary> {
    return analyticsRepository.getVisitorAnalytics(client, options);
  }

  /**
   * Retrieve event timeline for admin analytics
   */
  async getEventTimeline(
    client?: SupabaseClient<Database> | null,
    limit = 50,
    options?: { startDate?: string; endDate?: string; eventName?: string }
  ) {
    return analyticsRepository.getEventTimeline(client, limit, options);
  }
}

export const analyticsService = new AnalyticsService();
