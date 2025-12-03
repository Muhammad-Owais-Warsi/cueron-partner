'use client';

import React, { ReactNode, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ToastProvider } from '@/components/Toast';
import { initSentry } from '@cueron/utils';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Root providers component that wraps the entire application
 * Includes error boundary, toast notifications, and Sentry initialization
 */
export function Providers({ children }: ProvidersProps): JSX.Element {
  useEffect(() => {
    // Initialize Sentry on client side
    if (typeof window !== 'undefined') {
      initSentry({
        dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || '',
        environment: (process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT || 'development') as 'development' | 'staging' | 'production',
        sampleRate: 1.0,
        tracesSampleRate: 0.1,
        enabled: process.env.NODE_ENV === 'production' && !!process.env.NEXT_PUBLIC_SENTRY_DSN,
      });
    }
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ErrorBoundary>
  );
}
