import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { SessionProvider } from 'next-auth/react';
import { ThemeProvider } from '@/context/ThemeContext';
import { CursorGlow } from '@/components/ui/CursorGlow';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Code Review AI',
  description: 'AI-powered platform for code review and developer feedback.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ThemeProvider>
          <SessionProvider>
            <LoadingScreen />
            <CursorGlow />
            {children}
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
