'use client';

import * as React from 'react';
import {
  ArrowUpCircleIcon,
  Home,
  Briefcase,
  Users,
  BarChart3,
  CreditCard,
  Binoculars,
  Plus,
} from 'lucide-react';

import { PlusCircle, Gavel, Ticket, ClipboardCheck, ClipboardList } from 'lucide-react';

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
// const data = {
//   user: {
//     name: 'shadcn',
//     email: 'm@example.com',
//     avatar: '/avatars/shadcn.jpg',
//   },
//   navMain: [
//     {
//       title: 'Dashboard',
//       url: '/dashboard',
//       icon: Home,
//     },
//     {
//       title: 'Jobs',
//       url: '/dashboard/jobs',
//       icon: Briefcase,
//       roles: ['manager', 'engineer'],
//     },
//     {
//       title: 'Team',
//       url: '/dashboard/team',
//       icon: Users,
//       roles: ['manager'],
//     },
//     {
//       title: 'Analytics',
//       url: '/dashboard/analytics',
//       icon: BarChart3,
//       roles: ['manager'],
//     },
//     {
//       title: 'Payments',
//       url: '/dashboard/payments',
//       icon: CreditCard,
//       roles: ['manager', 'engineer'],
//     },
//     {
//       title: 'Submit Survey',
//       url: '/dashboard/surveys/create',
//       icon: Plus,
//       roles: ['admin', 'engineer'],
//     },
//     {
//       title: 'Surveys',
//       url: '/dashboard/surveys',
//       icon: Binoculars,
//       roles: ['admin', 'manager'],
//     },
//   ],
// };

const new_data = {
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
      url: '/dashboard/new_jobs',
      icon: Briefcase,
      roles: ['admin', 'manager', 'engineer'],
    },
    {
      title: 'Create Job',
      url: '/dashboard/new_jobs/create',
      icon: PlusCircle,
      roles: ['admin'],
    },
    {
      title: 'Bids',
      url: '/dashboard/bids',
      icon: Gavel,
      roles: ['admin'],
    },
    {
      title: 'Requests',
      url: '/dashboard/requests',
      icon: PlusCircle,
      roles: ['admin'],
    },
    {
      title: 'Create Engineer',
      url: '/dashboard/create-user',
      icon: PlusCircle,
      roles: ['admin'],
    },
    {
      title: 'Create Agency',
      url: '/dashboard/register',
      icon: PlusCircle,
      roles: ['admin'],
    },
    {
      title: 'Team',
      url: '/dashboard/new_team',
      icon: Users,
      roles: ['manager'],
    },
    {
      title: 'Tickets',
      url: '/dashboard/tickets',
      icon: ClipboardList,
      roles: ['manager'],
    },
    {
      title: 'Inspections',
      url: '/dashboard/inspection',
      icon: ClipboardList,
      roles: ['admin'],
    },
    // {
    //   title: 'Analytics',
    //   url: '/dashboard/analytics',
    //   icon: BarChart3,
    //   roles: ['manager'],
    // },
    // {
    //   title: 'Payments',
    //   url: '/dashboard/payments',
    //   icon: CreditCard,
    //   roles: ['manager', 'engineer'],
    // },
    // {
    //   title: 'Submit Survey',
    //   url: '/dashboard/surveys/create',
    //   icon: Plus,
    //   roles: ['admin', 'engineer'],
    // },
    // {
    //   title: 'Surveys',
    //   url: '/dashboard/surveys',
    //   icon: Binoculars,
    //   roles: ['admin', 'manager'],
    // },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { profile, loading } = useUserProfile();

  if (loading) {
    <Spinner />;
  }

  console.log('PROFILE', profile);

  const userRole = profile?.role ?? 'engineer';

  // ⭐ Filter nav items based on allowed roles
  const filteredNav = new_data.navMain.filter((item) => {
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
        {/*<ThemeToggle variant="label" className="mt-auto" />*/}
      </SidebarContent>

      <SidebarFooter>
        <NavUser profile={profile} />
      </SidebarFooter>
    </Sidebar>
  );
}
