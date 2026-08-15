'use client';

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  CalendarCheck,
  Users,
  ChefHat,
  CreditCard,
  Star,
  Layers,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ExportOption {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  fields: string[];
}

const EXPORT_DATASETS: ExportOption[] = [
  {
    id: 'bookings',
    name: 'Bookings Ledger',
    description: 'Complete booking lifecycle data, amounts, addresses, service details, and statuses.',
    icon: CalendarCheck,
    color: 'emerald',
    fields: ['Booking ID', 'Customer', 'Cook', 'Service', 'Date & Time', 'Amount', 'Status', 'Address'],
  },
  {
    id: 'customers',
    name: 'Customers Directory',
    description: 'Customer profiles, contact numbers, dietary preferences, and registration history.',
    icon: Users,
    color: 'blue',
    fields: ['Customer ID', 'Full Name', 'Email', 'Phone', 'Dietary Preferences', 'Allergies', 'Joined Date'],
  },
  {
    id: 'cooks',
    name: 'Cooks & Verification',
    description: 'Verified cook partner roster, specialities, hourly rates, and police verification.',
    icon: ChefHat,
    color: 'amber',
    fields: ['Cook ID', 'Full Name', 'Phone', 'Specialities', 'Hourly Rate', 'Verification Status', 'Rating'],
  },
  {
    id: 'payments',
    name: 'Payment Settlements',
    description: 'Transaction logs, Paytm order IDs, bank transaction references, and settlement amounts.',
    icon: CreditCard,
    color: 'purple',
    fields: ['Payment ID', 'Order ID', 'Bank Txn ID', 'Amount', 'Method', 'Provider', 'Status', 'Timestamp'],
  },
  {
    id: 'reviews',
    name: 'Customer Reviews',
    description: 'Ratings, feedback comments, and quality metrics across all completed bookings.',
    icon: Star,
    color: 'amber',
    fields: ['Review ID', 'Booking ID', 'Customer', 'Cook', 'Rating (1-5)', 'Comment', 'Date'],
  },
  {
    id: 'services',
    name: 'Service Catalog',
    description: 'Active menu offerings, categories, base prices, and duration configurations.',
    icon: Layers,
    color: 'indigo',
    fields: ['Service ID', 'Name', 'Category', 'Base Price', 'Estimated Duration'],
  },
];

export default function AdminExportCenterPage() {
  const [selectedType, setSelectedType] = useState<string>('bookings');
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);
  const [lastExportStatus, setLastExportStatus] = useState<string | null>(null);

  const handleTriggerExport = () => {
    setIsExporting(true);
    setLastExportStatus(null);

    const params = new URLSearchParams();
    params.set('type', selectedType);
    params.set('format', selectedFormat);

    if (startDate) params.set('startDate', startDate);
    if (endDate) params.set('endDate', endDate);
    if (statusFilter !== 'all') params.set('status', statusFilter);

    const exportUrl = `/api/admin/export?${params.toString()}`;

    // Open download in new window/tab or trigger direct download
    const link = document.createElement('a');
    link.href = exportUrl;
    link.download = `tizl_${selectedType}_${new Date().toISOString().split('T')[0]}.${selectedFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setIsExporting(false);
      setLastExportStatus(`Export initiated for ${selectedType.toUpperCase()} in .${selectedFormat.toUpperCase()} format.`);
    }, 1200);
  };

  const activeDataset = EXPORT_DATASETS.find((d) => d.id === selectedType) || EXPORT_DATASETS[0];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Export Center</h1>
        <p className="text-sm text-slate-500 mt-1">
          Export verified platform ledgers, user directories, transaction summaries, and audit records into Excel or CSV.
        </p>
      </div>

      {lastExportStatus && (
        <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-3 animate-in fade-in duration-150">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-medium">{lastExportStatus}</span>
        </div>
      )}

      {/* Dataset Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {EXPORT_DATASETS.map((dataset) => {
          const Icon = dataset.icon;
          const isSelected = selectedType === dataset.id;

          return (
            <button
              key={dataset.id}
              onClick={() => setSelectedType(dataset.id)}
              className={`text-left p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                  : 'border-slate-200 bg-white hover:border-slate-300 text-slate-900 shadow-sm'
              }`}
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div
                    className={`p-2.5 rounded-xl ${
                      isSelected ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800">
                      Selected
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-base">{dataset.name}</h3>
                <p className={`text-xs leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                  {dataset.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-1">
                {dataset.fields.slice(0, 4).map((f) => (
                  <span
                    key={f}
                    className={`text-[10px] px-2 py-0.5 rounded ${
                      isSelected ? 'bg-white/10 text-slate-300' : 'bg-slate-50 text-slate-500 border border-slate-100'
                    }`}
                  >
                    {f}
                  </span>
                ))}
                {dataset.fields.length > 4 && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                      isSelected ? 'bg-white/10 text-slate-400' : 'text-slate-400'
                    }`}
                  >
                    +{dataset.fields.length - 4} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Export Configuration Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-slate-700" />
            Configure Export: {activeDataset.name}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Specify format, date filters, and status constraints for the generated file.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Format Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">File Format</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('xlsx')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                  selectedFormat === 'xlsx'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                Excel (.xlsx)
              </button>
              <button
                type="button"
                onClick={() => setSelectedFormat('csv')}
                className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all text-center ${
                  selectedFormat === 'csv'
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                CSV (.csv)
              </button>
            </div>
          </div>

          {/* Start Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-700"
            />
          </div>

          {/* End Date */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-700"
            />
          </div>

          {/* Status Constraint (if relevant) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase">Status Filter</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white text-slate-700"
            >
              <option value="all">All Records</option>
              <option value="completed">Completed / Paid</option>
              <option value="accepted">Accepted / In Progress</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Export Button CTA */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-slate-400" />
            Exports query directly from authorized Supabase tables with real-time audit logging.
          </div>
          <button
            onClick={handleTriggerExport}
            disabled={isExporting}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download {activeDataset.name} (.{selectedFormat.toUpperCase()})
          </button>
        </div>
      </div>
    </div>
  );
}
