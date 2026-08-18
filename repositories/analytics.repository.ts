import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';
import { BaseRepository } from './base.repository';

export interface VisitorAnalyticsSummary {
  totalPageViews: number;
  uniqueVisitors: number;
  authenticatedVisitors: number;
  anonymousVisitors: number;
  dailyTraffic: { date: string; views: number; uniqueVisitors: number }[];
  topPages: { path: string; count: number }[];
  deviceBreakdown: Record<string, number>;
  topReferrers: { referrer: string; count: number }[];
}

export class AnalyticsRepository extends BaseRepository<'analytics_events'> {
  constructor() {
    super('analytics_events');
  }

  /**
   * Record a new analytics / page view event
   */
  async recordEvent(
    client: SupabaseClient<Database>,
    event: {
      profile_id?: string | null;
      event_name: string;
      event_data?: Record<string, unknown> | null;
      ip_address?: string | null;
    }
  ) {
    const { data, error } = await client
      .from('analytics_events')
      .insert({
        profile_id: event.profile_id || null,
        event_name: event.event_name,
        event_data: event.event_data || {},
        ip_address: event.ip_address || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to record analytics event:', error);
      return null;
    }

    return data;
  }

  /**
   * Fetch and aggregate visitor analytics for admins
   */
  async getVisitorAnalytics(
    client: SupabaseClient<Database>,
    days = 30
  ): Promise<VisitorAnalyticsSummary> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateIso = startDate.toISOString();

    const { data, error } = await client
      .from('analytics_events')
      .select('*')
      .gte('created_at', startDateIso)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch analytics events:', error);
      return {
        totalPageViews: 0,
        uniqueVisitors: 0,
        authenticatedVisitors: 0,
        anonymousVisitors: 0,
        dailyTraffic: [],
        topPages: [],
        deviceBreakdown: {},
        topReferrers: [],
      };
    }

    const events = data || [];
    const pageViews = events.filter((e) => e.event_name === 'page_view');

    // Calculate unique visitors
    const allUniqueVisitorKeys = new Set<string>();
    const authVisitorKeys = new Set<string>();
    const anonVisitorKeys = new Set<string>();

    pageViews.forEach((e) => {
      const dataObj = (e.event_data || {}) as Record<string, unknown>;
      const visitorKey =
        e.profile_id ||
        (dataObj.session_id as string) ||
        (dataObj.anonymous_id as string) ||
        e.ip_address ||
        e.id;

      allUniqueVisitorKeys.add(visitorKey);

      if (e.profile_id) {
        authVisitorKeys.add(e.profile_id);
      } else {
        anonVisitorKeys.add(visitorKey);
      }
    });

    // Top Pages
    const pageCountMap: Record<string, number> = {};
    pageViews.forEach((e) => {
      const dataObj = (e.event_data || {}) as Record<string, unknown>;
      const path = (dataObj.path as string) || (dataObj.pathname as string) || '/';
      pageCountMap[path] = (pageCountMap[path] || 0) + 1;
    });

    const topPages = Object.entries(pageCountMap)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    // Device breakdown
    const deviceBreakdown: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
    pageViews.forEach((e) => {
      const dataObj = (e.event_data || {}) as Record<string, unknown>;
      const device = (dataObj.device_type as string) || 'desktop';
      deviceBreakdown[device] = (deviceBreakdown[device] || 0) + 1;
    });

    // Top Referrers
    const referrerMap: Record<string, number> = {};
    pageViews.forEach((e) => {
      const dataObj = (e.event_data || {}) as Record<string, unknown>;
      const rawRef = (dataObj.referrer as string) || 'Direct';
      let cleanRef = 'Direct';
      try {
        if (rawRef && rawRef !== 'Direct' && rawRef.startsWith('http')) {
          cleanRef = new URL(rawRef).hostname.replace('www.', '');
        } else if (rawRef && rawRef !== 'Direct') {
          cleanRef = rawRef;
        }
      } catch {
        cleanRef = rawRef;
      }
      referrerMap[cleanRef] = (referrerMap[cleanRef] || 0) + 1;
    });

    const topReferrers = Object.entries(referrerMap)
      .map(([referrer, count]) => ({ referrer, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Daily Traffic (last 7 or 14 days)
    const trafficDays = Math.min(days, 14);
    const dailyMap: Record<string, { views: number; visitors: Set<string> }> = {};
    const now = new Date();

    for (let i = trafficDays - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyMap[dateStr] = { views: 0, visitors: new Set<string>() };
    }

    pageViews.forEach((e) => {
      const dStr = e.created_at?.split('T')[0];
      if (dStr && dailyMap[dStr]) {
        dailyMap[dStr].views += 1;
        const dataObj = (e.event_data || {}) as Record<string, unknown>;
        const visitorKey =
          e.profile_id ||
          (dataObj.session_id as string) ||
          (dataObj.anonymous_id as string) ||
          e.ip_address ||
          e.id;
        dailyMap[dStr].visitors.add(visitorKey);
      }
    });

    const dailyTraffic = Object.entries(dailyMap).map(([date, val]) => ({
      date,
      views: val.views,
      uniqueVisitors: val.visitors.size,
    }));

    return {
      totalPageViews: pageViews.length,
      uniqueVisitors: allUniqueVisitorKeys.size,
      authenticatedVisitors: authVisitorKeys.size,
      anonymousVisitors: anonVisitorKeys.size,
      dailyTraffic,
      topPages,
      deviceBreakdown,
      topReferrers,
    };
  }
}

export const analyticsRepository = new AnalyticsRepository();
