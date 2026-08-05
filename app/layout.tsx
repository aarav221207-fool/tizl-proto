import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tizl — Book a Cook in 10 Minutes',
  description: 'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
  openGraph: {
    title: 'Tizl — Book a Cook in 10 Minutes',
    description: 'Book a verified home cook in as little as 10 minutes. Tizl connects households with trusted cooks for breakfast, lunch, dinner, parties, and weekly meal services.',
    type: 'website',
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
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}

