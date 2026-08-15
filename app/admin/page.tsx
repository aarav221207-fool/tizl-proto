'use client';

import React, { useEffect, useState } from 'react';
import {
  DollarSign,
  CalendarCheck,
  ChefHat,
  Users,
  TrendingUp,
  RefreshCw,
  Building2,
  UtensilsCrossed,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

interface DashboardMetrics {
  totalRevenue: number;
  totalBookings: number;
  activeCooks: number;
  onlineCooks: number;
  newCustomers: number;
  bookingFunnel: Record<string, number>;
  topServices: { name: string; count: number; revenue: number }[];
  topCities: { name: string; count: number }[];
  dailyTrends: { date: string; bookings: number; revenue: number }[];
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || data.error || 'Failed to load dashboard metrics');
      }
      setMetrics(data.data?.metrics || null);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await fetch('/api/admin/dashboard');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error?.message || data.error || 'Failed to load dashboard metrics');
        }
        if (!ignore) setMetrics(data.data?.metrics || null);
      } catch (err: any) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, []);

  const funnelData = metrics?.bookingFunnel
    ? Object.entries(metrics.bookingFunnel).map(([status, count]) => ({
        status: status.replace('_', ' ').toUpperCase(),
        count,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Operations Dashboard</h1>
          <p className="text-sm text-slate-400">
            Real-time business performance, live booking trends, and platform metrics
          </p>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Live Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-300 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Revenue
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            ₹{metrics?.totalRevenue.toLocaleString('en-IN') || 0}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Live completed bookings</span>
          </div>
        </div>

        {/* Total Bookings */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Bookings
            </span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{metrics?.totalBookings || 0}</div>
          <div className="text-xs text-slate-400">All-time marketplace requests</div>
        </div>

        {/* Active Cooks */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Cooks Network
            </span>
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg">
              <ChefHat className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">
            {metrics?.activeCooks || 0}{' '}
            <span className="text-sm font-normal text-slate-400">verified</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-emerald-400 font-medium">{metrics?.onlineCooks || 0} online now</span>
          </div>
        </div>

        {/* Customers */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Customers
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{metrics?.newCustomers || 0}</div>
          <div className="text-xs text-slate-400">Registered platform accounts</div>
        </div>
      </div>

      {/* Daily Trends & Funnel Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue & Booking Trends */}
        <div className="lg:col-span-2 p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Daily Booking Trends</h2>
            <span className="text-xs text-slate-400">Past 7 days</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics?.dailyTrends || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Area
                  type="monotone"
                  dataKey="bookings"
                  stroke="#3b82f6"
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                  name="Bookings"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Booking Funnel Breakdown */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <h2 className="text-base font-semibold text-white">Booking Status Funnel</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="status" type="category" stroke="#94a3b8" fontSize={10} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }}
                  labelStyle={{ color: '#f8fafc' }}
                />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top Services & Top Cities Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Services */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-semibold text-white">Top Services by Volume</h2>
          </div>
          <div className="space-y-3">
            {metrics?.topServices && metrics.topServices.length > 0 ? (
              metrics.topServices.map((svc, i) => (
                <div
                  key={svc.name}
                  className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-700 text-xs font-bold text-slate-300 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="font-medium text-slate-200">{svc.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-white">{svc.count} bookings</div>
                    <div className="text-xs text-slate-400">₹{svc.revenue.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400 py-4">No service data recorded yet.</p>
            )}
          </div>
        </div>

        {/* Top Cities */}
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-semibold text-white">Top Operating Cities</h2>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            {metrics?.topCities && metrics.topCities.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.topCities}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  >
                    {metrics.topCities.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">No city breakdown available.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
