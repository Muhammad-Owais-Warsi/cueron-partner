# FCM Token Registration API

API endpoint for registering and managing Firebase Cloud Messaging (FCM) device tokens.

## Endpoints

### POST /api/fcm/register

Register or update an FCM device token for the authenticated user.

**Authentication**: Required (JWT token)

**Request Body**:
```json
{
  "token": "fcm_device_token_here",
  "device_type": "ios" | "android",
  "device_id": "optional_device_identifier"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "token": {
    "id": "uuid",
    "user_id": "uuid",
    "token": "fcm_device_token_here",
    "device_type": "ios",
    "device_id": "device-123",
    "is_active": true,
    "created_at": "2025-01-20T10:00:00Z",
    "updated_at": "2025-01-20T10:00:00Z"
  },
  "message": "Token registered successfully"
}
```

**Error Responses**:

- **401 Unauthorized**: User not authenticated
  ```json
  {
    "error": "Unauthorized"
  }
  ```

- **400 Bad Request**: Invalid request data
  ```json
  {
    "error": "Validation failed",
    "details": {
      "token": ["FCM token is required"],
      "device_type": ["Device type must be ios or android"]
    }
  }
  ```

- **500 Internal Server Error**: Server error
  ```json
  {
    "error": "Failed to register token"
  }
  ```

### DELETE /api/fcm/register

Deactivate an FCM device token for the authenticated user.

**Authentication**: Required (JWT token)

**Request** (Query Parameter):
```
DELETE /api/fcm/register?token=fcm_device_token_here
```

**Request** (Body):
```json
{
  "token": "fcm_device_token_here"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Token deactivated successfully"
}
```

**Error Responses**:

- **401 Unauthorized**: User not authenticated
- **400 Bad Request**: Token not provided
- **500 Internal Server Error**: Server error

## Usage Examples

### Mobile App Registration

```typescript
// React Native with @react-native-firebase/messaging
import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';

async function registerForPushNotifications() {
  // Request permission
  const authStatus = await messaging().requestPermission();
  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (!enabled) {
    console.log('Push notification permission denied');
    return;
  }

  // Get FCM token
  const fcmToken = await messaging().getToken();

  // Register with backend
  const response = await fetch('/api/fcm/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token: fcmToken,
      device_type: Platform.OS, // 'ios' or 'android'
      device_id: await DeviceInfo.getUniqueId(),
    }),
  });

  const data = await response.json();
  console.log('Token registered:', data);
}
```

### Token Refresh Handling

```typescript
// Listen for token refresh
messaging().onTokenRefresh(async (newToken) => {
  // Update token in backend
  await fetch('/api/fcm/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    },
    body: JSON.stringify({
      token: newToken,
      device_type: Platform.OS,
    }),
  });
});
```

### Logout / Token Deactivation

```typescript
async function logout() {
  const fcmToken = await messaging().getToken();

  // Deactivate token on backend
  await fetch(`/api/fcm/register?token=${fcmToken}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  // Delete token from device
  await messaging().deleteToken();

  // Clear auth session
  await clearAuthSession();
}
```

## Implementation Details

### Token Lifecycle

1. **Registration**: When a user logs in and grants notification permission
2. **Update**: When token is refreshed or device type changes
3. **Deactivation**: When user logs out or revokes permission
4. **Cleanup**: Inactive tokens are periodically removed (90+ days)

### Token Ownership

- If a token already exists for a different user, the old token is deactivated
- If a token exists for the same user, it is updated with new device info
- Each user can have multiple active tokens (multiple devices)

### Security

- Tokens are stored with user association for authorization
- Only authenticated users can register/deactivate tokens
- Users can only manage their own tokens
- Row Level Security (RLS) policies enforce data isolation

### Database Schema

```sql
CREATE TABLE fcm_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    token TEXT NOT NULL UNIQUE,
    device_type VARCHAR(20) NOT NULL,
    device_id VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fcm_tokens_user ON fcm_tokens(user_id);
CREATE INDEX idx_fcm_tokens_token ON fcm_tokens(token);
CREATE INDEX idx_fcm_tokens_active ON fcm_tokens(is_active) WHERE is_active = true;
```

## Testing

Run tests:
```bash
npm test apps/web/src/app/api/fcm/register/route.test.ts
```

## Related

- [FCM Module Documentation](../../../lib/fcm/README.md)
- [Push Notification Service](../../../lib/fcm/service.ts)
- [Notification Manager](../../../lib/realtime/notifications.ts)

## Requirements

**Requirement 14.1**: FCM token registration endpoint  
**Requirement 14.5**: Device token storage
