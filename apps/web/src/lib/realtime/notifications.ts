/**
 * Real-time Notification Delivery System
 * Handles push notifications and in-app notification delivery
 * 
 * Requirement 14.1: Push notification for job assignments
 * Requirement 14.2: Status update broadcast
 * Requirement 14.3: Real-time subscription delivery
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@cueron/types';

export type NotificationType = 
  | 'job_assigned'
  | 'job_status_changed'
  | 'payment_received'
  | 'payment_pending'
  | 'engineer_location_updated'
  | 'system_alert';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export interface NotificationPayload {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  recipients: string[]; // Array of user IDs
}

/**
 * Notification Manager
 * Manages real-time notification delivery and storage
 */
export class NotificationManager {
  private supabase: SupabaseClient<Database>;
  private notificationCallbacks: Map<string, (notification: Notification) => void> = new Map();

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Send notification to specific users
   * Requirement 14.1: Job assignment notification
   * Requirement 14.3: Real-time subscription delivery
   */
  async sendNotification(payload: NotificationPayload): Promise<void> {
    const { type, title, message, data, recipients } = payload;

    // Create notification records in database
    const notifications = recipients.map((userId) => ({
      user_id: userId,
      type,
      title,
      message,
      data: data || {},
      read: false,
    }));

    const { error: insertError } = await this.supabase
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error creating notifications:', insertError);
      throw insertError;
    }

    // Broadcast to each recipient's channel
    for (const userId of recipients) {
      await this.broadcastToUser(userId, {
        type,
        title,
        message,
        data,
      });
    }
  }

  /**
   * Send job assignment notification
   * Requirement 14.1: Push notification for job assignments
   */
  async sendJobAssignmentNotification(
    engineerId: string,
    jobData: {
      job_id: string;
      job_number: string;
      client_name: string;
      scheduled_time?: string;
      urgency: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      type: 'job_assigned',
      title: 'New Job Assignment',
      message: `You have been assigned to job ${jobData.job_number} for ${jobData.client_name}`,
      data: jobData,
      recipients: [engineerId],
    });
  }

  /**
   * Send job status change notification
   * Requirement 14.2: Status update broadcast
   */
  async sendJobStatusNotification(
    agencyUserIds: string[],
    jobData: {
      job_id: string;
      job_number: string;
      old_status: string;
      new_status: string;
      engineer_name?: string;
    }
  ): Promise<void> {
    await this.sendNotification({
      type: 'job_status_changed',
      title: 'Job Status Updated',
      message: `Job ${jobData.job_number} status changed from ${jobData.old_status} to ${jobData.new_status}`,
      data: jobData,
      recipients: agencyUserIds,
    });
  }

  /**
   * Send payment notification
   */
  async sendPaymentNotification(
    agencyUserIds: string[],
    paymentData: {
      payment_id: string;
      job_id?: string;
      amount: number;
      status: string;
    }
  ): Promise<void> {
    const isPending = paymentData.status === 'pending';
    
    await this.sendNotification({
      type: isPending ? 'payment_pending' : 'payment_received',
      title: isPending ? 'Payment Pending' : 'Payment Received',
      message: isPending
        ? `Payment of ₹${paymentData.amount} is pending`
        : `Payment of ₹${paymentData.amount} has been received`,
      data: paymentData,
      recipients: agencyUserIds,
    });
  }

  /**
   * Broadcast notification to user's channel
   */
  private async broadcastToUser(
    userId: string,
    notification: {
      type: NotificationType;
      title: string;
      message: string;
      data?: Record<string, any>;
    }
  ): Promise<void> {
    const channel = this.supabase.channel(`user:${userId}`);

    await channel.send({
      type: 'broadcast',
      event: 'notification',
      payload: {
        ...notification,
        timestamp: new Date().toISOString(),
      },
    });
  }

  /**
   * Subscribe to notifications for a user
   * Requirement 14.3: Real-time subscription delivery
   */
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ): void {
    this.notificationCallbacks.set(userId, callback);

    // Subscribe to user's notification channel
    const channel = this.supabase.channel(`user:${userId}`);

    channel
      .on('broadcast', { event: 'notification' }, ({ payload }) => {
        callback(payload as Notification);
      })
      .subscribe();

    // Also subscribe to database changes for notifications table
    this.supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }

  /**
   * Unsubscribe from notifications
   */
  async unsubscribeFromNotifications(userId: string): Promise<void> {
    this.notificationCallbacks.delete(userId);

    // Remove channels
    await this.supabase.removeChannel(
      this.supabase.channel(`user:${userId}`)
    );
    await this.supabase.removeChannel(
      this.supabase.channel(`notifications:${userId}`)
    );
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }

    return count || 0;
  }

  /**
   * Get recent notifications for a user
   */
  async getRecentNotifications(
    userId: string,
    limit: number = 20
  ): Promise<Notification[]> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data as Notification[];
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Delete all notifications for a user
   */
  async deleteAllNotifications(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting all notifications:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance for notification management
 */
let notificationManager: NotificationManager | null = null;

export function getNotificationManager(
  supabase: SupabaseClient<Database>
): NotificationManager {
  if (!notificationManager) {
    notificationManager = new NotificationManager(supabase);
  }
  return notificationManager;
}

/**
 * Reset notification manager (useful for testing or logout)
 */
export function resetNotificationManager(): void {
  notificationManager = null;
}
