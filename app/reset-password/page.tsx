'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const router = useRouter();

  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match');
      return;
    }

    setStatus('loading');
    
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus('error');
      setMessage(error.message);
    } else {
      setStatus('success');
      setMessage('Password updated successfully. You can now log in.');
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)] p-4">
      <div className="w-full max-w-md bg-white border border-[var(--line)] rounded-[var(--radius)] shadow-[var(--shadow)] p-8">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block text-2xl font-bold font-['Space_Grotesk'] tracking-tight mb-2">Tizl</Link>
          <h1 className="text-xl font-bold text-[var(--ink)]">Update Password</h1>
          <p className="text-[var(--text-dim)] text-sm mt-1">Enter your new password below.</p>
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
              <label className="block text-sm font-medium text-[var(--ink)] mb-1">New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--surface)] border border-transparent focus:border-[var(--blue)] focus:bg-white rounded-xl text-sm transition-colors outline-none"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--ink)] mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[var(--surface)] border border-transparent focus:border-[var(--blue)] focus:bg-white rounded-xl text-sm transition-colors outline-none"
                placeholder="••••••••"
              />
            </div>
            
            <button
              type="submit"
              disabled={status === 'loading'}
              className="btn btn-primary w-full mt-2"
            >
              {status === 'loading' ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
