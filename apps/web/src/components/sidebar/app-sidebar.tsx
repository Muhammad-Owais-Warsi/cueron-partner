'use client';

import * as React from 'react';
import {
  ArrowUpCircleIcon,
  Home,
  Briefcase,
  Users,
  BarChart3,
  CreditCard,
  Settings,
} from 'lucide-react';

import { NavMain } from '@/components/sidebar/nav-main';

import { NavUser } from '@/components/sidebar/nav-user';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useUserProfile } from '@/hooks';
import ThemeToggle from '../theme/theme-toggle';
import { Spinner } from '../ui/spinner';

// maybe for admin we create a complete new route, coz the fetching of data will be completely different
const data = {
  user: {
    name: 'shadcn',
    email: 'm@example.com',
    avatar: '/avatars/shadcn.jpg',
  },
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: Home,
    },
    {
      title: 'Jobs',
      url: '/dashboard/jobs',
      icon: Briefcase,
      roles: ['manager', 'engineer'],
    },
    {
      title: 'Team',
      url: '/dashboard/team',
      icon: Users,
      roles: ['manager'],
    },
    {
      title: 'Analytics',
      url: '/dashboard/analytics',
      icon: BarChart3,
      roles: ['manager'],
    },
    {
      title: 'Payments',
      url: '/dashboard/payments',
      icon: CreditCard,
      roles: ['manager', 'engineer'],
    },
    // {
    //   title: 'Settings',
    //   url: '/dashboard/settings',
    //   icon: Settings,
    //   roles: ['admin', 'manager'],
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, loading } = useUserProfile();

  if (loading) {
    <Spinner />;
  }

  const userRole = profile?.role ?? 'engineer';

  // ⭐ Filter nav items based on allowed roles
  const filteredNav = data.navMain.filter((item) => {
    if (!item.roles) return true; // public items
    return item.roles.includes(userRole);
  });

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="data-[slot=sidebar-menu-button]:!p-1.5">
              <a href="#">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">Cueron</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={filteredNav} />
        <ThemeToggle variant="label" className="mt-auto" />
      </SidebarContent>

      <SidebarFooter>
        <NavUser profile={profile} />
      </SidebarFooter>
    </Sidebar>
  );
}
