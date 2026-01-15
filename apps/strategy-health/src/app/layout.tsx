import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { TooltipProvider } from '@aegisciso/ui';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'AegisCISO - Strategy Health',
  description: 'Security strategy objectives and KPIs',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
