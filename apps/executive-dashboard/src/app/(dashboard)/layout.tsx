import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Header } from '@/components/layout/header';
import { MainTabs, MainTabsMobile } from '@/components/layout/main-tabs';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header with SABIC branding */}
      <Header user={session.user!} />

      {/* Tab Navigation - Desktop */}
      <div className="hidden sm:block">
        <MainTabs />
      </div>

      {/* Tab Navigation - Mobile */}
      <MainTabsMobile />

      {/* Main Content Area */}
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-card py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>SABIC AI Cybersecurity Director v1.0.0</p>
            <p>Sovereign AI - Local processing available with Ollama</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
