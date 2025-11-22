# Push Notification Implementation

This document describes the push notification implementation for the Cueron Engineer Mobile Application.

## Overview

The mobile app uses Expo Notifications to handle push notifications for job assignments, status updates, and other critical events. The implementation supports:

- Foreground notifications (app is open)
- Background notifications (app is in background)
- Quit state notifications (app is closed)
- Notification tap navigation to relevant screens
- FCM token registration and refresh

## Requirements Addressed

- **5.1**: Push notification display for job assignments
- **14.1**: Job assignment notification with FCM token registration
- **14.5**: Notification content completeness and parsing

## Architecture

### Components

1. **notifications.ts** - Core notification service
   - Permission requests
   - FCM token management
   - Token registration with backend
   - Notification data parsing

2. **useNotifications.ts** - React hook for notification handling
   - Foreground notification listeners
   - Background/quit state notification handling
   - Navigation based on notification type
   - Badge count management

3. **App.tsx** - Application entry point
   - Initializes push notifications on app launch
   - Sets up notification infrastructure

## Setup Instructions

### 1. Install Dependencies

```bash
cd apps/mobile
pnpm install
```

The following packages are required:
- `expo-notifications` - Expo's notification library
- `expo-device` - Device information for token registration

### 2. Configure Expo Project

Update `app.json` with your Expo project ID:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-expo-project-id"
      }
    }
  }
}
```

### 3. Configure Firebase (for production)

For production deployments, you'll need to:

1. Create a Firebase project
2. Add iOS and Android apps to Firebase
3. Download configuration files:
   - `google-services.json` for Android
   - `GoogleService-Info.plist` for iOS
4. Place them in the appropriate directories

### 4. Environment Variables

Set the following environment variable:

```bash
EXPO_PROJECT_ID=your-expo-project-id
```

## Usage

### Initialize Notifications

Notifications are automatically initialized when the app launches. The initialization process:

1. Requests notification permissions from the user
2. Gets the Expo push token (FCM token)
3. Registers the token with the backend API
4. Sets up token refresh listeners

### Handle Notifications in Components

Use the `useNotifications` hook in any component:

```typescript
import { useNotifications } from '../hooks/useNotifications';

function MyComponent() {
  const {
    notification,
    notificationData,
    dismissNotification,
    getBadgeCount,
    setBadgeCount,
  } = useNotifications();

  // notification contains the raw notification object
  // notificationData contains parsed, typed notification data

  return (
    // Your component JSX
  );
}
```

### Notification Data Types

The app supports the following notification types:

#### Job Assignment Notification

```typescript
{
  type: 'job_assigned',
  job_id: string,
  job_number: string,
  client_name: string,
  scheduled_time?: string,
  urgency: string
}
```

#### Job Status Update Notification

```typescript
{
  type: 'job_status_changed',
  job_id: string,
  job_number: string,
  old_status: string,
  new_status: string
}
```

## Navigation Handling

When a user taps a notification, the app automatically navigates to the relevant screen:

- **Job Assignment**: Navigates to Job Detail screen
- **Job Status Update**: Navigates to Job Detail screen

The navigation logic is implemented in `useNotifications.ts` in the `handleNotificationNavigation` function.

## Testing

### Test on Physical Device

Push notifications only work on physical devices, not simulators/emulators.

1. Build and install the app on a physical device
2. Grant notification permissions when prompted
3. Send a test notification from the backend

### Test Notification Payload

Use the backend API to send test notifications:

```bash
POST /api/fcm/send
{
  "user_id": "engineer-user-id",
  "notification": {
    "title": "New Job Assignment",
    "body": "You have been assigned to Job #12345"
  },
  "data": {
    "type": "job_assigned",
    "job_id": "job-uuid",
    "job_number": "JOB-2025-12345",
    "client_name": "ABC Cold Storage",
    "urgency": "urgent"
  }
}
```

### Local Testing

For development, you can schedule local notifications:

```typescript
import { scheduleLocalNotification } from '../lib/notifications';

// Schedule a test notification
await scheduleLocalNotification(
  'Test Notification',
  'This is a test notification',
  {
    type: 'job_assigned',
    job_id: 'test-job-id',
    job_number: 'TEST-001',
    client_name: 'Test Client',
    urgency: 'normal'
  }
);
```

## Troubleshooting

### Notifications Not Appearing

1. **Check permissions**: Ensure notification permissions are granted
2. **Check device**: Notifications only work on physical devices
3. **Check token registration**: Verify the FCM token is registered in the backend
4. **Check notification handler**: Ensure `setNotificationHandler` is configured

### Navigation Not Working

1. **Check navigation setup**: Ensure navigation is properly initialized
2. **Check notification data**: Verify the notification contains valid data
3. **Check screen names**: Ensure screen names match your navigation configuration

### Token Registration Failing

1. **Check authentication**: Ensure the user is authenticated
2. **Check API endpoint**: Verify `/api/fcm/register` is accessible
3. **Check network**: Ensure the device has internet connectivity

## Backend Integration

The mobile app expects the following backend endpoint:

### POST /api/fcm/register

Registers or updates an FCM token for the authenticated user.

**Request:**
```json
{
  "token": "ExponentPushToken[...]",
  "device_type": "ios" | "android",
  "device_id": "optional-device-id"
}
```

**Response:**
```json
{
  "success": true,
  "token": {
    "id": "token-id",
    "user_id": "user-id",
    "token": "ExponentPushToken[...]",
    "device_type": "ios",
    "is_active": true
  },
  "message": "Token registered successfully"
}
```

## Security Considerations

1. **Token Storage**: FCM tokens are stored securely in AsyncStorage
2. **Token Refresh**: Tokens are automatically refreshed and re-registered
3. **Authentication**: Token registration requires user authentication
4. **Data Validation**: Notification data is validated before processing

## Future Enhancements

1. **Notification Categories**: Add iOS notification categories for quick actions
2. **Rich Notifications**: Support images and media in notifications
3. **Notification Preferences**: Allow users to customize notification settings
4. **Notification History**: Store notification history locally
5. **Silent Notifications**: Support silent notifications for background data sync

## References

- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [React Navigation Deep Linking](https://reactnavigation.org/docs/deep-linking/)
