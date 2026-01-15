'use client';
import { signOut } from 'next-auth/react';
import { Avatar, AvatarFallback, Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@aegisciso/ui';
import { Bell, LogOut, User, Settings } from 'lucide-react';

interface HeaderProps { user: { name?: string | null; email?: string | null } }

export function Header({ user }: HeaderProps) {
  const initials = user.name?.split(' ').map((n) => n[0]).join('').toUpperCase() || 'U';
  return (
    <header className="border-b bg-card">
      <div className="flex h-16 items-center justify-between px-6">
        <div>
          <h1 className="text-lg font-semibold">Strategy Health</h1>
          <p className="text-sm text-muted-foreground">Track objectives, initiatives, and KPIs</p>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon"><Bell className="h-5 w-5" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="relative h-10 w-10 rounded-full"><Avatar><AvatarFallback>{initials}</AvatarFallback></Avatar></Button></DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal"><div className="flex flex-col space-y-1"><p className="text-sm font-medium leading-none">{user.name}</p><p className="text-xs leading-none text-muted-foreground">{user.email}</p></div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
              <DropdownMenuItem><Settings className="mr-2 h-4 w-4" />Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
