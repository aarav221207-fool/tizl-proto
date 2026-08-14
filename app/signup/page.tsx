'use client';

import React, { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function SignupRedirectContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = searchParams.toString();
    const target = params ? `/customer/signup?${params}` : '/customer/signup';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--paper)] text-[var(--ink)]">
      <div className="text-center p-8 bg-white border border-[var(--line)] rounded-2xl shadow-sm max-w-md">
        <p className="text-base font-semibold mb-2">Redirecting to Customer Sign Up...</p>
        <p className="text-xs text-[var(--text-dim)] mb-4">If you are not redirected automatically, please click below.</p>
        <Link
          href={`/customer/signup?${searchParams.toString()}`}
          className="inline-block px-5 py-2.5 bg-[var(--ink)] text-white text-sm font-semibold rounded-full hover:bg-[var(--blue)] transition"
        >
          Go to Sign Up →
        </Link>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[var(--paper)]">Loading...</div>}>
      <SignupRedirectContent />
    </Suspense>
  );
}
