# Real-time Job Tracking System

This module implements comprehensive real-time tracking and notification functionality for the Cueron Partner Platform.

## Requirements Implemented

- **6.2**: Location tracking activation on 'travelling' status
- **6.4**: Real-time status broadcast via Supabase Realtime
- **14.2**: Status update broadcast to subscribed clients
- **14.3**: Real-time subscription delivery for web clients

## Architecture

The real-time system consists of three main components:

### 1. Channel Manager (`channels.ts`)
Manages Supabase Realtime channel subscriptions and broadcasts.

**Features:**
- Job-specific subscriptions (`job:{jobId}`)
- Agency-wide subscriptions (`agency:{agencyId}`)
- Engineer-specific subscriptions (`engineer:{engineerId}`)
- Table change subscriptions (Postgres changes)
- Automatic channel lifecycle management

**Usage:**
```typescript
import { getChannelManager } from '@/lib/realtime';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const channelManager = getChannelManager(supabase);

// Subscribe to job updates
channelManager.subscribeToJob(jobId, {
  onStatusUpdate: (payload) => {
    console.log('Job status changed:', payload);
  },
  onLocationUpdate: (payload) => {
    console.log('Engineer location updated:', payload);
  },
});

// Cleanup
await channelManager.unsubscribe(`job:${jobId}`);
```

### 2. Location Tracking Manager (`location-tracking.ts`)
Handles periodic location updates for engineers on jobs.

**Features:**
- Automatic location updates every 30 seconds (configurable)
- High-accuracy GPS tracking
- Real-time location broadcasting to job and agency channels
- Automatic cleanup on job completion

**Usage:**
```typescript
import { getLocationTrackingManager } from '@/lib/realtime';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const locationManager = getLocationTrackingManager(supabase);

// Start tracking when engineer starts travelling
await locationManager.startTracking(engineerId, jobId, {
  updateInterval: 30000, // 30 seconds
  highAccuracy: true,
});

// Stop tracking when job is completed
locationManager.stopTracking(engineerId);
```

### 3. Notification Manager (`notifications.ts`)
Manages real-time notification delivery and storage.

**Features:**
- Push notification delivery
- In-app notification storage
- Real-time notification subscriptions
- Notification read/unread tracking
- Bulk notification operations

**Usage:**
```typescript
import { getNotificationManager } from '@/lib/realtime';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();
const notificationManager = getNotificationManager(supabase);

// Send job assignment notification
await notificationManager.sendJobAssignmentNotification(engineerId, {
  job_id: jobId,
  job_number: 'JOB-2025-1234',
  client_name: 'ABC Cold Storage',
  urgency: 'urgent',
});

// Subscribe to notifications
notificationManager.subscribeToNotifications(userId, (notification) => {
  console.log('New notification:', notification);
});
```

## React Hooks (`hooks.ts`)

Convenient React hooks for using real-time functionality in components.

### `useJobUpdates(jobId)`
Subscribe to job status and location updates.

```typescript
const { status, location, lastUpdate } = useJobUpdates(jobId);
```

### `useAgencyUpdates(agencyId)`
Subscribe to agency-wide updates (job assignments, status changes, location updates).

```typescript
const { jobAssignments, statusUpdates, locationUpdates } = useAgencyUpdates(agencyId);
```

### `useLocationTracking(engineerId, jobId)`
Manage location tracking for an engineer.

```typescript
const { isTracking, startTracking, stopTracking, error } = useLocationTracking(engineerId, jobId);

// Start tracking
await startTracking();

// Stop tracking
stopTracking();
```

### `useNotifications(userId)`
Manage notifications for a user.

```typescript
const { 
  notifications, 
  unreadCount, 
  loading, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = useNotifications(userId);
```

### `usePresence(userId, userType)`
Track user online/offline presence.

```typescript
usePresence(userId, 'agency_user');
```

## Channel Naming Conventions

- **Job channels**: `job:{jobId}` - Job-specific updates
- **Agency channels**: `agency:{agencyId}` - Agency-wide updates
- **Engineer channels**: `engineer:{engineerId}` - Engineer-specific updates
- **User channels**: `user:{userId}` - User-specific notifications
- **Table channels**: `table:{tableName}:{filter}` - Database table changes

## Event Types

### Job Events
- `status_update` - Job status changed
- `location_update` - Engineer location updated
- `start_location_tracking` - Signal to start tracking
- `stop_location_tracking` - Signal to stop tracking

### Agency Events
- `job_assigned` - New job assigned to agency
- `job_status_changed` - Job status changed
- `engineer_location_updated` - Engineer location updated
- `payment_status_changed` - Payment status changed

### Engineer Events
- `job_assigned` - New job assigned to engineer
- `notification` - General notification

### Notification Events
- `notification` - New notification received

## Database Triggers

The system leverages Supabase database triggers for automatic broadcasting:

1. **Job Assignment Trigger** - Broadcasts when a job is assigned
2. **Job Status Change Trigger** - Broadcasts when job status changes
3. **Engineer Location Trigger** - Broadcasts when engineer location updates
4. **Payment Status Trigger** - Broadcasts when payment status changes

These triggers are defined in `supabase/migrations/00005_realtime_setup.sql`.

## API Integration

### Job Status Route
The job status API route (`/api/jobs/[id]/status`) automatically:
- Broadcasts status changes to job and agency channels
- Signals location tracking start when status changes to 'travelling'
- Signals location tracking stop when job is completed/cancelled

### Engineer Location Route
The engineer location API route (`/api/engineers/[id]/location`) automatically:
- Updates engineer location in database
- Broadcasts location to job and agency channels (if on a job)
- Records timestamp of location update

## Best Practices

1. **Always cleanup subscriptions**: Use the cleanup function returned by hooks or call `unsubscribe()` manually
2. **Handle connection errors**: Supabase Realtime will automatically reconnect, but handle errors gracefully
3. **Limit subscription scope**: Only subscribe to channels you need to reduce overhead
4. **Use singleton managers**: The manager instances are singletons to prevent duplicate subscriptions
5. **Test with multiple clients**: Ensure broadcasts work across different browser tabs/devices

## Testing

To test real-time functionality:

1. Open multiple browser tabs/windows
2. Perform actions in one tab (e.g., update job status)
3. Verify updates appear in other tabs in real-time
4. Check browser console for broadcast messages
5. Monitor Supabase Realtime dashboard for active connections

## Performance Considerations

- Location updates occur every 30 seconds by default (configurable)
- Notification history is limited to last 20 by default
- Location update history is limited to last 100 per engineer
- Channels are automatically cleaned up on component unmount
- Database triggers use `pg_notify` for efficient broadcasting

## Security

- All channels respect Row Level Security (RLS) policies
- Users can only subscribe to channels they have access to
- Location data is only broadcast to authorized agency users
- Notifications are user-specific and isolated

## Troubleshooting

**Subscriptions not receiving updates:**
- Check Supabase Realtime is enabled for the table
- Verify RLS policies allow access
- Check browser console for connection errors
- Ensure channel names match exactly

**Location tracking not working:**
- Check browser geolocation permissions
- Verify HTTPS connection (required for geolocation)
- Check for JavaScript errors in console
- Ensure engineer is in 'travelling' status

**Notifications not appearing:**
- Verify user is subscribed to notifications
- Check notification table has correct user_id
- Ensure database triggers are active
- Check for errors in notification manager

## Future Enhancements

- [ ] Add presence indicators for online users
- [ ] Implement typing indicators for chat
- [ ] Add connection quality monitoring
- [ ] Implement offline queue for failed broadcasts
- [ ] Add analytics for realtime usage
