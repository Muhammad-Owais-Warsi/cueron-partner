# Error Handling Implementation Guide

## Overview

This document describes the comprehensive error handling system implemented for the Cueron Partner Platform. The system provides standardized error handling, retry logic, user-friendly error messages, and error monitoring across both web and mobile applications.

## Components

### 1. Error Utilities (`packages/utils/src/errors.ts`)

**Purpose**: Provides standardized error types, codes, and retry logic.

**Key Features**:
- `ErrorCode` enum: Standardized error codes for different error types
- `AppError` class: Custom error class with structured error information
- `ERROR_MESSAGES`: User-friendly error messages for each error code
- `retryWithBackoff()`: Exponential backoff retry logic (up to 3 attempts)
- `parseError()`: Converts various error types into AppError
- `isRetryableError()`: Determines if an error should be retried

**Usage Example**:
```typescript
import { AppError, ErrorCode, retryWithBackoff } from '@repo/utils/errors';

// Create a custom error
throw new AppError(
  ErrorCode.VALIDATION_ERROR,
  'Invalid input data',
  400,
  { phone: ['Phone number must be 10 digits'] }
);

// Retry a function with exponential backoff
const result = await retryWithBackoff(async () => {
  return await fetchData();
});
```

### 2. Monitoring Utilities (`packages/utils/src/monitoring.ts`)

**Purpose**: Error logging and monitoring integration with Sentry.

**Key Features**:
- `initSentry()`: Initialize Sentry monitoring
- `logError()`: Log errors to Sentry with context
- `logMessage()`: Log messages to Sentry
- `setUserContext()`: Set user context for error reports
- `addBreadcrumb()`: Add debugging breadcrumbs

**Usage Example**:
```typescript
import { initSentry, logError, setUserContext } from '@repo/utils/monitoring';

// Initialize Sentry
initSentry({
  dsn: process.env.SENTRY_DSN!,
  environment: 'production',
  sampleRate: 1.0,
  tracesSampleRate: 0.1,
  enabled: true,
});

// Set user context
setUserContext({
  id: user.id,
  role: user.role,
  agency_id: user.agency_id,
});

// Log an error
logError(error, {
  extra: { jobId: '123' },
  tags: { feature: 'job-assignment' },
});
```

### 3. Web Error Boundary (`apps/web/src/components/ErrorBoundary.tsx`)

**Purpose**: Catches React errors in the web application and displays fallback UI.

**Key Features**:
- Catches errors in component tree
- Logs errors to Sentry
- Displays user-friendly error UI
- Provides "Try Again" and "Go to Dashboard" actions
- Shows error details in development mode

**Usage Example**:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourApp />
    </ErrorBoundary>
  );
}

// Or use HOC
const SafeComponent = withErrorBoundary(MyComponent);
```

### 4. Toast Notifications (`apps/web/src/components/Toast.tsx`)

**Purpose**: Display toast notifications for errors and other messages.

**Key Features**:
- Multiple toast types: success, error, warning, info
- Auto-dismiss with configurable duration
- Manual dismiss option
- Stacked notifications
- Animated slide-in effect

**Usage Example**:
```typescript
import { useToast } from '@/components/Toast';

function MyComponent() {
  const { showError, showSuccess, showWarning } = useToast();

  const handleSubmit = async () => {
    try {
      await submitData();
      showSuccess('Data saved successfully!');
    } catch (error) {
      showError(error); // Automatically formats AppError
    }
  };
}

// Wrap app with ToastProvider
<ToastProvider>
  <App />
</ToastProvider>
```

### 5. API Client with Retry (`apps/web/src/lib/api-client.ts`)

**Purpose**: HTTP client with built-in error handling and retry logic.

**Key Features**:
- Automatic retry with exponential backoff
- Request timeout support
- Error parsing and formatting
- Automatic error logging for 5xx errors
- Support for all HTTP methods
- File upload support

**Usage Example**:
```typescript
import { apiClient } from '@/lib/api-client';

// GET request with automatic retry
const jobs = await apiClient.get('/api/jobs');

// POST request
const newJob = await apiClient.post('/api/jobs', jobData);

// Upload file
const formData = new FormData();
formData.append('file', file);
const result = await apiClient.upload('/api/upload', formData);

// Disable retry for specific request
const data = await apiClient.get('/api/data', { retry: false });
```

### 6. Mobile Error Boundary (`apps/mobile/src/components/ErrorBoundary.tsx`)

**Purpose**: Catches React errors in the mobile application.

**Key Features**:
- Native mobile UI for error display
- Logs errors to Sentry
- "Try Again" action
- Shows error details in development mode

**Usage Example**:
```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourMobileApp />
    </ErrorBoundary>
  );
}
```

### 7. Offline Handling (`apps/mobile/src/lib/offline.ts`)

**Purpose**: Handle offline scenarios in the mobile app.

**Key Features**:
- Network status detection
- Offline request queue
- Automatic retry when online
- Queue persistence with AsyncStorage
- Network status subscriptions

**Usage Example**:
```typescript
import {
  initializeOfflineHandling,
  isOnline,
  queueRequest,
  subscribeToNetworkStatus,
} from '@/lib/offline';

// Initialize on app start
initializeOfflineHandling();

// Check network status
if (!isOnline()) {
  // Queue request for later
  await queueRequest('/api/jobs/123/status', 'PATCH', { status: 'completed' });
}

// Subscribe to network changes
const unsubscribe = subscribeToNetworkStatus((online) => {
  if (online) {
    console.log('Back online!');
  } else {
    console.log('Offline');
  }
});
```

## Error Categories

### 1. Network Errors
- **Codes**: `NETWORK_ERROR`, `TIMEOUT_ERROR`, `CONNECTION_ERROR`
- **Strategy**: Retry up to 3 times with exponential backoff
- **User Feedback**: Toast notification with retry option
- **Logging**: Log to Sentry with network context

### 2. Authentication Errors
- **Codes**: `AUTH_INVALID_TOKEN`, `AUTH_EXPIRED_SESSION`, `AUTH_INVALID_OTP`
- **Strategy**: Clear session and redirect to login
- **User Feedback**: Authentication error message
- **Logging**: Log with user context (no sensitive data)

### 3. Authorization Errors
- **Codes**: `FORBIDDEN`, `INSUFFICIENT_PERMISSIONS`
- **Strategy**: Return 403 with clear message
- **User Feedback**: "Access Denied" message
- **Logging**: Log unauthorized access attempts

### 4. Validation Errors
- **Codes**: `VALIDATION_ERROR`, `DUPLICATE_ENTRY`, `INVALID_INPUT`
- **Strategy**: Return 400 with field-specific errors
- **User Feedback**: Highlight invalid fields
- **Logging**: Log for pattern analysis

### 5. Database Errors
- **Codes**: `DATABASE_ERROR`, `QUERY_TIMEOUT`, `CONSTRAINT_VIOLATION`
- **Strategy**: Rollback transaction, return 500
- **User Feedback**: Generic "Something went wrong" message
- **Logging**: Full error with query context

### 6. File Upload Errors
- **Codes**: `FILE_TOO_LARGE`, `INVALID_FILE_TYPE`, `UPLOAD_FAILED`
- **Strategy**: Validate before upload, provide retry
- **User Feedback**: Specific error message
- **Logging**: Log with file metadata

### 7. External Service Errors
- **Codes**: `EXTERNAL_SERVICE_ERROR`, `MAPS_API_ERROR`, `PAYMENT_GATEWAY_ERROR`
- **Strategy**: Circuit breaker pattern, fallback to cached data
- **User Feedback**: Degraded functionality notice
- **Logging**: Log with response codes

## Configuration

### Sentry Configuration

Set the following environment variables:

```bash
# Web Application (.env.local)
SENTRY_DSN=your-sentry-dsn
NEXT_PUBLIC_SENTRY_ENVIRONMENT=production

# Mobile Application
SENTRY_DSN=your-sentry-dsn
SENTRY_ENVIRONMENT=production
```

### Retry Configuration

Default retry configuration (can be customized):

```typescript
{
  maxAttempts: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 10000, // 10 seconds
  backoffMultiplier: 2,
}
```

## Best Practices

### 1. Always Use AppError for Application Errors

```typescript
// Good
throw new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid phone number', 400);

// Avoid
throw new Error('Invalid phone number');
```

### 2. Wrap API Calls with Try-Catch

```typescript
try {
  const result = await apiClient.post('/api/jobs', data);
  showSuccess('Job created successfully');
} catch (error) {
  showError(error); // Toast will display user-friendly message
}
```

### 3. Log Critical Errors

```typescript
try {
  await criticalOperation();
} catch (error) {
  logError(error, {
    tags: { critical: 'true' },
    extra: { operation: 'payment-processing' },
  });
  throw error;
}
```

### 4. Provide User Context

```typescript
// After successful login
setUserContext({
  id: user.id,
  role: user.role,
  agency_id: user.agency_id,
});

// On logout
clearUserContext();
```

### 5. Handle Offline Scenarios (Mobile)

```typescript
if (!isOnline()) {
  // Queue for later
  await queueRequest(url, method, body);
  showInfo('Request queued. Will sync when online.');
  return;
}

// Proceed with online request
await apiClient.post(url, body);
```

## Testing Error Handling

### Unit Tests

```typescript
import { retryWithBackoff, AppError, ErrorCode } from '@repo/utils/errors';

describe('retryWithBackoff', () => {
  it('should retry failed requests up to 3 times', async () => {
    let attempts = 0;
    const fn = jest.fn(async () => {
      attempts++;
      if (attempts < 3) {
        throw new AppError(ErrorCode.NETWORK_ERROR, 'Network error', 503);
      }
      return 'success';
    });

    const result = await retryWithBackoff(fn);
    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });
});
```

### Integration Tests

```typescript
test('should display error toast on API failure', async () => {
  // Mock API failure
  mockApiClient.post.mockRejectedValue(
    new AppError(ErrorCode.VALIDATION_ERROR, 'Invalid data', 400)
  );

  render(<MyComponent />);
  
  await userEvent.click(screen.getByText('Submit'));
  
  // Verify toast is displayed
  expect(await screen.findByText('Invalid data')).toBeInTheDocument();
});
```

## Monitoring and Alerts

### Sentry Configuration

- **Sample Rate**: 100% for errors, 10% for performance
- **Environment Tags**: production, staging, development
- **User Context**: agency_id, engineer_id, role (no PII)
- **Alerts**: Critical errors trigger immediate notifications

### Key Metrics to Monitor

1. Error rate by error code
2. Retry success rate
3. Average retry attempts
4. Offline queue size (mobile)
5. Critical error frequency

## Troubleshooting

### Common Issues

**Issue**: Errors not appearing in Sentry
- **Solution**: Verify `SENTRY_DSN` is set and `initSentry()` is called on app start

**Issue**: Retry logic not working
- **Solution**: Check if error is retryable using `isRetryableError()`

**Issue**: Toast notifications not showing
- **Solution**: Ensure app is wrapped with `<ToastProvider>`

**Issue**: Offline queue not processing
- **Solution**: Call `initializeOfflineHandling()` on app start

## Related Requirements

This implementation validates the following requirements:

- **Property 90**: Network error messaging (Requirements 20.1)
- **Property 91**: Request retry logic (Requirements 20.2)
- **Property 92**: Timeout error logging (Requirements 20.3)
- **Property 93**: Upload retry availability (Requirements 20.4)
- **Property 94**: Critical error reporting (Requirements 20.5)
