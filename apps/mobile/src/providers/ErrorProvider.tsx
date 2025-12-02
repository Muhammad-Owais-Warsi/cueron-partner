import React, { ReactNode, useEffect } from 'react';
import { ErrorBoundary } from '../components/ErrorBoundary';
// import { initSentry } from '@repo/utils/monitoring'; // TODO: Implement monitoring utils
import { initializeOfflineHandling } from '../lib/offline';

interface ErrorProviderProps {
  children: ReactNode;
}

/**
 * Root error provider for mobile app
 * Initializes error handling, monitoring, and offline support
 */
export function ErrorProvider({ children }: ErrorProviderProps): JSX.Element {
  useEffect(() => {
    // Initialize Sentry
    // TODO: Implement Sentry initialization
    console.log('Sentry initialization placeholder', {
      dsn: process.env.SENTRY_DSN || '',
      environment: (__DEV__ ? 'development' : 'production') as any,
      sampleRate: 1.0,
      tracesSampleRate: 0.1,
      enabled: !__DEV__ && !!process.env.SENTRY_DSN,
    });

    // Initialize offline handling
    initializeOfflineHandling();
  }, []);

  return <ErrorBoundary>{children}</ErrorBoundary>;
}
