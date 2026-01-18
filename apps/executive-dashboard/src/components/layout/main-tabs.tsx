'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@aegisciso/ui';
import {
  LayoutDashboard,
  Brain,
  FileText,
  AlertTriangle,
  Target,
} from 'lucide-react';

const tabs = [
  {
    name: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    description: 'Security posture overview',
  },
  {
    name: 'AI Director',
    href: '/ai-director',
    icon: Brain,
    description: 'AI-powered security advisor',
  },
  {
    name: 'Policies',
    href: '/policies',
    icon: FileText,
    description: 'Policy management & compliance',
  },
  {
    name: 'Risks',
    href: '/risks',
    icon: AlertTriangle,
    description: 'Risk monitoring & remediation',
  },
  {
    name: 'Strategy',
    href: '/objectives',
    icon: Target,
    description: 'Strategic objectives & KPIs',
  },
];

export function MainTabs() {
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname === '/') return '/';
    const matchedTab = tabs.find(
      (tab) => tab.href !== '/' && pathname.startsWith(tab.href)
    );
    return matchedTab?.href || '/';
  };

  const activeTab = getActiveTab();

  return (
    <nav className="border-b border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-12">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  'relative flex items-center gap-2 px-5 text-sm font-medium transition-all duration-200',
                  'hover:text-[#0047AF]',
                  isActive
                    ? 'text-[#0047AF]'
                    : 'text-gray-500'
                )}
              >
                <tab.icon className={cn(
                  'h-4 w-4',
                  isActive ? 'text-[#0047AF]' : 'text-gray-400'
                )} />
                <span className="hidden sm:inline">{tab.name}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#0047AF]" />
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// Mobile version with dropdown
export function MainTabsMobile() {
  const pathname = usePathname();

  const getCurrentTab = () => {
    if (pathname === '/') return tabs[0];
    return tabs.find((tab) => tab.href !== '/' && pathname.startsWith(tab.href)) || tabs[0];
  };

  const currentTab = getCurrentTab();

  return (
    <div className="sm:hidden border-b border-gray-100 bg-white p-2">
      <div className="grid grid-cols-5 gap-1">
        {tabs.map((tab) => {
          const isActive = currentTab.href === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-colors',
                isActive
                  ? 'bg-[#0047AF] text-white'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span className="truncate max-w-full">{tab.name.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
