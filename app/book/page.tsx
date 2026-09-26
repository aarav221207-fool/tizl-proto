'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

function BookContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const params = new URLSearchParams(searchParams.toString());
      params.set('book', 'true');
      const queryString = params.toString();

      if (!isAuthenticated) {
        router.push(`/customer/login?redirect=${encodeURIComponent(`/?${queryString}`)}`);
      } else {
        router.push(`/?${queryString}`);
      }
    }
  }, [isLoading, isAuthenticated, router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#1D53DC] mx-auto mb-4"></div>
        <h2 className="text-lg font-bold text-[var(--ink)] mb-1">Connecting to Tizl booking engine...</h2>
        <p className="text-sm text-[var(--text-dim)] font-medium">Matching available cooks in your area</p>
      </div>
    </div>
  );
}

export default function BookPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">
        <div className="text-sm font-medium text-[var(--text-dim)]">Loading booking...</div>
      </div>
    }>
      <BookContent />
    </Suspense>
  );
}
