/**
 * Supabase Realtime Channel Management
 * Provides utilities for managing realtime subscriptions and broadcasts
 * 
 * Requirements: 6.2, 6.4, 14.2, 14.3
 */

import { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@cueron/types';

export type RealtimeEvent = 
  | 'job_status_changed'
  | 'job_assigned'
  | 'engineer_location_updated'
  | 'payment_status_changed'
  | 'notification_received';

export interface JobStatusPayload {
  job_id: string;
  status: string;
  timestamp: string;
  location?: {
    lat: number;
    lng: number;
  };
  changed_by: string;
}

export interface EngineerLocationPayload {
  engineer_id: string;
  engineer_name: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  timestamp: string;
}

export interface JobAssignmentPayload {
  job_id: string;
  job_number: string;
  urgency: string;
  scheduled_time?: string;
  engineer_id?: string;
}

export interface PaymentStatusPayload {
  payment_id: string;
  job_id?: string;
  status: string;
  amount: number;
}

export interface NotificationPayload {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, any>;
  created_at: string;
}

/**
 * Channel Manager for Realtime Subscriptions
 * Manages lifecycle of realtime channels and subscriptions
 */
export class RealtimeChannelManager {
  private channels: Map<string, RealtimeChannel> = new Map();
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }

  /**
   * Subscribe to job-specific updates
   * Requirement 6.4: Real-time status broadcast
   */
  subscribeToJob(
    jobId: string,
    callbacks: {
      onStatusUpdate?: (payload: JobStatusPayload) => void;
      onLocationUpdate?: (payload: EngineerLocationPayload) => void;
    }
  ): RealtimeChannel {
    const channelName = `job:${jobId}`;
    
    // Check if channel already exists
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'status_update' }, ({ payload }) => {
        callbacks.onStatusUpdate?.(payload as JobStatusPayload);
      })
      .on('broadcast', { event: 'location_update' }, ({ payload }) => {
        callbacks.onLocationUpdate?.(payload as EngineerLocationPayload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to agency-wide updates
   * Requirement 14.2: Status update broadcast
   * Requirement 14.3: Real-time subscription delivery
   */
  subscribeToAgency(
    agencyId: string,
    callbacks: {
      onJobAssigned?: (payload: JobAssignmentPayload) => void;
      onJobStatusChanged?: (payload: JobStatusPayload) => void;
      onEngineerLocationUpdated?: (payload: EngineerLocationPayload) => void;
      onPaymentStatusChanged?: (payload: PaymentStatusPayload) => void;
    }
  ): RealtimeChannel {
    const channelName = `agency:${agencyId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'job_assigned' }, ({ payload }) => {
        callbacks.onJobAssigned?.(payload as JobAssignmentPayload);
      })
      .on('broadcast', { event: 'job_status_changed' }, ({ payload }) => {
        callbacks.onJobStatusChanged?.(payload as JobStatusPayload);
      })
      .on('broadcast', { event: 'engineer_location_updated' }, ({ payload }) => {
        callbacks.onEngineerLocationUpdated?.(payload as EngineerLocationPayload);
      })
      .on('broadcast', { event: 'payment_status_changed' }, ({ payload }) => {
        callbacks.onPaymentStatusChanged?.(payload as PaymentStatusPayload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to engineer-specific updates
   * Used by mobile app for job assignments and notifications
   */
  subscribeToEngineer(
    engineerId: string,
    callbacks: {
      onJobAssigned?: (payload: JobAssignmentPayload) => void;
      onNotification?: (payload: NotificationPayload) => void;
    }
  ): RealtimeChannel {
    const channelName = `engineer:${engineerId}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    const channel = this.supabase
      .channel(channelName)
      .on('broadcast', { event: 'job_assigned' }, ({ payload }) => {
        callbacks.onJobAssigned?.(payload as JobAssignmentPayload);
      })
      .on('broadcast', { event: 'notification' }, ({ payload }) => {
        callbacks.onNotification?.(payload as NotificationPayload);
      })
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Subscribe to database table changes
   * Uses Postgres changes instead of broadcast
   */
  subscribeToTableChanges<T extends keyof Database['public']['Tables']>(
    table: T,
    filter: string,
    callbacks: {
      onInsert?: (payload: any) => void;
      onUpdate?: (payload: any) => void;
      onDelete?: (payload: any) => void;
    }
  ): RealtimeChannel {
    const channelName = `table:${table}:${filter}`;
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName)!;
    }

    let channel = this.supabase.channel(channelName);

    if (callbacks.onInsert) {
      channel = channel.on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table, filter },
        (payload) => callbacks.onInsert!(payload)
      );
    }

    if (callbacks.onUpdate) {
      channel = channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table, filter },
        (payload) => callbacks.onUpdate!(payload)
      );
    }

    if (callbacks.onDelete) {
      channel = channel.on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table, filter },
        (payload) => callbacks.onDelete!(payload)
      );
    }

    channel.subscribe();
    this.channels.set(channelName, channel);
    return channel;
  }

  /**
   * Broadcast message to a channel
   * Used by API routes to send realtime updates
   */
  async broadcast(
    channelName: string,
    event: string,
    payload: any
  ): Promise<void> {
    const channel = this.supabase.channel(channelName);
    
    await channel.send({
      type: 'broadcast',
      event,
      payload,
    });
  }

  /**
   * Unsubscribe from a specific channel
   */
  async unsubscribe(channelName: string): Promise<void> {
    const channel = this.channels.get(channelName);
    
    if (channel) {
      await this.supabase.removeChannel(channel);
      this.channels.delete(channelName);
    }
  }

  /**
   * Unsubscribe from all channels
   * Should be called on component unmount or logout
   */
  async unsubscribeAll(): Promise<void> {
    const unsubscribePromises = Array.from(this.channels.values()).map(
      (channel) => this.supabase.removeChannel(channel)
    );
    
    await Promise.all(unsubscribePromises);
    this.channels.clear();
  }

  /**
   * Get active channel count
   */
  getActiveChannelCount(): number {
    return this.channels.size;
  }

  /**
   * Check if subscribed to a channel
   */
  isSubscribed(channelName: string): boolean {
    return this.channels.has(channelName);
  }
}

/**
 * Create a singleton instance for the web application
 */
let channelManager: RealtimeChannelManager | null = null;

export function getChannelManager(supabase: SupabaseClient<Database>): RealtimeChannelManager {
  if (!channelManager) {
    channelManager = new RealtimeChannelManager(supabase);
  }
  return channelManager;
}

/**
 * Reset channel manager (useful for testing or logout)
 */
export function resetChannelManager(): void {
  channelManager = null;
}
