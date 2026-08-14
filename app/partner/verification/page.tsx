'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function PartnerVerificationPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isVerifying, setIsVerifying] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/partner/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handleDigiLockerAuth = async () => {
    setIsVerifying(true);
    setStatusMessage(null);
    setIsError(false);

    try {
      const res = await fetch('/api/partner/verify', { method: 'POST' });
      const json = await res.json();

      if (res.ok && json.success && json.redirectUrl) {
        window.location.href = json.redirectUrl;
      } else {
        setIsError(true);
        setStatusMessage(json.error || 'DigiLocker integration requires provider API credentials to be configured.');
      }
    } catch (err: any) {
      setIsError(true);
      setStatusMessage(err.message || 'Failed to initiate verification.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="site-header" style={{ position: 'relative', background: '#fff', borderBottom: '1px solid #eee' }}>
        <div className="wrap flex items-center h-[70px]">
          <Link href="/" className="logo text-[#0F1736] font-bold text-2xl flex items-center gap-1">
            <span className="text-[#1D53DC]">Ti</span>Zl
          </Link>
          <span className="ml-4 pl-4 border-l border-gray-200 text-sm font-semibold text-gray-500 uppercase tracking-wider">
            Partner Verification
          </span>
          <div className="ml-auto">
            <Link href="/partner/dashboard" className="text-sm font-medium text-gray-500 hover:text-gray-900">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full bg-white shadow sm:rounded-lg border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Identity Verification</h2>
          <p className="text-sm text-gray-500 mb-8">
            Status: <span className="font-semibold text-yellow-600 bg-yellow-50 px-2 py-1 rounded">Pending verification</span>
          </p>

          {statusMessage && (
            <div className={`mb-6 p-4 rounded text-xs text-left ${isError ? 'bg-amber-50 border border-amber-200 text-amber-900' : 'bg-blue-50 text-blue-900'}`}>
              <p className="font-semibold mb-1">{isError ? 'Provider Configuration Required' : 'Status Update'}</p>
              <p>{statusMessage}</p>
            </div>
          )}

          <div className="text-left bg-gray-50 p-4 rounded-md mb-8 text-sm text-gray-600">
            <p className="mb-2">To start accepting cooking jobs on Tizl, you must verify your identity via Aadhaar.</p>
            <p>We use DigiLocker to securely fetch your Aadhaar details.</p>
          </div>

          <button
            onClick={handleDigiLockerAuth}
            disabled={isVerifying}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#0F1736] hover:bg-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0F1736] disabled:opacity-70"
          >
            {isVerifying ? 'Connecting to Provider...' : 'Verify with DigiLocker'}
          </button>
          
          <p className="mt-4 text-xs text-gray-400">
            * Identity verification is securely powered by the authorized Government of India DigiLocker / Aadhaar gateway.
          </p>
        </div>
      </main>
    </div>
  );
}
