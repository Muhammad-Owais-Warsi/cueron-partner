/**
 * Push Notification Service
 * High-level service for sending push notifications
 * 
 * Requirement 14.1: Push notification for job assignments
 * Requirement 14.5: Notification content formatting
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@cueron/types';
import { getFCMClient } from './client';
import {
  formatJobAssignmentNotification,
  formatJobStatusNotification,
  formatPaymentNotification,
  formatSystemAlertNotification,
  validateNotificationContent,
} from './formatter';
import type {
  PushNotificationContent,
  JobAssignmentNotificationData,
  JobStatusNotificationData,
  PaymentNotificationData,
  FCMResponse,
} from './types';

/**
 * Push Notification Service
 * Manages sending push notifications to users
 */
export class PushNotificationService {
  private supabase: SupabaseClient<Database>;
  private fcmClient: ReturnType<typeof getFCMClient>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
    this.fcmClient = getFCMClient();
  }

  /**
   * Get active FCM tokens for a user
   * 
   * @param userId - User ID
   * @returns Array of active FCM tokens
   */
  private async getUserTokens(userId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('fcm_tokens')
      .select('token')
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching FCM tokens:', error);
      return [];
    }

    return data?.map((row) => row.token) || [];
  }

  /**
   * Get active FCM tokens for multiple users
   * 
   * @param userIds - Array of user IDs
   * @returns Array of active FCM tokens
   */
  private async getMultipleUserTokens(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const { data, error } = await this.supabase
      .from('fcm_tokens')
      .select('token')
      .in('user_id', userIds)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching FCM tokens:', error);
      return [];
    }

    return data?.map((row) => row.token) || [];
  }

  /**
   * Send push notification to a single user
   * 
   * @param userId - User ID
   * @param content - Notification content
   * @returns FCM response
   */
  async sendToUser(
    userId: string,
    content: PushNotificationContent
  ): Promise<FCMResponse> {
    // Validate content
    if (!validateNotificationContent(content)) {
      throw new Error('Invalid notification content');
    }

    // Get user's FCM tokens
    const tokens = await this.getUserTokens(userId);

    if (tokens.length === 0) {
      console.warn(`No active FCM tokens found for user ${userId}`);
      return {
        success: 0,
        failure: 0,
      };
    }

    // Send to all user's devices
    return this.fcmClient.sendToDevices(tokens, content);
  }

  /**
   * Send push notification to multiple users
   * 
   * @param userIds - Array of user IDs
   * @param content - Notification content
   * @returns FCM response
   */
  async sendToUsers(
    userIds: string[],
    content: PushNotificationContent
  ): Promise<FCMResponse> {
    // Validate content
    if (!validateNotificationContent(content)) {
      throw new Error('Invalid notification content');
    }

    // Get all users' FCM tokens
    const tokens = await this.getMultipleUserTokens(userIds);

    if (tokens.length === 0) {
      console.warn(`No active FCM tokens found for users`);
      return {
        success: 0,
        failure: 0,
      };
    }

    // Send to all devices
    return this.fcmClient.sendToDevices(tokens, content);
  }

  /**
   * Send job assignment notification to engineer
   * Requirement 14.1: Job assignment notification
   * 
   * @param engineerId - Engineer user ID
   * @param jobData - Job assignment data
   * @returns FCM response
   */
  async sendJobAssignmentNotification(
    engineerId: string,
    jobData: Omit<JobAssignmentNotificationData, 'type'>
  ): Promise<FCMResponse> {
    const content = formatJobAssignmentNotification(jobData);
    return this.sendToUser(engineerId, content);
  }

  /**
   * Send job status update notification to agency users
   * Requirement 14.2: Status update notification
   * 
   * @param agencyUserIds - Array of agency user IDs
   * @param jobData - Job status data
   * @returns FCM response
   */
  async sendJobStatusNotification(
    agencyUserIds: string[],
    jobData: Omit<JobStatusNotificationData, 'type'>
  ): Promise<FCMResponse> {
    const content = formatJobStatusNotification(jobData);
    return this.sendToUsers(agencyUserIds, content);
  }

  /**
   * Send payment notification to agency users
   * 
   * @param agencyUserIds - Array of agency user IDs
   * @param paymentData - Payment data
   * @returns FCM response
   */
  async sendPaymentNotification(
    agencyUserIds: string[],
    paymentData: Omit<PaymentNotificationData, 'type'>
  ): Promise<FCMResponse> {
    const content = formatPaymentNotification(paymentData);
    return this.sendToUsers(agencyUserIds, content);
  }

  /**
   * Send system alert notification
   * 
   * @param userIds - Array of user IDs
   * @param title - Alert title
   * @param message - Alert message
   * @param data - Additional data
   * @returns FCM response
   */
  async sendSystemAlert(
    userIds: string[],
    title: string,
    message: string,
    data?: Record<string, any>
  ): Promise<FCMResponse> {
    const content = formatSystemAlertNotification(title, message, data);
    return this.sendToUsers(userIds, content);
  }

  /**
   * Handle failed token (mark as inactive)
   * Should be called when FCM returns an error for a specific token
   * 
   * @param token - FCM token that failed
   */
  async handleFailedToken(token: string): Promise<void> {
    const { error } = await this.supabase
      .from('fcm_tokens')
      .update({ is_active: false })
      .eq('token', token);

    if (error) {
      console.error('Error marking token as inactive:', error);
    }
  }

  /**
   * Clean up inactive tokens
   * Remove tokens that haven't been used in a specified number of days
   * 
   * @param daysInactive - Number of days of inactivity
   */
  async cleanupInactiveTokens(daysInactive: number = 90): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysInactive);

    const { error } = await this.supabase
      .from('fcm_tokens')
      .delete()
      .eq('is_active', false)
      .lt('updated_at', cutoffDate.toISOString());

    if (error) {
      console.error('Error cleaning up inactive tokens:', error);
    }
  }
}

/**
 * Create push notification service instance
 */
export function createPushNotificationService(
  supabase: SupabaseClient<Database>
): PushNotificationService {
  return new PushNotificationService(supabase);
}

/**
 * Singleton push notification service instance
 */
let pushNotificationService: PushNotificationService | null = null;

/**
 * Get singleton push notification service instance
 */
export function getPushNotificationService(
  supabase: SupabaseClient<Database>
): PushNotificationService {
  if (!pushNotificationService) {
    pushNotificationService = createPushNotificationService(supabase);
  }
  return pushNotificationService;
}

/**
 * Reset push notification service (useful for testing)
 */
export function resetPushNotificationService(): void {
  pushNotificationService = null;
}
