'use client';

import { ReactNode, useState, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Breadcrumbs } from './Breadcrumbs';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Enhanced hook to detect device type more precisely
function useDeviceType() {
  const isMobile = useIsMobile();
  const [isTablet, setIsTablet] = useState(false);
  const [isPhone, setIsPhone] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Phone: width < 768px
      const phone = width < 768;
      // Tablet: width >= 768px and < 1024px
      const tablet = width >= 768 && width < 1024;

      setIsPhone(phone);
      setIsTablet(tablet);
    };

    checkDevice();

    const handleResize = () => {
      requestAnimationFrame(checkDevice);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return { isMobile, isTablet, isPhone };
}

// Hook to manage sidebar state with device-aware behavior
function useSidebarState() {
  const { isMobile, isTablet, isPhone } = useDeviceType();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize and load sidebar state from localStorage on mount
  useEffect(() => {
    setIsInitialized(true);

    // Desktop only: restore collapsed state from localStorage
    if (!isMobile && !isTablet) {
      const savedCollapsed = localStorage.getItem('sidebar-collapsed');
      if (savedCollapsed !== null) {
        setSidebarCollapsed(JSON.parse(savedCollapsed));
      }
    }

    // Always start with sidebar closed on mobile/tablet
    if (isMobile || isTablet) {
      setSidebarOpen(false);
    }
  }, [isMobile, isTablet]);

  // Close sidebar when switching between device types
  useEffect(() => {
    setSidebarOpen(false);
  }, [isMobile, isTablet, isPhone]);

  // Save sidebar state to localStorage (desktop only)
  const toggleSidebarCollapsed = useCallback(() => {
    if (!isMobile && !isTablet) {
      const newCollapsed = !sidebarCollapsed;
      setSidebarCollapsed(newCollapsed);
      localStorage.setItem('sidebar-collapsed', JSON.stringify(newCollapsed));
    }
  }, [isMobile, isTablet, sidebarCollapsed]);

  // Toggle sidebar for mobile/tablet
  const toggleMobileSidebar = useCallback(() => {
    if (isMobile || isTablet) {
      setSidebarOpen((prev) => !prev);
    }
  }, [isMobile, isTablet]);

  // Close sidebar
  const closeSidebar = useCallback(() => {
    setSidebarOpen(false);
  }, []);

  return {
    isMobile,
    isTablet,
    isPhone,
    isInitialized,
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    toggleMobileSidebar,
    closeSidebar,
  };
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const {
    isMobile,
    isTablet,
    isPhone,
    isInitialized,
    sidebarOpen,
    sidebarCollapsed,
    toggleSidebarCollapsed,
    toggleMobileSidebar,
    closeSidebar,
  } = useSidebarState();

  // Show loading state until device detection is complete
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isDesktop = !isMobile && !isTablet;

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop for mobile/tablet when sidebar is open */}
      {(isMobile || isTablet) && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 transition-opacity duration-200 ease-in-out"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        isCollapsed={sidebarCollapsed}
        isMobile={isMobile}
        isTablet={isTablet}
        isPhone={isPhone}
        onClose={closeSidebar}
        onToggleCollapse={toggleSidebarCollapsed}
      />

      {/* Main content area with smooth transitions */}
      <div
        className={cn(
          'min-h-screen transition-all duration-300 ease-in-out',
          // Desktop: adjust margin based on sidebar state
          isDesktop && 'lg:ml-60',
          isDesktop && sidebarCollapsed && 'lg:ml-14'
          // Mobile/Tablet: no margin adjustment - sidebar is overlay
        )}
      >
        {/* Header */}
        <Header
          onMenuClick={toggleMobileSidebar}
          onToggleSidebar={isDesktop ? toggleSidebarCollapsed : undefined}
          sidebarCollapsed={sidebarCollapsed}
          isMobile={isMobile}
          isTablet={isTablet}
          isPhone={isPhone}
        />

        {/* Page content */}
        <main className="py-4">
          <div className="mx-auto max-w-7xl px-3 sm:px-4 lg:px-6">
            {/* Breadcrumbs */}
            <Breadcrumbs />

            {/* Page content */}
            <div className="mt-3">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
