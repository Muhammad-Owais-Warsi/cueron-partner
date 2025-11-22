# Notifications Module

This module provides in-app notification functionality for the Cueron Partner Platform.

## Features

- **Notification Creation**: Create notifications for users, agencies, and engineers
- **Notification List**: Retrieve paginated list of notifications with filtering
- **Read/Unread Tracking**: Mark individual or all notifications as read
- **Notification Preferences**: Manage user preferences for notification channels and types

## API Endpoints

### GET /api/notifications

List notifications for the authenticated user.

**Query Parameters:**
- `limit` (number, default: 50): Number of notifications to return
- `offset` (number, default: 0): Pagination offset
- `unread_only` (boolean): Filter to show only unread notifications
- `type` (string): Filter by notification type

**Response:**
```json
{
  "notifications": [...],
  "total": 100,
  "unreadCount": 15,
  "limit": 50,
  "offset": 0
}
```

### PATCH /api/notifications/[id]/read

Mark a specific notification as read.

**Response:**
```json
{
  "notification": {...}
}
```

### POST /api/notifications/read-all

Mark all unread notifications as read for the authenticated user.

**Response:**
```json
{
  "success": true,
  "count": 15
}
```

### GET /api/notifications/preferences

Get notification preferences for the authenticated user.

**Response:**
```json
{
  "preferences": {
    "user_id": "...",
    "enable_push": true,
    "enable_email": true,
    "enable_sms": false,
    "notification_types": {
      "job_assigned": true,
      "job_accepted": true,
      ...
    }
  }
}
```

### PUT /api/notifications/preferences

Update notification preferences for the authenticated user.

**Request Body:**
```json
{
  "enable_push": true,
  "enable_email": false,
  "enable_sms": false,
  "notification_types": {
    "job_assigned": true,
    "job_accepted": false,
    ...
  }
}
```

## Service Functions

### createNotification

Create a notification for a specific user.

```typescript
import { createNotification } from '@/lib/notifications';

const result = await createNotification({
  userId: 'user-uuid',
  agencyId: 'agency-uuid',
  title: 'New Job Assigned',
  message: 'You have been assigned to job JOB-2025-1234',
  type: 'job_assigned',
  relatedEntityType: 'job',
  relatedEntityId: 'job-uuid',
  sentVia: ['push', 'email']
});
```

### createAgencyNotification

Create notifications for all users in an agency with specific roles.

```typescript
import { createAgencyNotification } from '@/lib/notifications';

const result = await createAgencyNotification({
  agencyId: 'agency-uuid',
  roles: ['admin', 'manager'],
  title: 'New Job Available',
  message: 'A new job has been assigned to your agency',
  type: 'job_assigned',
  relatedEntityType: 'job',
  relatedEntityId: 'job-uuid'
});
```

### createEngineerNotification

Create a notification for a specific engineer.

```typescript
import { createEngineerNotification } from '@/lib/notifications';

const result = await createEngineerNotification({
  engineerId: 'engineer-uuid',
  title: 'Job Assigned',
  message: 'You have been assigned to job JOB-2025-1234',
  type: 'job_assigned',
  relatedEntityType: 'job',
  relatedEntityId: 'job-uuid',
  sentVia: ['push']
});
```

## Notification Types

- `job_assigned`: Job has been assigned to an engineer
- `job_accepted`: Engineer has accepted a job
- `job_status_update`: Job status has changed
- `job_completed`: Job has been completed
- `payment_received`: Payment has been received
- `payment_pending`: Payment is pending
- `engineer_added`: New engineer added to agency
- `agency_approved`: Agency registration approved
- `system_alert`: System-wide alert or announcement

## Database Schema

### notifications table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    agency_id UUID,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_entity_type VARCHAR(50),
    related_entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    sent_via TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### notification_preferences table

```sql
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE,
    enable_push BOOLEAN DEFAULT true,
    enable_email BOOLEAN DEFAULT true,
    enable_sms BOOLEAN DEFAULT false,
    notification_types JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Row Level Security

- Users can only view their own notifications
- Users can only update their own notifications (mark as read)
- System can create notifications for any user (service role)
- Users can manage their own notification preferences

## Integration with Other Modules

The notification service is integrated with:

- **Job Assignment**: Creates notifications when jobs are assigned
- **Job Status Updates**: Creates notifications when job status changes
- **Payment Processing**: Creates notifications for payment events
- **FCM Service**: Sends push notifications via Firebase Cloud Messaging
- **Real-time Module**: Broadcasts notification events via Supabase Realtime

## Usage Examples

### Creating a notification when a job is assigned

```typescript
import { createEngineerNotification } from '@/lib/notifications';
import { sendPushNotification } from '@/lib/fcm';

// After assigning job to engineer
const notificationResult = await createEngineerNotification({
  engineerId: job.assigned_engineer_id,
  title: 'New Job Assigned',
  message: `You have been assigned to ${job.job_number}`,
  type: 'job_assigned',
  relatedEntityType: 'job',
  relatedEntityId: job.id,
  sentVia: ['push']
});

// Send push notification
if (notificationResult.success) {
  await sendPushNotification({
    engineerId: job.assigned_engineer_id,
    title: 'New Job Assigned',
    body: `You have been assigned to ${job.job_number}`,
    data: {
      type: 'job_assigned',
      jobId: job.id
    }
  });
}
```

### Fetching notifications in a React component

```typescript
'use client';

import { useEffect, useState } from 'react';

export function NotificationList() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function fetchNotifications() {
      const response = await fetch('/api/notifications?limit=20');
      const data = await response.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    }

    fetchNotifications();
  }, []);

  async function markAsRead(notificationId: string) {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH'
    });
    // Refresh notifications
  }

  return (
    <div>
      <h2>Notifications ({unreadCount} unread)</h2>
      {notifications.map(notification => (
        <div key={notification.id} onClick={() => markAsRead(notification.id)}>
          <h3>{notification.title}</h3>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
}
```

## Requirements Validation

This module validates the following requirements:

- **Requirement 14.1**: Push notifications sent to agency administrators for new jobs
- **Requirement 14.2**: Real-time status updates broadcast via Supabase Realtime
- **Requirement 14.3**: Web application receives real-time job updates

## Testing

Unit tests are located in:
- `apps/web/src/app/api/notifications/route.test.ts`
- `apps/web/src/lib/notifications/service.test.ts`

Run tests with:
```bash
pnpm test
```
