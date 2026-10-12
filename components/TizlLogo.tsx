'use client';

import React from 'react';

interface TizlLogoProps {
  height?: number | string;
  className?: string;
  variant?: 'dark' | 'light';
  ariaLabel?: string;
}

export function TizlLogo({
  height = 36,
  className = '',
  variant = 'dark',
  ariaLabel = 'Tizl — A home cook at your doorstep in 10 minutes',
}: TizlLogoProps) {
  const h = typeof height === 'number' ? `${height}px` : height;

  return (
    <img
      src="/assets/tizl-header-logo.png"
      alt={ariaLabel}
      className={`tizl-brand-logo ${className}`}
      style={{
        height: h,
        width: 'auto',
        display: 'inline-block',
        verticalAlign: 'middle',
      }}
    />
  );
}
