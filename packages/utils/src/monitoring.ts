/**
 * Error monitoring and logging utilities using Sentry
 */

import { AppError, isCriticalError } from './errors';

/**
 * Sentry configuration interface
 */
export interface SentryConfig {
  dsn: string;
  environment: 'development' | 'staging' | 'production';
  sampleRate: number;
  tracesSampleRate: number;
  enabled: boolean;
}

/**
 * User context for error reporting (no PII)
 */
export interface UserContext {
  id: string;
  role?: string;
  agency_id?: string;
  engineer_id?: string;
}

/**
 * Error context for detailed logging
 */
export interface ErrorContext {
  user?: UserContext;
  request_id?: string;
  url?: string;
  method?: string;
  tags?: Record<string, string>;
  extra?: Record<string, any>;
}

/**
 * Mock Sentry interface for type safety
 * In production, this would be replaced with actual Sentry SDK
 */
interface SentryClient {
  captureException: (error: Error, context?: any) => string;
  captureMessage: (message: string, level: 'info' | 'warning' | 'error', context?: any) => string;
  setUser: (user: UserContext | null) => void;
  setTag: (key: string, value: string) => void;
  setContext: (name: string, context: Record<string, any>) => void;
}

/**
 * Sentry client instance (to be initialized)
 */
let sentryClient: SentryClient | null = null;

/**
 * Initialize Sentry monitoring
 */
export function initSentry(config: SentryConfig): void {
  if (!config.enabled || !config.dsn) {
    console.warn('Sentry monitoring is disabled');
    return;
  }
  
  // In production, initialize actual Sentry SDK here
  // For now, we'll use a mock implementation
  sentryClient = {
    captureException: (error: Error, context?: any) => {
      console.error('[Sentry] Exception:', error, context);
      return 'mock-event-id';
    },
    captureMessage: (message: string, level: 'info' | 'warning' | 'error', context?: any) => {
      console.log(`[Sentry] ${level.toUpperCase()}:`, message, context);
      return 'mock-event-id';
    },
    setUser: (user: UserContext | null) => {
      console.log('[Sentry] User context:', user);
    },
    setTag: (key: string, value: string) => {
      console.log('[Sentry] Tag:', key, value);
    },
    setContext: (name: string, context: Record<string, any>) => {
      console.log('[Sentry] Context:', name, context);
    },
  };
  
  console.log(`Sentry initialized for ${config.environment} environment`);
}

/**
 * Log error to Sentry
 */
export function logError(error: Error | AppError, context?: ErrorContext): string | null {
  if (!sentryClient) {
    console.error('Error (Sentry not initialized):', error, context);
    return null;
  }
  
  // Set user context if provided
  if (context?.user) {
    sentryClient.setUser(context.user);
  }
  
  // Set tags
  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      sentryClient!.setTag(key, value);
    });
  }
  
  // Set additional context
  if (context?.extra) {
    sentryClient.setContext('additional', context.extra);
  }
  
  // Add request context if available
  if (context?.request_id || context?.url || context?.method) {
    sentryClient.setContext('request', {
      request_id: context.request_id,
      url: context.url,
      method: context.method,
    });
  }
  
  // Capture the exception
  const eventId = sentryClient.captureException(error, {
    level: error instanceof AppError && isCriticalError(error) ? 'error' : 'warning',
  });
  
  return eventId;
}

/**
 * Log message to Sentry
 */
export function logMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: ErrorContext
): string | null {
  if (!sentryClient) {
    console.log(`Message (Sentry not initialized): ${level.toUpperCase()} - ${message}`, context);
    return null;
  }
  
  // Set context if provided
  if (context?.user) {
    sentryClient.setUser(context.user);
  }
  
  if (context?.tags) {
    Object.entries(context.tags).forEach(([key, value]) => {
      sentryClient!.setTag(key, value);
    });
  }
  
  const eventId = sentryClient.captureMessage(message, level, context?.extra);
  return eventId;
}

/**
 * Set user context for subsequent error reports
 */
export function setUserContext(user: UserContext | null): void {
  if (sentryClient) {
    sentryClient.setUser(user);
  }
}

/**
 * Clear user context
 */
export function clearUserContext(): void {
  if (sentryClient) {
    sentryClient.setUser(null);
  }
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category: string, data?: Record<string, any>): void {
  if (sentryClient) {
    // In production Sentry SDK, this would use Sentry.addBreadcrumb
    console.log('[Sentry] Breadcrumb:', { message, category, data });
  }
}
