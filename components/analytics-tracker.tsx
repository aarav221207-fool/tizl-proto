'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem('tizl_analytics_sid');
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      sessionStorage.setItem('tizl_analytics_sid', sid);
    }
    return sid;
  } catch {
    return 'sid_' + Math.random().toString(36).substring(2, 15);
  }
}

function getOrCreateAnonymousId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let aid = localStorage.getItem('tizl_analytics_aid');
    if (!aid) {
      aid = 'aid_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
      localStorage.setItem('tizl_analytics_aid', aid);
    }
    return aid;
  } catch {
    return 'aid_' + Math.random().toString(36).substring(2, 15);
  }
}

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

export function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const fullPath = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname;

    if (lastTrackedPath.current === fullPath) {
      return;
    }
    lastTrackedPath.current = fullPath;

    // Dispatch page view asynchronously without blocking UI
    const payload = {
      event_name: 'page_view',
      profile_id: user?.id || null,
      event_data: {
        path: pathname,
        full_path: fullPath,
        referrer: typeof document !== 'undefined' ? document.referrer : '',
        title: typeof document !== 'undefined' ? document.title : '',
        device_type: getDeviceType(),
        screen: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
        session_id: getOrCreateSessionId(),
        anonymous_id: getOrCreateAnonymousId(),
      },
    };

    fetch('/api/analytics/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch((err) => {
      // Analytics failures should fail silently on the client
      console.debug('Analytics tracking skipped:', err);
    });
  }, [pathname, searchParams, user?.id]);

  return null;
}
