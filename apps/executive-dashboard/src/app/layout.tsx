import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/auth-provider';
import { TooltipProvider } from '@aegisciso/ui';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'SABIC AI Cybersecurity Director',
  description: 'Enterprise AI-powered cybersecurity governance, risk, and compliance platform',
  keywords: ['cybersecurity', 'GRC', 'CISO', 'AI', 'SABIC', 'compliance', 'risk management'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className={`${inter.className} min-h-screen bg-background`}>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            {children}
          </TooltipProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
