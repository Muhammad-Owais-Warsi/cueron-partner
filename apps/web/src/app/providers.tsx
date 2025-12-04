'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { initSentry } from '@cueron/utils';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers component that wraps the entire application
 * Includes error boundary, toast notifications, and Sentry initialization
 */
export function Providers({ children }: ProvidersProps): JSX.Element {
  // Create QueryClient on the client side
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    // Initialize Sentry on client side
    if (typeof window !== 'undefined') {
      initSentry({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
        environment: (process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development') as
          | 'development'
          | 'staging'
          | 'production',
        sampleRate: 1.0,
        tracesSampleRate: 0.1,
        enabled: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      });
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </QueryClientProvider>
  );
}
