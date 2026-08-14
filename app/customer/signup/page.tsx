'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { createClient } from '@/lib/supabase/client';

function CustomerSignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const { signup } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await signup({
        email,
        password,
        fullName,
        phone,
        role: 'customer',
      });

      if (res.requiresEmailConfirmation) {
        setSuccessMessage(res.message || 'Account created! Please check your email to confirm your address before logging in.');
      } else {
        router.push(redirect);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create customer account');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
      setError(err.message || 'Google signup failed. Please verify Supabase OAuth setup.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--paper)]">
      <header className="site-header" style={{ position: 'relative', background: '#fff', borderBottom: '1px solid var(--line)' }}>
        <div className="wrap flex items-center h-[78px]">
          <Link href="/" className="logo text-[#0F1736] font-bold text-2xl flex items-center gap-1">
            <span className="text-[#2E46E0]">Ti</span>zl
          </Link>
          <span className="ml-4 pl-4 border-l border-gray-200 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Customer Sign Up
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
            Create Customer Account
          </h2>
          <p className="mt-2 text-center text-sm text-[var(--text-dim)]">
            Already have an account?{' '}
            <Link href={`/customer/login?redirect=${encodeURIComponent(redirect)}`} className="font-semibold text-[var(--blue)] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-sm rounded-2xl border border-[var(--line)] sm:px-10">
            {error && (
              <div className="mb-5 bg-red-50 text-red-700 p-3.5 rounded-xl text-sm border border-red-200">
                {error}
              </div>
            )}

            {successMessage ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[var(--blue)] flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-[var(--ink)] mb-2">Check Your Email</h3>
                <p className="text-sm text-[var(--text-dim)] mb-6">{successMessage}</p>
                <Link
                  href="/customer/login"
                  className="inline-block w-full py-3 px-4 rounded-full text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--blue)] transition"
                >
                  Return to Sign In
                </Link>
              </div>
            ) : (
              <>
                <form className="space-y-4" onSubmit={handleSignup}>
                  <div>
                    <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                      Full Name
                    </label>
                    <input
                      id="fullName"
                      name="fullName"
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Aisha Khan"
                      className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                    />
                  </div>

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
                      className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile number (optional)"
                      className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wider text-[var(--text-dim)] mb-1 font-mono">
                      Confirm Password
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full px-4 py-2.5 border border-[var(--line)] rounded-xl bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:border-[var(--blue)] focus:bg-white text-sm"
                    />
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center py-3.5 px-4 rounded-full text-sm font-semibold text-white bg-[var(--ink)] hover:bg-[var(--blue)] transition duration-150 disabled:opacity-50 shadow-sm cursor-pointer"
                    >
                      {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                  </div>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-[var(--line)]" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-[var(--text-faint)] font-mono">
                        Or sign up with
                      </span>
                    </div>
                  </div>

                  <div className="mt-6">
                    <button
                      type="button"
                      onClick={handleGoogleSignup}
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
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function CustomerSignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">Loading...</div>}>
      <CustomerSignupContent />
    </Suspense>
  );
}
