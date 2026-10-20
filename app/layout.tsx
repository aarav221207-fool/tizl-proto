import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';
import { AnalyticsTracker } from '@/components/analytics-tracker';

export const metadata: Metadata = {
  metadataBase: new URL('https://tizl.in'),
  title: 'Tizl — A home cook at your doorstep in 10 minutes.',
  description:
    'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
  alternates: {
    canonical: 'https://tizl.in',
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  openGraph: {
    title: 'Tizl — Book a Cook in 10 Minutes',
    description:
      'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
    type: 'website',
    url: 'https://tizl.in',
    siteName: 'Tizl',
    images: [
      {
        url: '/assets/hero-cook.png',
        width: 1200,
        height: 630,
        alt: 'Tizl — Book a Cook in 10 Minutes',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tizl — Book a Cook in 10 Minutes',
    description:
      'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
    images: ['/assets/hero-cook.png'],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Tizl',
    url: 'https://tizl.in',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://tizl.in/book',
      'query-input': 'required name=search_term_string',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tizl',
      url: 'https://tizl.in',
    },
  };

  const isProduction = process.env.PAYTM_ENVIRONMENT === 'production';
  const paytmMid = process.env.PAYTM_MID || 'DEFAULT';
  const paytmJsUrl = isProduction
    ? `https://securegw.paytm.in/merchantpgpui/checkoutjs/merchants/${paytmMid}.js`
    : `https://securegw-stage.paytm.in/merchantpgpui/checkoutjs/merchants/${paytmMid}.js`;

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,440..600;1,9..144,440..600&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link rel="stylesheet" href="/tizl-design.css" />
        {/* Paytm Payment Gateway JS Checkout SDK (Environment-aware) */}
        <script type="application/javascript" src={paytmJsUrl} crossOrigin="anonymous" async />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body suppressHydrationWarning>
        <AuthProvider>
          <Suspense fallback={null}>
            <AnalyticsTracker />
          </Suspense>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
