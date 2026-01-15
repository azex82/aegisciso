'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@aegisciso/ui';
import { AlertTriangle, LayoutGrid, ShieldAlert, FileWarning, CheckCircle, FileCheck, Settings, HelpCircle } from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutGrid },
  { name: 'Risks', href: '/risks', icon: ShieldAlert },
  { name: 'Findings', href: '/findings', icon: FileWarning },
  { name: 'Exceptions', href: '/exceptions', icon: CheckCircle },
  { name: 'Controls', href: '/controls', icon: FileCheck },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex lg:flex-shrink-0">
      <div className="flex w-64 flex-col">
        <div className="flex min-h-0 flex-1 flex-col border-r bg-card">
          <div className="flex flex-1 flex-col overflow-y-auto pt-5 pb-4">
            <div className="flex flex-shrink-0 items-center px-4">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <span className="ml-2 text-xl font-bold">Risk Hub</span>
            </div>
            <nav className="mt-8 flex-1 space-y-1 px-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link key={item.name} href={item.href} className={cn('group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground')}>
                    <item.icon className={cn('mr-3 h-5 w-5 flex-shrink-0', isActive ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground')} />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
            <nav className="mt-auto space-y-1 px-2 pb-4">
              <Link href="/settings" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <Settings className="mr-3 h-5 w-5" />Settings
              </Link>
              <Link href="/help" className="group flex items-center px-3 py-2 text-sm font-medium rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <HelpCircle className="mr-3 h-5 w-5" />Help
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
