/**
 * Push Notification Content Formatter
 * Formats notification content for different event types
 * 
 * Requirement 14.5: Notification content completeness
 */

import type {
  PushNotificationContent,
  JobAssignmentNotificationData,
  JobStatusNotificationData,
  PaymentNotificationData,
  NotificationData,
} from './types';

/**
 * Format job assignment notification
 * Requirement 14.1: Job assignment notification
 * Requirement 14.5: Notification content includes job details and action links
 */
export function formatJobAssignmentNotification(
  data: Omit<JobAssignmentNotificationData, 'type'>
): PushNotificationContent {
  const { job_number, client_name, scheduled_time, urgency } = data;

  let body = `You have been assigned to job ${job_number} for ${client_name}.`;

  if (scheduled_time) {
    const scheduledDate = new Date(scheduled_time);
    body += ` Scheduled for ${scheduledDate.toLocaleDateString()} at ${scheduledDate.toLocaleTimeString()}.`;
  }

  if (urgency === 'emergency') {
    body = `🚨 URGENT: ${body}`;
  }

  return {
    title: urgency === 'emergency' ? 'Emergency Job Assignment' : 'New Job Assignment',
    body,
    data: {
      ...data,
      type: 'job_assigned',
      action: 'view_job',
      click_action: `job_details_${data.job_id}`,
    },
    priority: urgency === 'emergency' ? 'high' : 'normal',
    sound: urgency === 'emergency' ? 'urgent' : 'default',
  };
}

/**
 * Format job status update notification
 * Requirement 14.2: Status update notification
 * Requirement 14.5: Notification content completeness
 */
export function formatJobStatusNotification(
  data: Omit<JobStatusNotificationData, 'type'>
): PushNotificationContent {
  const { job_number, old_status, new_status, engineer_name } = data;

  const statusMessages: Record<string, string> = {
    assigned: 'has been assigned',
    accepted: 'has been accepted',
    travelling: 'is on the way',
    onsite: 'has arrived on site',
    completed: 'has been completed',
    cancelled: 'has been cancelled',
  };

  const statusMessage = statusMessages[new_status] || `changed to ${new_status}`;
  
  let body = `Job ${job_number} ${statusMessage}`;
  
  if (engineer_name && new_status !== 'completed' && new_status !== 'cancelled') {
    body += ` by ${engineer_name}`;
  }

  body += '.';

  return {
    title: 'Job Status Update',
    body,
    data: {
      ...data,
      type: 'job_status_changed',
      action: 'view_job',
      click_action: `job_details_${data.job_id}`,
    },
    priority: 'normal',
    sound: 'default',
  };
}

/**
 * Format payment notification
 * Requirement 14.5: Notification content completeness
 */
export function formatPaymentNotification(
  data: Omit<PaymentNotificationData, 'type'>
): PushNotificationContent {
  const { amount, status, job_id } = data;
  const isPending = status === 'pending';

  const formattedAmount = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

  let body = isPending
    ? `Payment of ${formattedAmount} is pending`
    : `Payment of ${formattedAmount} has been received`;

  if (job_id) {
    body += ' for your completed job';
  }

  body += '.';

  return {
    title: isPending ? 'Payment Pending' : 'Payment Received',
    body,
    data: {
      ...data,
      type: isPending ? 'payment_pending' : 'payment_received',
      action: 'view_payment',
      click_action: `payment_details_${data.payment_id}`,
    },
    priority: 'normal',
    sound: 'default',
  };
}

/**
 * Format system alert notification
 */
export function formatSystemAlertNotification(
  title: string,
  message: string,
  data?: Record<string, any>
): PushNotificationContent {
  return {
    title,
    body: message,
    data: {
      ...data,
      type: 'system_alert',
      action: 'view_notification',
    },
    priority: 'high',
    sound: 'default',
  };
}

/**
 * Format notification based on type
 * Generic formatter that routes to specific formatters
 */
export function formatNotification(
  notificationData: NotificationData
): PushNotificationContent {
  switch (notificationData.type) {
    case 'job_assigned':
      return formatJobAssignmentNotification(notificationData);
    
    case 'job_status_changed':
      return formatJobStatusNotification(notificationData);
    
    case 'payment_received':
    case 'payment_pending':
      return formatPaymentNotification(notificationData);
    
    default:
      // Fallback for unknown types
      return {
        title: 'Notification',
        body: 'You have a new notification',
        data: notificationData,
        priority: 'normal',
        sound: 'default',
      };
  }
}

/**
 * Validate notification content
 * Ensures all required fields are present
 */
export function validateNotificationContent(
  content: PushNotificationContent
): boolean {
  if (!content.title || content.title.trim().length === 0) {
    return false;
  }

  if (!content.body || content.body.trim().length === 0) {
    return false;
  }

  // Title should not exceed 65 characters (FCM recommendation)
  if (content.title.length > 65) {
    return false;
  }

  // Body should not exceed 240 characters (FCM recommendation)
  if (content.body.length > 240) {
    return false;
  }

  return true;
}
