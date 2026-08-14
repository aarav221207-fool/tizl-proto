'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Download,
  ShieldAlert,
  User,
  Clock,
  Database,
  ChevronRight,
  Eye,
  X,
} from 'lucide-react';

interface AuditLogItem {
  id: string;
  profile_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_data: any;
  new_data: any;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
  } | null;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);

  const fetchAuditLogs = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (actionFilter !== 'all') params.set('action', actionFilter);

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch audit logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    const loadLogs = async () => {
      try {
        setRefreshing(true);
        const params = new URLSearchParams();
        if (actionFilter !== 'all') params.set('action', actionFilter);

        const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch audit logs');
        const data = await res.json();
        if (!ignore) setLogs(data.logs || []);
      } catch (err: any) {
        console.error(err);
      } finally {
        if (!ignore) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    };
    loadLogs();
    return () => {
      ignore = true;
    };
  }, [actionFilter]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const actionMatch = log.action?.toLowerCase().includes(term);
        const recordMatch = log.record_id?.toLowerCase().includes(term);
        const adminMatch = log.profile?.full_name?.toLowerCase().includes(term);
        if (!actionMatch && !recordMatch && !adminMatch) return false;
      }
      return true;
    });
  }, [logs, searchTerm]);

  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((l) => set.add(l.action));
    return Array.from(set);
  }, [logs]);

  const exportAuditLogsCSV = () => {
    const headers = ['Timestamp', 'Action', 'Admin', 'Table', 'Record ID', 'New Data'];
    const rows = filteredLogs.map((l) => [
      l.created_at,
      l.action,
      l.profile?.full_name || 'System',
      l.table_name,
      l.record_id || '',
      JSON.stringify(l.new_data || {}).replace(/"/g, '""'),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="w-7 h-7 text-amber-500" />
            Immutable Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Complete, security-hardened log of all administrator actions, overrides, and verification changes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAuditLogs()}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium rounded-lg border border-slate-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={exportAuditLogsCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 text-sm font-semibold rounded-lg shadow transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by action name, admin user, or record ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
            >
              <option value="all">Filter Action: All ({uniqueActions.length})</option>
              {uniqueActions.map((act) => (
                <option key={act} value={act}>
                  {act}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400 pt-2 border-t border-slate-800/80">
          Showing <span className="text-white font-semibold">{filteredLogs.length}</span> recorded security events
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500" />
            <p className="text-sm">Fetching immutable audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <ShieldAlert className="w-10 h-10 mx-auto text-slate-600" />
            <h3 className="text-base font-semibold text-slate-200">No Audit Logs Match</h3>
            <p className="text-xs text-slate-500">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-950 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Admin Operator</th>
                  <th className="py-3 px-4">Target Record ID</th>
                  <th className="py-3 px-4 text-right">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors font-mono text-xs">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded font-bold">
                        {log.action}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-sans text-slate-200">
                      {log.profile?.full_name || 'System Automated'}
                    </td>

                    <td className="py-3 px-4 text-slate-400">{log.record_id || 'N/A'}</td>

                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-sans rounded border border-slate-700 transition-colors inline-flex items-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5 text-amber-400" />
                        <span>View Details</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-xl w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Audit Record Payload
              </h3>

              <button
                onClick={() => setSelectedLog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-950 rounded-lg">
                <div>
                  <span className="text-slate-500">Action:</span>
                  <div className="font-bold text-amber-400">{selectedLog.action}</div>
                </div>
                <div>
                  <span className="text-slate-500">Timestamp:</span>
                  <div className="text-slate-200">{new Date(selectedLog.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <span className="text-slate-500">Admin Operator:</span>
                  <div className="text-slate-200 font-semibold">{selectedLog.profile?.full_name || 'System'}</div>
                </div>
                <div>
                  <span className="text-slate-500">Target Record ID:</span>
                  <div className="text-slate-200 font-mono">{selectedLog.record_id || 'N/A'}</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="font-semibold text-slate-300">New / Modified State:</div>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-emerald-400 overflow-x-auto font-mono">
                  {JSON.stringify(selectedLog.new_data, null, 2)}
                </pre>
              </div>

              {selectedLog.old_data && (
                <div className="space-y-1">
                  <div className="font-semibold text-slate-300">Previous State:</div>
                  <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] text-rose-400 overflow-x-auto font-mono">
                    {JSON.stringify(selectedLog.old_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
