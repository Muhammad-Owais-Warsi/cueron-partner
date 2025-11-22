/**
 * Real-time Tracking and Notification System
 * Central export for all realtime functionality
 * 
 * Requirements: 6.2, 6.4, 14.2, 14.3
 */

export {
  RealtimeChannelManager,
  getChannelManager,
  resetChannelManager,
  type RealtimeEvent,
  type JobStatusPayload,
  type EngineerLocationPayload,
  type JobAssignmentPayload,
  type PaymentStatusPayload,
  type NotificationPayload as RealtimeNotificationPayload,
} from './channels';

export {
  LocationTrackingManager,
  getLocationTrackingManager,
  resetLocationTrackingManager,
  type LocationUpdate,
  type LocationTrackingOptions,
} from './location-tracking';

export {
  NotificationManager,
  getNotificationManager,
  resetNotificationManager,
  type NotificationType,
  type Notification,
  type NotificationPayload,
} from './notifications';
