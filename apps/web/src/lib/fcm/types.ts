/**
 * Firebase Cloud Messaging Type Definitions
 * 
 * Requirement 14.5: Notification content formatting
 */

/**
 * FCM Notification Priority
 */
export type FCMPriority = 'high' | 'normal';

/**
 * FCM Notification Data
 */
export interface FCMNotificationData {
  [key: string]: string;
}

/**
 * FCM Notification Payload
 */
export interface FCMNotification {
  title: string;
  body: string;
  sound?: string;
  badge?: string;
  icon?: string;
  click_action?: string;
}

/**
 * FCM Message Payload
 */
export interface FCMMessage {
  to?: string; // Single device token
  registration_ids?: string[]; // Multiple device tokens
  notification?: FCMNotification;
  data?: FCMNotificationData;
  priority?: FCMPriority;
  content_available?: boolean;
  mutable_content?: boolean;
  time_to_live?: number; // TTL in seconds
}

/**
 * FCM Send Response
 */
export interface FCMResponse {
  multicast_id?: number;
  success: number;
  failure: number;
  canonical_ids?: number;
  results?: Array<{
    message_id?: string;
    registration_id?: string;
    error?: string;
  }>;
}

/**
 * Push Notification Content
 * Requirement 14.5: Notification content completeness
 */
export interface PushNotificationContent {
  title: string;
  body: string;
  data?: Record<string, any>;
  priority?: FCMPriority;
  sound?: string;
  badge?: number;
}

/**
 * Job Assignment Notification Data
 * Requirement 14.1: Job assignment notification
 */
export interface JobAssignmentNotificationData {
  type: 'job_assigned';
  job_id: string;
  job_number: string;
  client_name: string;
  scheduled_time?: string;
  urgency: string;
  location?: {
    address: string;
    lat: number;
    lng: number;
  };
}

/**
 * Job Status Update Notification Data
 * Requirement 14.2: Status update notification
 */
export interface JobStatusNotificationData {
  type: 'job_status_changed';
  job_id: string;
  job_number: string;
  old_status: string;
  new_status: string;
  engineer_name?: string;
}

/**
 * Payment Notification Data
 */
export interface PaymentNotificationData {
  type: 'payment_received' | 'payment_pending';
  payment_id: string;
  job_id?: string;
  amount: number;
  status: string;
}

/**
 * Union type for all notification data types
 */
export type NotificationData =
  | JobAssignmentNotificationData
  | JobStatusNotificationData
  | PaymentNotificationData;
