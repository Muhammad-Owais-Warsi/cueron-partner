'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUserProfile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Home,
  Briefcase,
  Users,
  BarChart3,
  CreditCard,
  Settings,
  X,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@cueron/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  isOpen: boolean;
  isCollapsed?: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
  isPhone?: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: UserRole[];
}

const navigationItems: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Jobs',
    href: '/dashboard/jobs',
    icon: Briefcase,
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    name: 'Team',
    href: '/dashboard/team',
    icon: Users,
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: BarChart3,
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    name: 'Payments',
    href: '/dashboard/payments',
    icon: CreditCard,
    roles: ['admin', 'manager', 'viewer'],
  },
  {
    name: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['admin', 'manager'],
  },
];

export function Sidebar({
  isOpen,
  isCollapsed,
  isMobile,
  isTablet,
  isPhone,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const pathname = usePathname();
  const { profile } = useUserProfile();

  const userRole = (profile?.role || 'viewer') as UserRole;

  const visibleItems = navigationItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const isDesktop = !isMobile && !isTablet;

  if (isDesktop) {
    return (
      <div
        className={cn(
          'hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:flex-col transition-all duration-300 ease-in-out',
          isCollapsed ? 'lg:w-14' : 'lg:w-60'
        )}
      >
        <div className="flex grow flex-col gap-y-4 overflow-y-auto border-r border-border bg-background px-4 pb-3">
          <div className="flex h-12 shrink-0 items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              {!isCollapsed && (
                <span className="text-lg font-bold transition-opacity duration-200">Cueron</span>
              )}
            </div>
          </div>

          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-5">
              <li>
                <ul role="list" className="-mx-2 space-y-0.5">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            'group flex gap-x-2 rounded-md p-1.5 text-sm font-medium leading-5 transition-all duration-200',
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                            isCollapsed && 'justify-center px-1.5'
                          )}
                          title={isCollapsed ? item.name : undefined}
                        >
                          <item.icon
                            className={cn(
                              'h-5 w-5 shrink-0 transition-colors duration-200',
                              isActive ? 'text-accent-foreground' : 'text-muted-foreground'
                            )}
                            aria-hidden="true"
                          />
                          {!isCollapsed && (
                            <span className="truncate transition-opacity duration-200">
                              {item.name}
                            </span>
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out',
        isOpen ? 'visible' : 'invisible'
      )}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'flex h-full transform bg-background transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full',

          isPhone && 'w-1/2 max-w-xs',

          isTablet && 'w-2/3 max-w-sm',

          isMobile && !isPhone && !isTablet && 'w-2/3 max-w-sm'
        )}
      >
        <div className="absolute right-3 top-3 z-10">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground touch-manipulation active:scale-95 transition-transform"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close sidebar</span>
          </Button>
        </div>

        <div className="flex w-full grow flex-col gap-y-4 overflow-y-auto bg-background px-4 pb-4 pt-12">
          {' '}
          <div className="flex h-10 shrink-0 items-center">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span
                className={`font-bold transition-opacity duration-200 ${
                  isPhone ? 'text-lg' : 'text-xl'
                }`}
              >
                Cueron
              </span>
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-4">
              <li>
                <ul role="list" className="space-y-1">
                  {visibleItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            'group flex gap-x-3 rounded-md text-sm font-medium leading-6 transition-colors duration-200 touch-manipulation active:scale-95',
                            isActive
                              ? 'bg-accent text-accent-foreground'
                              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',

                            isPhone ? 'p-2' : 'p-3'
                          )}
                        >
                          <item.icon
                            className={cn(
                              'shrink-0',
                              isPhone ? 'h-5 w-5' : 'h-6 w-6',
                              isActive ? 'text-accent-foreground' : 'text-muted-foreground'
                            )}
                            aria-hidden="true"
                          />
                          <span className={isPhone ? 'text-sm' : 'text-base'}>{item.name}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
}
