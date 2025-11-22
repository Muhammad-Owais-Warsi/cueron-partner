/**
 * Notification Service
 * Handles creation and management of in-app notifications
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@repo/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Service role client for creating notifications (bypasses RLS)
const supabaseAdmin = createClient<Database>(supabaseUrl, supabaseServiceKey);

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

export interface CreateNotificationParams {
  userId: string;
  agencyId?: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sentVia?: string[];
}

export interface NotificationPreferences {
  userId: string;
  enablePush: boolean;
  enableEmail: boolean;
  enableSms: boolean;
  notificationTypes: {
    [key in NotificationType]?: boolean;
  };
}

/**
 * Create a new notification
 */
export async function createNotification(
  params: CreateNotificationParams
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: params.userId,
        agency_id: params.agencyId,
        title: params.title,
        message: params.message,
        type: params.type,
        related_entity_type: params.relatedEntityType,
        related_entity_id: params.relatedEntityId,
        sent_via: params.sentVia || [],
        is_read: false,
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data.id };
  } catch (error) {
    console.error('Unexpected error creating notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create notifications for all users in an agency with a specific role
 */
export async function createAgencyNotification(params: {
  agencyId: string;
  roles?: ('admin' | 'manager' | 'viewer')[];
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sentVia?: string[];
}): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    // Get all users in the agency with specified roles
    const { data: agencyUsers, error: usersError } = await supabaseAdmin
      .from('agency_users')
      .select('user_id')
      .eq('agency_id', params.agencyId)
      .eq('is_active', true)
      .in('role', params.roles || ['admin', 'manager', 'viewer']);

    if (usersError) {
      console.error('Error fetching agency users:', usersError);
      return { success: false, error: usersError.message };
    }

    if (!agencyUsers || agencyUsers.length === 0) {
      return { success: true, count: 0 };
    }

    // Create notifications for all users
    const notifications = agencyUsers.map((user) => ({
      user_id: user.user_id,
      agency_id: params.agencyId,
      title: params.title,
      message: params.message,
      type: params.type,
      related_entity_type: params.relatedEntityType,
      related_entity_id: params.relatedEntityId,
      sent_via: params.sentVia || [],
      is_read: false,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('notifications')
      .insert(notifications);

    if (insertError) {
      console.error('Error creating agency notifications:', insertError);
      return { success: false, error: insertError.message };
    }

    return { success: true, count: notifications.length };
  } catch (error) {
    console.error('Unexpected error creating agency notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create notification for an engineer
 */
export async function createEngineerNotification(params: {
  engineerId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: string;
  sentVia?: string[];
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    // Get engineer's user_id
    const { data: engineer, error: engineerError } = await supabaseAdmin
      .from('engineers')
      .select('user_id, agency_id')
      .eq('id', params.engineerId)
      .single();

    if (engineerError || !engineer?.user_id) {
      console.error('Error fetching engineer:', engineerError);
      return {
        success: false,
        error: engineerError?.message || 'Engineer not found',
      };
    }

    return createNotification({
      userId: engineer.user_id,
      agencyId: engineer.agency_id,
      title: params.title,
      message: params.message,
      type: params.type,
      relatedEntityType: params.relatedEntityType,
      relatedEntityId: params.relatedEntityId,
      sentVia: params.sentVia,
    });
  } catch (error) {
    console.error('Unexpected error creating engineer notification:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error marking notification as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const { data, error } = await supabaseAdmin
      .from('notifications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('is_read', false)
      .select('id');

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Unexpected error marking all notifications as read:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete old read notifications (cleanup)
 */
export async function deleteOldNotifications(
  daysOld: number = 30
): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .delete()
      .eq('is_read', true)
      .lt('read_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      console.error('Error deleting old notifications:', error);
      return { success: false, error: error.message };
    }

    return { success: true, count: data?.length || 0 };
  } catch (error) {
    console.error('Unexpected error deleting old notifications:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
