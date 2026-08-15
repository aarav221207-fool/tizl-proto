'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings,
  MapPin,
  Utensils,
  Percent,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Plus,
  RefreshCw,
  Save,
  CheckCircle2,
  AlertTriangle,
  Users,
  DollarSign,
  Building,
} from 'lucide-react';

interface City {
  id: string;
  name: string;
  state: string;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  category: string;
  base_price: number;
}

interface AdminUser {
  id: string;
  role: string;
  profile: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AdminSettingsPage() {
  const [cities, setCities] = useState<City[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'cities' | 'pricing' | 'platform' | 'admins'>('cities');

  // Add City state
  const [newCityName, setNewCityName] = useState('');
  const [newCityState, setNewCityState] = useState('');
  const [addCityLoading, setAddCityLoading] = useState(false);

  // System config state
  const [config, setConfig] = useState({
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
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchSettings = async () => {
    try {
      setRefreshing(true);
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to fetch settings');
      const data = await res.json();
      const payload = data.data || data;
      setCities(payload.cities || []);
      setServices(payload.services || []);
      setAdminUsers(payload.adminUsers || []);
      if (payload.systemConfig) setConfig(payload.systemConfig);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const loadSettings = async () => {
      try {
        setRefreshing(true);
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error('Failed to fetch settings');
        const data = await res.json();
        if (!ignore) {
          const payload = data.data || data;
          setCities(payload.cities || []);
          setServices(payload.services || []);
          setAdminUsers(payload.adminUsers || []);
          if (payload.systemConfig) setConfig(payload.systemConfig);
        }
      } catch (err: any) {
        console.error(err);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    loadSettings();
    return () => {
      ignore = true;
    };
  }, []);

  const handleToggleCity = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'TOGGLE_CITY',
          payload: { id, is_active: !currentStatus },
        }),
      });
      if (!res.ok) throw new Error('Failed to toggle city status');
      await fetchSettings();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCityName || !newCityState) return;

    try {
      setAddCityLoading(true);
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_CITY',
          payload: { name: newCityName, state: newCityState },
        }),
      });
      if (!res.ok) throw new Error('Failed to add city');
      setNewCityName('');
      setNewCityState('');
      await fetchSettings();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAddCityLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_SYSTEM_CONFIG',
          payload: config,
        }),
      });
      if (!res.ok) throw new Error('Failed to update config');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-emerald-500" />
            System Control & Operational Settings
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage operational cities, service pricing, commission rates, feature flags, and admin access control.
          </p>
        </div>

        <button
          onClick={() => fetchSettings()}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>Refresh Settings</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-900 rounded-xl p-1 gap-1 text-xs font-semibold">
        {[
          { id: 'cities', label: 'Operational Cities', icon: MapPin },
          { id: 'pricing', label: 'Service Pricing', icon: Utensils },
          { id: 'platform', label: 'Platform & Tax Rules', icon: Percent },
          { id: 'admins', label: 'Admin Users & Roles', icon: Users },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2.5 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-3 bg-slate-900 rounded-xl border border-slate-800">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-500" />
          <p className="text-sm">Loading system configurations...</p>
        </div>
      ) : (
        <>
          {/* CITIES */}
          {activeTab === 'cities' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building className="w-5 h-5 text-emerald-400" />
                  Active Service Areas ({cities.length})
                </h3>

                <div className="divide-y divide-slate-800/80">
                  {cities.map((city) => (
                    <div key={city.id} className="py-3 flex items-center justify-between text-sm">
                      <div>
                        <div className="font-semibold text-slate-100">{city.name}</div>
                        <div className="text-xs text-slate-500">{city.state}</div>
                      </div>

                      <button
                        onClick={() => handleToggleCity(city.id, city.is_active)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          city.is_active
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        {city.is_active ? (
                          <>
                            <ToggleRight className="w-4 h-4 text-emerald-400" />
                            <span>OPERATIONAL</span>
                          </>
                        ) : (
                          <>
                            <ToggleLeft className="w-4 h-4 text-slate-500" />
                            <span>DISABLED</span>
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add City Form */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  Add Operational City
                </h3>

                <form onSubmit={handleAddCity} className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-slate-400">City Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Gurugram"
                      value={newCityName}
                      onChange={(e) => setNewCityName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 mt-1 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-400">State</label>
                    <input
                      type="text"
                      placeholder="e.g. Haryana"
                      value={newCityState}
                      onChange={(e) => setNewCityState(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white placeholder-slate-500 mt-1 focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={addCityLoading}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-colors disabled:opacity-50 mt-2"
                  >
                    {addCityLoading ? 'Adding...' : 'Launch City Area'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* PRICING */}
          {activeTab === 'pricing' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                Service Catalog & Base Pricing
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-300">
                  <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Service Name</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Base Hourly Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80">
                    {services.map((srv) => (
                      <tr key={srv.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-semibold text-slate-100">{srv.name}</td>
                        <td className="py-3 px-4 text-xs text-slate-400 capitalize">{srv.category}</td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          ₹{srv.base_price}/hr
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PLATFORM & TAX RULES */}
          {activeTab === 'platform' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6 max-w-3xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Percent className="w-5 h-5 text-emerald-400" />
                  Commission & Fee Rates
                </h3>

                {saveSuccess && (
                  <span className="text-xs text-emerald-400 font-bold flex items-center gap-1 animate-pulse">
                    <CheckCircle2 className="w-4 h-4" /> Config Saved
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-400">Platform Take Rate (%)</label>
                  <input
                    type="number"
                    value={config.platformFeePercentage}
                    onChange={(e) =>
                      setConfig({ ...config, platformFeePercentage: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white mt-1 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">GST Tax Percentage (%)</label>
                  <input
                    type="number"
                    value={config.gstTaxPercentage}
                    onChange={(e) => setConfig({ ...config, gstTaxPercentage: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white mt-1 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">Customer Referral Bonus (₹)</label>
                  <input
                    type="number"
                    value={config.referralRewardCustomer}
                    onChange={(e) =>
                      setConfig({ ...config, referralRewardCustomer: parseInt(e.target.value) || 0 })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white mt-1 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-400">Cook Referral Bonus (₹)</label>
                  <input
                    type="number"
                    value={config.referralRewardCook}
                    onChange={(e) => setConfig({ ...config, referralRewardCook: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-sm text-white mt-1 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400">Cancellation Policy Rule</label>
                <textarea
                  value={config.cancellationPolicy}
                  onChange={(e) => setConfig({ ...config, cancellationPolicy: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-white mt-1 h-20 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Maintenance Mode & Feature Flags */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Feature Flags & Emergency Control
                </h4>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-white">Maintenance Mode</div>
                    <div className="text-xs text-slate-500">
                      Temporarily block new bookings for scheduled platform maintenance.
                    </div>
                  </div>

                  <button
                    onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })}
                    className={`px-3 py-1 rounded text-xs font-bold ${
                      config.maintenanceMode ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {config.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveConfig}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>Save Platform Rules</span>
              </button>
            </div>
          )}

          {/* ADMIN USERS */}
          {activeTab === 'admins' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                Registered Administrator Accounts
              </h3>

              <div className="space-y-2">
                {adminUsers.map((adm) => (
                  <div
                    key={adm.id}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-slate-100">{adm.profile?.full_name || 'Admin'}</div>
                      <div className="text-slate-500">{adm.profile?.email}</div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold uppercase text-[10px]">
                      {adm.role || 'SUPER_ADMIN'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
