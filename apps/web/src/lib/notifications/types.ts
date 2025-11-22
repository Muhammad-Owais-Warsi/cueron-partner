/**
 * Notification Types
 */

export type NotificationType =
  | 'job_assigned'
  | 'job_accepted'
  | 'job_status_update'
  | 'job_completed'
  | 'payment_received'
  | 'payment_pending'
  | 'engineer_added'
  | 'agency_approved'
  | 'system_alert';

export interface NotificationPreferences {
  userId: string;
  enablePush: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  notificationTypes: {
    [key in NotificationType]?: boolean;
  };
}

export interface NotificationListItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  readAt?: string;
  relatedEntityType?: string;
  relatedEntityId?: string;
  createdAt: string;
}
