'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    let appendedScript: HTMLScriptElement | null = null;

    // Fetch and hydrate body HTML from static asset with cache buster
    fetch('/tizl-body.html?v=3.0')
      .then((res) => res.text())
      .then((html) => {
        if (active && containerRef.current) {
          containerRef.current.innerHTML = html;

          // Dynamically load tizl-app.js once HTML is mounted
          const script = document.createElement('script');
          script.src = '/tizl-app.js?v=3.0';
          script.async = true;
          document.body.appendChild(script);
          appendedScript = script;
        }
      })
      .catch((err) => {
        console.error('Failed to load Tizl landing page:', err);
      });

    return () => {
      active = false;
      if (typeof window !== 'undefined' && typeof (window as any).__cleanupTizlPhone === 'function') {
        (window as any).__cleanupTizlPhone();
      }
      if (appendedScript && appendedScript.parentNode) {
        appendedScript.parentNode.removeChild(appendedScript);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="tizl-root min-h-screen">
      {/* Fallback skeleton while static shell hydrates */}
      <div className="flex items-center justify-center min-h-screen bg-[#FAF8F5]">
        <div className="text-center p-8">
          <div className="w-12 h-12 rounded-full border-4 border-[#2B4C7E]/20 border-t-[#2B4C7E] animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold font-serif text-[#1F2421]">Tizl</h2>
          <p className="text-sm text-[#606862] mt-1">A verified home cook at your doorstep in 10 minutes...</p>
        </div>
      </div>
    </div>
  );
}
