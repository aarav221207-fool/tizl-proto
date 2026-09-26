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
  AlertCircle,
  X,
  Activity,
  CheckCircle2,
  Clock,
  ArrowRight,
  Percent,
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

interface ActivityEvent {
  id: string;
  event_name: string;
  created_at: string;
  path?: string | null;
  event_data?: Record<string, unknown> | null;
  profile_id?: string | null;
  visitor_id?: string | null;
  profile?: {
    full_name?: string | null;
    email?: string | null;
    role?: string | null;
  } | null;
}

interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  allTimeBookingsCount?: number;
  activeCooks: number;
  onlineCooks: number;
  newCustomers: number;
  bookingFunnel: Record<string, number>;
  topServices: { name: string; count: number; revenue: number }[];
  topCities: { name: string; count: number }[];
  dailyTrends: { date: string; bookings: number; revenue: number }[];
  visitorAnalytics?: VisitorAnalytics;
  eventTimeline?: ActivityEvent[];
  financials: {
    grossRevenue: number;
    platformFees: number;
    taxesCollected: number;
    discountsGiven: number;
    netCommissionRate: string;
  };
  paymentMethods: Record<string, number>;
}

type TimeRangeOption = '7d' | '30d' | '90d' | 'all' | 'custom';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchAnalytics = async (
    overrideRange?: TimeRangeOption,
    start?: string,
    end?: string
  ) => {
    try {
      setRefreshing(true);
      setError(null);
      const activeRange = overrideRange || timeRange;
      const sDate = start !== undefined ? start : customStartDate;
      const eDate = end !== undefined ? end : customEndDate;

      const params = new URLSearchParams();
      params.set('range', activeRange);
      if (activeRange === 'custom') {
        if (sDate) params.set('startDate', sDate);
        if (eDate) params.set('endDate', eDate);
      }

      const res = await fetch(`/api/admin/analytics?${params.toString()}`);
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.error?.message || 'Failed to fetch analytics data');
      }
      const json = await res.json();
      setData(json.data?.analytics || json.analytics || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while loading analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      try {
        setError(null);
        const res = await fetch('/api/admin/analytics?range=7d');
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error?.message || 'Failed to fetch analytics data');
        }
        const json = await res.json();
        if (!ignore) {
          setData(json.data?.analytics || json.analytics || null);
        }
      } catch (err: any) {
        console.error(err);
        if (!ignore) setError(err.message || 'An error occurred while loading analytics.');
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    init();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRangeChange = (newRange: TimeRangeOption) => {
    setTimeRange(newRange);
    if (newRange !== 'custom') {
      fetchAnalytics(newRange);
    }
  };

  const handleApplyCustomRange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customStartDate) {
      setError('Please select at least a start date for the custom range.');
      return;
    }
    fetchAnalytics('custom', customStartDate, customEndDate);
  };

  const handleExport = (type: 'bookings' | 'cooks' | 'customers', format: 'xlsx' | 'csv') => {
    const params = new URLSearchParams({ type, format });
    window.open(`/api/admin/export?${params.toString()}`, '_blank');
  };

  // Calculate high-level conversion metrics
  const totalVisitors = data?.visitorAnalytics?.uniqueVisitors || 0;
  const totalPageViews = data?.visitorAnalytics?.totalPageViews || 0;
  const totalBookings = data?.totalBookings || 0;
  const completedBookings = data?.bookingFunnel?.completed || 0;
  const cancelledBookings = data?.bookingFunnel?.cancelled || 0;

  const visitorToBookingRate =
    totalVisitors > 0 ? ((totalBookings / totalVisitors) * 100).toFixed(1) : '0.0';
  const bookingCompletionRate =
    totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : '0.0';
  const cancellationRate =
    totalBookings > 0 ? ((cancelledBookings / totalBookings) * 100).toFixed(1) : '0.0';
  const avgOrderValue =
    totalBookings > 0 ? Math.round((data?.financials?.grossRevenue || 0) / totalBookings) : 0;

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
            Real-time business performance, telemetry funnels, event timeline, and live platform demand.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAnalytics()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            <span>{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>

          <button
            onClick={() => handleExport('bookings', 'xlsx')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-lg shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold text-slate-300">Date Range Filter:</span>
          <div className="flex flex-wrap items-center gap-1.5 ml-2">
            {(
              [
                { label: 'Last 7 Days', value: '7d' },
                { label: 'Last 30 Days', value: '30d' },
                { label: 'Last 90 Days', value: '90d' },
                { label: 'All Time', value: 'all' },
                { label: 'Custom Range', value: 'custom' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.value}
                onClick={() => handleRangeChange(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  timeRange === opt.value
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {timeRange === 'custom' && (
          <form
            onSubmit={handleApplyCustomRange}
            className="flex flex-wrap items-center gap-2 w-full md:w-auto"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">From:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">To:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={refreshing}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-semibold shadow disabled:opacity-50"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAnalytics()}
              disabled={refreshing}
              className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800/50 text-red-200 text-xs font-semibold rounded-md border border-red-800 transition-colors flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              Retry
            </button>
            <button onClick={() => setError(null)} className="p-1.5 hover:bg-red-900/50 rounded-md transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center text-slate-400 space-y-3 bg-slate-900 rounded-xl border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
          <p className="text-sm">Calculating real-time platform metrics from Supabase...</p>
        </div>
      ) : data ? (
        <>
          {/* Key Financial & Core Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden">
              <div className="text-xs text-slate-400 font-medium">Gross Platform GMV</div>
              <div className="text-2xl font-extrabold text-white mt-1">
                ₹{data.financials?.grossRevenue.toLocaleString() || '0'}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold mt-2">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Range Filtered Gross Revenue</span>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Platform Fee Revenue (15%)</div>
              <div className="text-2xl font-extrabold text-emerald-400 mt-1">
                ₹{data.financials?.platformFees.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">Earned platform commission</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total Bookings Executed</div>
              <div className="text-2xl font-extrabold text-blue-400 mt-1">{data.totalBookings}</div>
              <div className="text-[11px] text-slate-500 mt-2">
                {data.allTimeBookingsCount ? `${data.allTimeBookingsCount} all-time bookings` : 'Across all service categories'}
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Average Order Value</div>
              <div className="text-2xl font-extrabold text-amber-400 mt-1">
                ₹{avgOrderValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-2">Per booking realized value</div>
            </div>
          </div>

          {/* Conversion & Efficiency Metrics Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-400" />
              Conversion & Funnel Efficiency Ratios
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-1">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Visitor → Booking Rate</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">{visitorToBookingRate}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{totalBookings} bookings / {totalVisitors} unique visitors</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Booking Completion Rate</div>
                <div className="text-xl font-bold text-blue-400 mt-1">{bookingCompletionRate}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{completedBookings} completed of {totalBookings} bookings</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">Booking Cancellation Rate</div>
                <div className="text-xl font-bold text-red-400 mt-1">{cancellationRate}%</div>
                <div className="text-[10px] text-slate-500 mt-0.5">{cancelledBookings} cancelled bookings</div>
              </div>

              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <div className="text-xs text-slate-400">GST / Taxes Collected</div>
                <div className="text-xl font-bold text-purple-400 mt-1">₹{data.financials?.taxesCollected.toLocaleString() || '0'}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">5% statutory tax compliance</div>
              </div>
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
                  <p className="text-xs text-slate-400 mt-0.5">Selected date range performance timeline</p>
                </div>
              </div>

              <div className="space-y-3 pt-2 max-h-96 overflow-y-auto pr-1">
                {data.dailyTrends.length === 0 ? (
                  <p className="text-xs text-slate-500 py-6 text-center">No trend data for this period.</p>
                ) : (
                  data.dailyTrends.map((trend) => (
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
                  ))
                )}
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
                        <span className="capitalize text-slate-300">{status.replace(/_/g, ' ')}</span>
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
                      Daily Page Views & Visitor Volume
                    </h3>
                  </div>

                  {data.visitorAnalytics.dailyTraffic.length === 0 ? (
                    <p className="text-xs text-slate-500 py-6 text-center">No visitor traffic recorded for this range.</p>
                  ) : (
                    <div className="space-y-3 pt-2 max-h-80 overflow-y-auto pr-1">
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

          {/* Event Timeline (Real-time telemetry events from Supabase) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-400" />
                  Live Event Timeline
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Chronological stream of user actions, bookings, payments, and page visits from Supabase analytics_events.
                </p>
              </div>
              <span className="text-xs text-slate-400">
                {data.eventTimeline?.length || 0} recent events
              </span>
            </div>

            {!data.eventTimeline || data.eventTimeline.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center bg-slate-950 rounded-lg border border-slate-800">
                No events recorded for this time period yet.
              </p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {data.eventTimeline.map((ev) => {
                  const isBooking = ev.event_name.startsWith('booking_');
                  const isPayment = ev.event_name.startsWith('payment_');
                  const isAuth = ['login', 'signup', 'logout'].includes(ev.event_name);
                  const isReview = ev.event_name === 'review_created';

                  let badgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
                  if (isBooking) badgeColor = 'bg-emerald-950 text-emerald-300 border-emerald-800';
                  else if (isPayment) badgeColor = 'bg-amber-950 text-amber-300 border-amber-800';
                  else if (isAuth) badgeColor = 'bg-blue-950 text-blue-300 border-blue-800';
                  else if (isReview) badgeColor = 'bg-yellow-950 text-yellow-300 border-yellow-800';

                  const eventDate = new Date(ev.created_at);
                  const timeFormatted = eventDate.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const dateFormatted = eventDate.toLocaleDateString([], {
                    month: 'short',
                    day: 'numeric',
                  });

                  return (
                    <div
                      key={ev.id}
                      className="p-3 bg-slate-950 border border-slate-800/90 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`px-2 py-0.5 rounded border text-[11px] font-mono font-medium shrink-0 ${badgeColor}`}
                        >
                          {ev.event_name}
                        </span>

                        <div className="truncate">
                          <span className="font-medium text-slate-200">
                            {ev.profile?.full_name || ev.profile?.email || (ev.profile_id ? `User: ${ev.profile_id.slice(0, 8)}...` : 'Guest Visitor')}
                          </span>
                          {ev.path && (
                            <span className="text-slate-400 ml-2 font-mono text-[11px]">
                              {ev.path}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-slate-400">
                        {ev.event_data && Object.keys(ev.event_data).length > 0 && (
                          <span
                            title={JSON.stringify(ev.event_data)}
                            className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800 max-w-[180px] truncate"
                          >
                            {JSON.stringify(ev.event_data)}
                          </span>
                        )}
                        <span className="font-mono text-[11px] text-slate-400">
                          {dateFormatted} {timeFormatted}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

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
