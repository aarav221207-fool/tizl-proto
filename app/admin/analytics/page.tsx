'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  BarChart3,
  Users,
  MapPin,
  Calendar,
  Download,
  RefreshCw,
  Award,
  Layers,
  ArrowUpRight,
  Filter,
  Globe,
  Eye,
  Smartphone,
  Laptop,
  Compass,
  UserCheck,
  UserX,
} from 'lucide-react';

interface VisitorAnalytics {
  totalPageViews: number;
  uniqueVisitors: number;
  authenticatedVisitors: number;
  anonymousVisitors: number;
  dailyTraffic: { date: string; views: number; uniqueVisitors: number }[];
  topPages: { path: string; count: number }[];
  deviceBreakdown: Record<string, number>;
  topReferrers: { referrer: string; count: number }[];
}

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  activeCooks: number;
  onlineCooks: number;
  newCustomers: number;
  bookingFunnel: Record<string, number>;
  topServices: { name: string; count: number; revenue: number }[];
  topCities: { name: string; count: number }[];
  dailyTrends: { date: string; bookings: number; revenue: number }[];
  visitorAnalytics?: VisitorAnalytics;
  financials: {
    grossRevenue: number;
    platformFees: number;
    taxesCollected: number;
    discountsGiven: number;
    netCommissionRate: string;
  };
  paymentMethods: Record<string, number>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

  const fetchAnalytics = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/analytics');
      if (!res.ok) throw new Error('Failed to fetch analytics data');
      const json = await res.json();
      setData(json.data?.analytics || json.analytics || null);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const loadData = async () => {
      try {
        setRefreshing(true);
        const res = await fetch('/api/admin/analytics');
        if (!res.ok) throw new Error('Failed to fetch analytics data');
        const json = await res.json();
        if (!ignore) setData(json.data?.analytics || json.analytics || null);
      } catch (err: any) {
        console.error(err);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const handleExport = (type: 'bookings' | 'cooks' | 'customers', format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ type, format });
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-500" />
            Analytics & Financial Intelligence
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time business performance, revenue trends, booking conversion funnels, and city-level demand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnalytics()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>Refresh Data</span>
          </button>

          <button
            onClick={() => handleExport('bookings', 'xlsx')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Analytics Report</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3 bg-slate-900 rounded-xl border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
          <p className="text-sm">Calculating real-time platform metrics from Supabase...</p>
        </div>
      ) : data ? (
        <>
          {/* Key Financial Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
              <div className="text-xs text-slate-400 font-medium">Gross Platform GMV</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                ₹{data.financials?.grossRevenue.toLocaleString() || '0'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>100% Verified Live Bookings</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Platform Take Revenue (15%)</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                ₹{data.financials?.platformFees.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">Commission Earned</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total Bookings Executed</div>
              <div className="text-2xl font-extrabold text-blue-400 mt-1">{data.totalBookings}</div>
              <div className="text-[11px] text-slate-500 mt-2">Across all service categories</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">GST Collected (5%)</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">
                ₹{data.financials?.taxesCollected.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">Government Compliance Tax</div>
            </div>
          </div>

          {/* Revenue & Booking Trends */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-emerald-400" />
                    Daily Revenue & Booking Volume Trend
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Last 7 days performance breakdown</p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                {data.dailyTrends.map((trend) => (
                  <div key={trend.date} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-300">{trend.date}</span>
                      <div className="space-x-3">
                        <span className="text-slate-400">{trend.bookings} Bookings</span>
                        <span className="text-emerald-400 font-mono">₹{trend.revenue.toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, (trend.revenue / (data.totalRevenue || 1)) * 100 * 3)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Booking Conversion Funnel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                Booking Conversion Funnel
              </h3>

              <div className="space-y-3 text-xs">
                {Object.entries(data.bookingFunnel).map(([status, count]) => {
                  const percentage = data.totalBookings > 0 ? Math.round((count / data.totalBookings) * 100) : 0;
                  return (
                    <div key={status} className="p-2.5 bg-slate-950 border border-slate-800/80 rounded-lg space-y-1">
                      <div className="flex justify-between font-medium">
                        <span className="capitalize text-slate-300">{status.replace('_', ' ')}</span>
                        <span className="text-white font-bold">{count} ({percentage}%)</span>
                      </div>
                      <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-amber-400 h-full rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Website Traffic & Visitor Intelligence */}
          {data.visitorAnalytics && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Globe className="w-5 h-5 text-indigo-400" />
                    Website Traffic & Visitor Intelligence
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Real-time page views, unique session tracking, and anonymous vs. logged-in audience telemetry from Supabase.
                  </p>
                </div>
              </div>

              {/* Traffic Key Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Total Page Views</span>
                    <Eye className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white mt-2">
                    {data.visitorAnalytics.totalPageViews.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Recorded in analytics_events</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Unique Visitors</span>
                    <Users className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-400 mt-2">
                    {data.visitorAnalytics.uniqueVisitors.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Distinct session & user IDs</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Logged-in Users</span>
                    <UserCheck className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-blue-400 mt-2">
                    {data.visitorAnalytics.authenticatedVisitors.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Associated with profile IDs</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">Anonymous Visitors</span>
                    <UserX className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-purple-400 mt-2">
                    {data.visitorAnalytics.anonymousVisitors.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Guest & unauthenticated sessions</div>
                </div>
              </div>

              {/* Traffic Trends & Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Daily Visitor Volume */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-400" />
                      Daily Page Views & Visitor Volume (Last 14 Days)
                    </h3>
                  </div>

                  {data.visitorAnalytics.dailyTraffic.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No visitor traffic recorded yet.</p>
                  ) : (
                    <div className="space-y-3 pt-2">
                      {data.visitorAnalytics.dailyTraffic.map((day) => {
                        const maxViews = Math.max(...data.visitorAnalytics!.dailyTraffic.map((d) => d.views), 1);
                        const percentage = Math.round((day.views / maxViews) * 100);
                        return (
                          <div key={day.date} className="space-y-1.5">
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-slate-300">{day.date}</span>
                              <div className="space-x-3">
                                <span className="text-indigo-400 font-mono">{day.views} Views</span>
                                <span className="text-slate-400">{day.uniqueVisitors} Unique</span>
                              </div>
                            </div>
                            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden flex">
                              <div
                                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Device & Referrer Breakdown */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Smartphone className="w-4 h-4 text-emerald-400" />
                      Device Distribution
                    </h3>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Mobile</div>
                        <div className="text-base font-bold text-white mt-1">
                          {data.visitorAnalytics.deviceBreakdown.mobile || 0}
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Desktop</div>
                        <div className="text-base font-bold text-white mt-1">
                          {data.visitorAnalytics.deviceBreakdown.desktop || 0}
                        </div>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                        <div className="text-[11px] text-slate-400">Tablet</div>
                        <div className="text-base font-bold text-white mt-1">
                          {data.visitorAnalytics.deviceBreakdown.tablet || 0}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
                      <Compass className="w-4 h-4 text-amber-400" />
                      Top Traffic Sources
                    </h3>
                    <div className="space-y-2">
                      {data.visitorAnalytics.topReferrers.length === 0 ? (
                        <p className="text-xs text-slate-500">No external referrers logged.</p>
                      ) : (
                        data.visitorAnalytics.topReferrers.map((ref) => (
                          <div
                            key={ref.referrer}
                            className="flex justify-between items-center text-xs p-2 bg-slate-950 rounded border border-slate-800/80"
                          >
                            <span className="text-slate-300 truncate max-w-[160px]">{ref.referrer}</span>
                            <span className="font-mono text-emerald-400 font-bold">{ref.count} visits</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Visited Pages */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  Most Viewed Pages
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {data.visitorAnalytics.topPages.length === 0 ? (
                    <p className="text-xs text-slate-500 col-span-full">No page views recorded yet.</p>
                  ) : (
                    data.visitorAnalytics.topPages.map((page, idx) => (
                      <div
                        key={page.path}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded bg-slate-800 text-slate-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                            #{idx + 1}
                          </span>
                          <span className="font-mono text-slate-200 truncate">{page.path}</span>
                        </div>
                        <span className="font-mono font-bold text-indigo-400 ml-2 shrink-0">{page.count}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Top Services & Top Cities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Services */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-400" />
                Top Performing Services
              </h3>

              <div className="space-y-2">
                {data.topServices.length === 0 ? (
                  <p className="text-xs text-slate-500">No service bookings recorded yet.</p>
                ) : (
                  data.topServices.map((service, idx) => (
                    <div
                      key={service.name}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-100">{service.name}</div>
                          <div className="text-[11px] text-slate-500">{service.count} Total Bookings</div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-emerald-400">
                        ₹{service.revenue.toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Top Cities */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-400" />
                City Demand Distribution
              </h3>

              <div className="space-y-2">
                {data.topCities.length === 0 ? (
                  <p className="text-xs text-slate-500">No city bookings recorded yet.</p>
                ) : (
                  data.topCities.map((city, idx) => (
                    <div
                      key={city.name}
                      className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded bg-slate-800 text-slate-300 font-bold flex items-center justify-center shrink-0 text-[11px]">
                          #{idx + 1}
                        </div>
                        <div className="font-semibold text-slate-100">{city.name}</div>
                      </div>
                      <div className="font-bold text-slate-300">{city.count} Bookings</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
