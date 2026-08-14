'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage('Check your email for the password reset link.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] p-4">
      <div className="w-full max-w-md bg-white border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-bold font-['Space_Grotesk'] tracking-tight mb-2">Tizl</Link>
          <h1 className="text-xl font-bold text-[var(--ink)]">Reset Password</h1>
          <p className="text-[var(--text-dim)] text-sm mt-1">Enter your email and we&apos;ll send you a reset link.</p>
        </div>

        {status === 'error' && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm text-center">
            {message}
          </div>
        )}
        
        {status === 'success' && (
          <div className="mb-6 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm text-center">
            {message}
          </div>
        )}

        {status !== 'success' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--surface)] border border-transparent focus:border-[var(--blue)] focus:bg-white rounded-xl text-sm transition-colors outline-none"
                placeholder="you@example.com"
              />
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn btn-primary w-full mt-2"
            >
              {status === 'loading' ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-[var(--text-dim)] mt-8">
          Remember your password? <Link href="/login" className="text-[var(--blue)] font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
