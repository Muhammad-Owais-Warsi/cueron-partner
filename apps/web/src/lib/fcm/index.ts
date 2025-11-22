/**
 * Firebase Cloud Messaging Module
 * Push notification infrastructure for the Cueron Partner Platform
 * 
 * Requirement 14.1: Push notification infrastructure
 * Requirement 14.5: Notification content formatting
 */

// Configuration
export { getFCMConfig, validateFCMConfig, FCM_API_ENDPOINT } from './config';
export type { FCMConfig } from './config';

// Types
export type {
  FCMPriority,
  FCMNotificationData,
  FCMNotification,
  FCMMessage,
  FCMResponse,
  PushNotificationContent,
  JobAssignmentNotificationData,
  JobStatusNotificationData,
  PaymentNotificationData,
  NotificationData,
} from './types';

// Client
export {
  FCMClient,
  createFCMClient,
  getFCMClient,
  resetFCMClient,
} from './client';

// Formatter
export {
  formatJobAssignmentNotification,
  formatJobStatusNotification,
  formatPaymentNotification,
  formatSystemAlertNotification,
  formatNotification,
  validateNotificationContent,
} from './formatter';

// Service
export {
  PushNotificationService,
  createPushNotificationService,
  getPushNotificationService,
  resetPushNotificationService,
} from './service';
