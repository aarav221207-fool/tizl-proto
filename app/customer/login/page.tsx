'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';

function CustomerLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const urlError = searchParams.get('error');

  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(urlError || '');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user?.role === 'cook') {
        await logout();
        setError('This account is registered as a Partner Cook. Please sign in through the Partner Portal.');
        return;
      }
      if (user?.role === 'admin') {
        router.push('/admin/dashboard');
        return;
      }
      router.push(redirect);
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirect)}&role=customer`,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please verify Supabase OAuth setup.');
      setLoading(false);
    }
  };

  const displayError = error || urlError || '';

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)]">
      <header className="site-header" style={{ position: 'relative', background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap flex items-center h-[78px]">
          <Link href="/" className="logo text-[#0F1736] font-bold text-2xl flex items-center gap-1">
            <span className="text-[#2E46E0]">Ti</span>zl
          </Link>
          <span className="ml-4 pl-4 border-l border-gray-200 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Customer Login
          </span>
          <div className="ml-auto">
            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-bold text-[var(--ink)]">
            Sign in to Book a Cook
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--text-dim)]">
            Or{' '}
            <Link href={`/customer/signup?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-[var(--blue)] hover:underline">
              create a customer account
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[var(--line)] sm:px-10">
            {displayError && (
              <div className="mb-5 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-200">
                {displayError}
              </div>
            )}
            <form className="space-y-5" onSubmit={handleLogin}>
              <div>
                <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] font-mono">
                    Password
                  </label>
                  <Link href="/forgot-password" className="text-xs text-[var(--blue)] hover:underline font-medium">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 rounded-full text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--blue)] transition duration-150 disabled:opacity-50 shadow-sm cursor-pointer"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[var(--line)]" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-[var(--text-faint)] font-mono">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-[var(--line-strong)] rounded-full text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface)] transition duration-150 cursor-pointer"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google</span>
                </button>
              </div>
            </div>

            <div className="mt-6 text-center text-xs text-[var(--text-faint)]">
              Are you a chef or cook? <Link href="/partner/login" className="text-[var(--blue)] font-semibold hover:underline">Partner Portal Sign In →</Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CustomerLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">Loading...</div>}>
      <CustomerLoginContent />
    </Suspense>
  );
}
