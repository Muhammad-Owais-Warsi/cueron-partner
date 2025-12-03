'use client';

import React from 'react';
import { useUserProfile, useSession } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import ThemeToggle from '../theme/theme-toggle';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMenuClick: () => void;
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
  isMobile?: boolean;
  isTablet?: boolean;
  isPhone?: boolean;
}

function SidebarToggleButton({
  isMobile,
  isTablet,
  isDesktop,
  onMenuClick,
  onToggleSidebar,
  sidebarCollapsed,
}: any) {
  if (isMobile || isTablet)
    return (
      <Button variant="ghost" size="icon" onClick={onMenuClick} className="h-8 w-8 active:scale-95">
        <Menu className="h-4 w-4" />
      </Button>
    );

  if (isDesktop && onToggleSidebar)
    return (
      <Button variant="ghost" size="icon" onClick={onToggleSidebar} className="h-8 w-8">
        {sidebarCollapsed ? (
          <PanelLeftOpen className="h-4 w-4" />
        ) : (
          <PanelLeftClose className="h-4 w-4" />
        )}
      </Button>
    );

  return null;
}

function NotificationsButton() {
  return (
    <Button variant="ghost" size="icon" className="relative h-8 w-8">
      <Bell className="h-4 w-4" />
      <span className="absolute -right-1 -top-1 flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-destructive" />
      </span>
    </Button>
  );
}

function HeaderTitle({ agencyName, isPhone, isTablet, isMobile }: any) {
  const title = isMobile || isTablet ? 'Cueron' : agencyName || 'Cueron Partner Platform';

  return (
    <h1
      className={cn(
        'font-semibold truncate',
        isPhone ? 'text-sm' : isTablet ? 'text-base' : 'text-base lg:text-lg'
      )}
    >
      {title}
    </h1>
  );
}

function UserMenu({ displayName, displayRole, user, agencyName, isPhone, signOut }: any) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 gap-1.5 px-1.5">
          <Avatar className="h-6 w-6">
            <AvatarImage src="" alt={displayName} />
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          {!isPhone && (
            <div className="hidden sm:block text-left min-w-0">
              <p className="text-xs font-medium truncate max-w-[100px]">{displayName}</p>
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">{displayRole}</p>
            </div>
          )}

          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{displayName}</p>
            <p className="text-xs text-muted-foreground break-all">{user?.email || user?.phone}</p>
            {agencyName && (
              <p className="text-xs text-muted-foreground break-words">{agencyName}</p>
            )}
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <a href="/dashboard/profile">
            <User className="mr-2 h-4 w-4" /> Profile
          </a>
        </DropdownMenuItem>

        <DropdownMenuItem asChild>
          <a href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" /> Settings
          </a>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => void signOut()} className="text-destructive">
          <LogOut className="mr-2 h-4 w-4" /> Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header({
  onMenuClick,
  onToggleSidebar,
  sidebarCollapsed,
  isMobile,
  isTablet,
  isPhone,
}: HeaderProps) {
  const { user, profile } = useUserProfile();
  const { signOut } = useSession();

  const displayName = profile?.name || user?.email || user?.phone || 'User';
  const displayRole = profile?.role || 'viewer';
  const agencyName = profile?.agency?.name;

  const isDesktop = !isMobile && !isTablet;

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur">
      <div className="flex h-12 items-center gap-3 px-3 sm:px-4 lg:px-6">
        {/* Sidebar Toggle */}
        <SidebarToggleButton
          isMobile={isMobile}
          isTablet={isTablet}
          isDesktop={isDesktop}
          onMenuClick={onMenuClick}
          onToggleSidebar={onToggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />

        {/* Title */}
        <div className="flex-1 min-w-0">
          <HeaderTitle
            agencyName={agencyName}
            isPhone={isPhone}
            isTablet={isTablet}
            isMobile={isMobile}
          />
        </div>

        <ThemeToggle />

        <div className="flex items-center gap-2">
          <NotificationsButton />

          <UserMenu
            displayName={displayName}
            displayRole={displayRole}
            user={user}
            agencyName={agencyName}
            isPhone={isPhone}
            signOut={signOut}
          />
        </div>
      </div>
    </header>
  );
}
