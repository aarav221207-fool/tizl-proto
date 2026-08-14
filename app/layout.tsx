import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/auth-context';

export const metadata: Metadata = {
  metadataBase: new URL('https://tizl.in'),
  title: 'Tizl — Book a Cook in 10 Minutes',
  description: 'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Tizl — Book a Cook in 10 Minutes',
    description: 'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
    type: 'website',
    url: 'https://tizl.in',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tizl — Book a Cook in 10 Minutes',
    description: 'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

