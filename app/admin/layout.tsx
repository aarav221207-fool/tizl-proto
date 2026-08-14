'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Users,
  UserCheck,
  CreditCard,
  Star,
  BarChart3,
  ShieldAlert,
  FileSpreadsheet,
  Settings,
  ShieldCheck,
  ArrowLeft,
  UserCog,
  LogOut,
  Lock,
  AlertTriangle,
} from 'lucide-react';

interface AdminUserInfo {
  id: string;
  email: string | null;
  fullName: string | null;
  designation: 'super_admin' | 'admin' | 'support';
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Bookings', href: '/admin/bookings', icon: CalendarCheck },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Cook Verification', href: '/admin/cooks', icon: UserCheck },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Reviews', href: '/admin/reviews', icon: Star },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
  { name: 'Export Center', href: '/admin/export', icon: FileSpreadsheet },
  { name: 'Admin Users', href: '/admin/admins', icon: UserCog },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Exclude login route from layout wrapper and auth checks
  const isLoginPage = pathname === '/admin/login';

  const [adminUser, setAdminUser] = useState<AdminUserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(!isLoginPage);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    if (isLoginPage) {
      return;
    }

    let isMounted = true;
    async function verifyAdminAuth() {
      try {
        const res = await fetch('/api/admin/me');
        const json = await res.json();

        if (isMounted) {
          if (res.status === 401) {
            // Not authenticated -> redirect to /admin/login
            router.replace('/admin/login');
            return;
          }

          if (res.status === 403 || !json.success) {
            // Authenticated but not an administrator
            setIsUnauthorized(true);
            setAdminUser(null);
            return;
          }

          if (json.data?.user) {
            setAdminUser(json.data.user);
            setIsUnauthorized(false);
          }
        }
      } catch {
        if (isMounted) {
          setIsUnauthorized(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    verifyAdminAuth();
    return () => {
      isMounted = false;
    };
  }, [pathname, isLoginPage, router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Ignore
    }
    router.push('/admin/login');
  };

  // If on /admin/login page, render children directly without admin layout wrapper
  if (isLoginPage) {
    return (
      <>
        <head>
          <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        </head>
        {children}
      </>
    );
  }

  // Loading state during authorization verification
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <head>
          <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        </head>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            Verifying Tizl Ops security credentials...
          </p>
        </div>
      </div>
    );
  }

  // Custom 403 Forbidden Access Denied screen for non-admin accounts
  if (isUnauthorized) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans relative overflow-hidden">
        <head>
          <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
        </head>
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center space-y-5 shadow-2xl relative z-10">
          <div className="inline-flex p-4 bg-rose-500/10 text-rose-400 rounded-2xl border border-rose-500/20">
            <Lock className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-white">403 — Access Forbidden</h1>
            <p className="text-xs text-slate-400">
              Your account does not possess administrator credentials to access the Tizl Ops Center.
            </p>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-[11px] text-slate-400 text-left flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              If you believe this is an error, please contact a Super Admin or request staff permissions from your system administrator.
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/admin/login"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-colors text-center shadow-md"
            >
              Log in as Admin
            </Link>
            <Link
              href="/"
              className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition-colors text-center"
            >
              Return Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const getDesignationBadge = (designation?: string) => {
    switch (designation) {
      case 'super_admin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
            Super Admin
          </span>
        );
      case 'admin':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
            Ops Admin
          </span>
        );
      case 'support':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            Support
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
            Admin
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row font-sans">
      <head>
        <meta name="robots" content="noindex, nofollow, noarchive, nosnippet" />
      </head>

      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Header Branding */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white leading-tight">Tizl Ops</h1>
                <p className="text-xs text-slate-400">Admin Operations Center</p>
              </div>
            </div>
          </div>

          {/* User Profile Badge */}
          {adminUser && (
            <div className="p-3 mx-3 my-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">
                  {adminUser.fullName || adminUser.email}
                </div>
                <div className="mt-1">{getDesignationBadge(adminUser.designation)}</div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Nav List */}
          <nav className="p-3 space-y-1">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to main site</span>
          </Link>
          <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live DB Sync
            </span>
            <span className="text-slate-500 font-mono">v1.0.0</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-slate-950 p-4 md:p-8 overflow-y-auto">{children}</main>
    </div>
  );
}
