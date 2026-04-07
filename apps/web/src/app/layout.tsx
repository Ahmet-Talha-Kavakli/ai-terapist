import type { Metadata } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AI Therapist — Your Personal AI Therapy Companion',
  description:
    'Real-time AI therapy sessions with advanced emotional intelligence. Private, personalized, always available.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.className} h-full antialiased`}>
        <body className="min-h-full bg-gray-950 text-white">{children}</body>
      </html>
    </ClerkProvider>
  );
}
