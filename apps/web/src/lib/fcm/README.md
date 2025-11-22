# Firebase Cloud Messaging (FCM) Module

Push notification infrastructure for the Cueron Partner Platform.

## Overview

This module provides a complete push notification system using Firebase Cloud Messaging (FCM). It handles:

- FCM token registration and management
- Push notification sending to single or multiple devices
- Notification content formatting for different event types
- Token lifecycle management (activation, deactivation, cleanup)

## Requirements

**Requirement 14.1**: Push notification for job assignments  
**Requirement 14.5**: Notification content completeness

## Architecture

```
fcm/
├── config.ts       # FCM configuration and environment setup
├── types.ts        # TypeScript type definitions
├── client.ts       # FCM HTTP API client
├── formatter.ts    # Notification content formatting
├── service.ts      # High-level push notification service
└── index.ts        # Public API exports
```

## Setup

### 1. Environment Variables

Add the following to your `.env.local`:

```bash
FCM_SERVER_KEY=your_fcm_server_key_here
FCM_SENDER_ID=your_sender_id_here  # Optional
```

### 2. Database Schema

The FCM tokens are stored in the `fcm_tokens` table:

```sql
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL,  -- 'ios' or 'android'
    device_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Usage

### Registering FCM Tokens

**Client-side (Mobile App)**:

```typescript
// Request notification permission and get FCM token
import messaging from '@react-native-firebase/messaging';

async function registerForPushNotifications() {
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    const fcmToken = await messaging().getToken();
    
    // Register token with backend
    await fetch('/api/fcm/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: fcmToken,
        device_type: Platform.OS, // 'ios' or 'android'
        device_id: DeviceInfo.getUniqueId(),
      }),
    });
  }
}
```

**API Endpoint**:

```typescript
POST /api/fcm/register
{
  "token": "fcm_device_token_here",
  "device_type": "ios" | "android",
  "device_id": "optional_device_identifier"
}
```

### Sending Push Notifications

**Job Assignment Notification**:

```typescript
import { getPushNotificationService } from '@/lib/fcm';
import { createClient } from '@/lib/supabase/server';

const supabase = createClient();
const pushService = getPushNotificationService(supabase);

// Send job assignment notification to engineer
await pushService.sendJobAssignmentNotification(engineerId, {
  job_id: 'job-uuid',
  job_number: 'JOB-2025-1234',
  client_name: 'ABC Cold Storage',
  scheduled_time: '2025-01-20T10:00:00Z',
  urgency: 'urgent',
  location: {
    address: '123 Main St, Mumbai',
    lat: 19.0760,
    lng: 72.8777,
  },
});
```

**Job Status Update Notification**:

```typescript
// Send status update to agency users
await pushService.sendJobStatusNotification(
  ['agency-user-id-1', 'agency-user-id-2'],
  {
    job_id: 'job-uuid',
    job_number: 'JOB-2025-1234',
    old_status: 'assigned',
    new_status: 'onsite',
    engineer_name: 'Rajesh Kumar',
  }
);
```

**Payment Notification**:

```typescript
// Send payment notification to agency users
await pushService.sendPaymentNotification(
  ['agency-user-id-1', 'agency-user-id-2'],
  {
    payment_id: 'payment-uuid',
    job_id: 'job-uuid',
    amount: 5000,
    status: 'completed',
  }
);
```

**System Alert**:

```typescript
// Send system alert to users
await pushService.sendSystemAlert(
  ['user-id-1', 'user-id-2'],
  'System Maintenance',
  'The system will be under maintenance from 2 AM to 4 AM.',
  { maintenance_window: '2025-01-20T02:00:00Z' }
);
```

### Using the Low-Level Client

For more control, use the FCM client directly:

```typescript
import { getFCMClient } from '@/lib/fcm';

const fcmClient = getFCMClient();

// Send to single device
await fcmClient.sendToDevice('device_token', {
  title: 'Custom Notification',
  body: 'This is a custom notification',
  data: { custom_field: 'value' },
  priority: 'high',
});

// Send to multiple devices
await fcmClient.sendToDevices(
  ['token1', 'token2', 'token3'],
  {
    title: 'Broadcast Notification',
    body: 'This goes to multiple devices',
    priority: 'normal',
  }
);

// Send data-only message (silent push)
await fcmClient.sendDataMessage('device_token', {
  action: 'sync_data',
  timestamp: Date.now().toString(),
});
```

### Custom Notification Formatting

```typescript
import {
  formatJobAssignmentNotification,
  validateNotificationContent,
} from '@/lib/fcm';

// Format notification
const content = formatJobAssignmentNotification({
  job_id: 'job-uuid',
  job_number: 'JOB-2025-1234',
  client_name: 'ABC Cold Storage',
  urgency: 'emergency',
});

// Validate before sending
if (validateNotificationContent(content)) {
  await pushService.sendToUser(userId, content);
}
```

## Notification Content Format

All notifications follow this structure:

```typescript
interface PushNotificationContent {
  title: string;              // Max 65 characters
  body: string;               // Max 240 characters
  data?: Record<string, any>; // Custom data payload
  priority?: 'high' | 'normal';
  sound?: string;             // Sound file name
  badge?: number;             // iOS badge count
}
```

### Notification Types

1. **Job Assignment** (`job_assigned`)
   - Sent when an engineer is assigned to a job
   - Priority: `high` for emergency, `normal` otherwise
   - Includes job details and location

2. **Job Status Update** (`job_status_changed`)
   - Sent when job status changes
   - Priority: `normal`
   - Includes old and new status

3. **Payment** (`payment_received` / `payment_pending`)
   - Sent for payment updates
   - Priority: `normal`
   - Includes amount and status

4. **System Alert** (`system_alert`)
   - Sent for system-wide notifications
   - Priority: `high`
   - Custom title and message

## Token Management

### Deactivating Tokens

```typescript
// Deactivate token when user logs out
await fetch('/api/fcm/register', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token: fcmToken }),
});
```

### Handling Failed Tokens

```typescript
// Mark token as inactive when FCM returns error
await pushService.handleFailedToken('failed_token');
```

### Cleanup Inactive Tokens

```typescript
// Remove tokens inactive for 90+ days
await pushService.cleanupInactiveTokens(90);
```

## Error Handling

The FCM module handles errors gracefully:

- **Invalid tokens**: Automatically marked as inactive
- **Network errors**: Logged and thrown for retry logic
- **Validation errors**: Caught before sending
- **Missing tokens**: Returns success: 0, failure: 0

## Testing

```typescript
import { createFCMClient, resetFCMClient } from '@/lib/fcm';

describe('FCM Client', () => {
  afterEach(() => {
    resetFCMClient(); // Reset singleton for testing
  });

  it('should send notification to device', async () => {
    const client = createFCMClient('test_server_key');
    const response = await client.sendToDevice('test_token', {
      title: 'Test',
      body: 'Test notification',
    });
    expect(response.success).toBeGreaterThan(0);
  });
});
```

## Security Considerations

1. **Server Key Protection**: Never expose FCM server key in client-side code
2. **Token Validation**: Validate tokens before storage
3. **User Authorization**: Verify user owns the token before operations
4. **Data Sanitization**: Sanitize notification content to prevent injection
5. **Rate Limiting**: Implement rate limiting on registration endpoint

## Performance

- **Batch Sending**: Supports up to 1000 tokens per request
- **Token Caching**: Tokens cached in database for fast retrieval
- **Async Operations**: All operations are asynchronous
- **Connection Pooling**: Uses fetch API with keep-alive

## Monitoring

Monitor these metrics:

- Token registration rate
- Notification delivery success rate
- Failed token count
- Average notification latency
- Active token count per user

## Troubleshooting

### Notifications not received

1. Check FCM server key is correct
2. Verify token is active in database
3. Check device has notification permissions
4. Verify FCM service is running on device

### Token registration fails

1. Check authentication is valid
2. Verify database connection
3. Check token format is valid
4. Review server logs for errors

### High failure rate

1. Clean up inactive tokens
2. Check FCM quota limits
3. Verify network connectivity
4. Review FCM console for issues

## References

- [FCM HTTP v1 API](https://firebase.google.com/docs/cloud-messaging/http-server-ref)
- [FCM Best Practices](https://firebase.google.com/docs/cloud-messaging/concept-options)
- [React Native Firebase](https://rnfirebase.io/)
