'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '../ui/spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
  loadingComponent?: React.ReactNode;
}

/**
 * Protected Route Component
 * Wraps pages that require authentication
 * Redirects to login if user is not authenticated
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  loadingComponent,
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading) {
    return (
      loadingComponent || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <Spinner />
          </div>
        </div>
      )
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}

/**
 * Higher-order component for protecting pages
 */
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    redirectTo?: string;
    loadingComponent?: React.ReactNode;
  }
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute redirectTo={options?.redirectTo} loadingComponent={options?.loadingComponent}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
