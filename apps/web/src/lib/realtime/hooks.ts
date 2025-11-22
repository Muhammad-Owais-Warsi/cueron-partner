/**
 * React Hooks for Real-time Functionality
 * Provides easy-to-use hooks for realtime subscriptions in React components
 * 
 * Requirements: 6.2, 6.4, 14.2, 14.3
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  getChannelManager,
  getLocationTrackingManager,
  getNotificationManager,
  type JobStatusPayload,
  type EngineerLocationPayload,
  type JobAssignmentPayload,
  type Notification,
} from './index';

/**
 * Hook to subscribe to job updates
 * Requirement 6.4: Real-time status broadcast
 */
export function useJobUpdates(jobId: string | null) {
  const [status, setStatus] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) return;

    const supabase = createClient();
    const channelManager = getChannelManager(supabase);

    channelManager.subscribeToJob(jobId, {
      onStatusUpdate: (payload: JobStatusPayload) => {
        setStatus(payload.status);
        setLastUpdate(payload.timestamp);
        if (payload.location) {
          setLocation(payload.location);
        }
      },
      onLocationUpdate: (payload: EngineerLocationPayload) => {
        const [lng, lat] = payload.location.coordinates;
        setLocation({ lat, lng });
        setLastUpdate(payload.timestamp);
      },
    });

    return () => {
      channelManager.unsubscribe(`job:${jobId}`);
    };
  }, [jobId]);

  return { status, location, lastUpdate };
}

/**
 * Hook to subscribe to agency-wide updates
 * Requirement 14.2: Status update broadcast
 * Requirement 14.3: Real-time subscription delivery
 */
export function useAgencyUpdates(agencyId: string | null) {
  const [jobAssignments, setJobAssignments] = useState<JobAssignmentPayload[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<JobStatusPayload[]>([]);
  const [locationUpdates, setLocationUpdates] = useState<EngineerLocationPayload[]>([]);

  useEffect(() => {
    if (!agencyId) return;

    const supabase = createClient();
    const channelManager = getChannelManager(supabase);

    channelManager.subscribeToAgency(agencyId, {
      onJobAssigned: (payload: JobAssignmentPayload) => {
        setJobAssignments((prev) => [payload, ...prev].slice(0, 50)); // Keep last 50
      },
      onJobStatusChanged: (payload: JobStatusPayload) => {
        setStatusUpdates((prev) => [payload, ...prev].slice(0, 50));
      },
      onEngineerLocationUpdated: (payload: EngineerLocationPayload) => {
        setLocationUpdates((prev) => {
          // Update or add engineer location
          const filtered = prev.filter((loc) => loc.engineer_id !== payload.engineer_id);
          return [payload, ...filtered].slice(0, 100); // Keep last 100
        });
      },
    });

    return () => {
      channelManager.unsubscribe(`agency:${agencyId}`);
    };
  }, [agencyId]);

  return { jobAssignments, statusUpdates, locationUpdates };
}

/**
 * Hook to manage location tracking
 * Requirement 6.2: Location tracking activation on 'travelling' status
 */
export function useLocationTracking(engineerId: string | null, jobId: string | null) {
  const [isTracking, setIsTracking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackingManagerRef = useRef<ReturnType<typeof getLocationTrackingManager> | null>(null);

  useEffect(() => {
    const supabase = createClient();
    trackingManagerRef.current = getLocationTrackingManager(supabase);
  }, []);

  const startTracking = useCallback(async () => {
    if (!engineerId || !jobId || !trackingManagerRef.current) {
      setError('Missing engineer ID or job ID');
      return;
    }

    try {
      await trackingManagerRef.current.startTracking(engineerId, jobId);
      setIsTracking(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsTracking(false);
    }
  }, [engineerId, jobId]);

  const stopTracking = useCallback(() => {
    if (!engineerId || !trackingManagerRef.current) return;

    trackingManagerRef.current.stopTracking(engineerId);
    setIsTracking(false);
  }, [engineerId]);

  useEffect(() => {
    return () => {
      if (engineerId && trackingManagerRef.current) {
        trackingManagerRef.current.stopTracking(engineerId);
      }
    };
  }, [engineerId]);

  return { isTracking, startTracking, stopTracking, error };
}

/**
 * Hook to manage notifications
 * Requirement 14.3: Real-time subscription delivery
 */
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const notificationManagerRef = useRef<ReturnType<typeof getNotificationManager> | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const notificationManager = getNotificationManager(supabase);
    notificationManagerRef.current = notificationManager;

    // Load initial notifications
    const loadNotifications = async () => {
      const recent = await notificationManager.getRecentNotifications(userId, 20);
      setNotifications(recent);
      
      const count = await notificationManager.getUnreadCount(userId);
      setUnreadCount(count);
      
      setLoading(false);
    };

    loadNotifications();

    // Subscribe to new notifications
    notificationManager.subscribeToNotifications(userId, (notification) => {
      setNotifications((prev) => [notification, ...prev]);
      if (!notification.read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    return () => {
      notificationManager.unsubscribeFromNotifications(userId);
    };
  }, [userId]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!notificationManagerRef.current) return;

    await notificationManagerRef.current.markAsRead(notificationId);
    
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(async () => {
    if (!userId || !notificationManagerRef.current) return;

    await notificationManagerRef.current.markAllAsRead(userId);
    
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    if (!notificationManagerRef.current) return;

    await notificationManagerRef.current.deleteNotification(notificationId);
    
    setNotifications((prev) => {
      const notification = prev.find((n) => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== notificationId);
    });
  }, []);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}

/**
 * Hook to track online presence
 */
export function usePresence(userId: string | null, userType: 'agency_user' | 'engineer') {
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();

    // Update presence on mount
    const updatePresence = async () => {
      await supabase.rpc('update_user_presence', {
        p_user_id: userId,
        p_user_type: userType,
      });
    };

    updatePresence();

    // Update presence every 2 minutes
    const interval = setInterval(updatePresence, 2 * 60 * 1000);

    // Mark as offline on unmount
    return () => {
      clearInterval(interval);
      supabase.rpc('mark_user_offline', {
        p_user_id: userId,
        p_user_type: userType,
      });
    };
  }, [userId, userType]);
}

/**
 * Hook to subscribe to table changes
 */
export function useTableChanges<T>(
  table: string,
  filter: string,
  callbacks: {
    onInsert?: (record: T) => void;
    onUpdate?: (record: T) => void;
    onDelete?: (record: T) => void;
  }
) {
  useEffect(() => {
    const supabase = createClient();
    const channelManager = getChannelManager(supabase);

    channelManager.subscribeToTableChanges(table as any, filter, {
      onInsert: callbacks.onInsert ? (payload) => callbacks.onInsert!(payload.new as T) : undefined,
      onUpdate: callbacks.onUpdate ? (payload) => callbacks.onUpdate!(payload.new as T) : undefined,
      onDelete: callbacks.onDelete ? (payload) => callbacks.onDelete!(payload.old as T) : undefined,
    });

    return () => {
      channelManager.unsubscribe(`table:${table}:${filter}`);
    };
  }, [table, filter, callbacks]);
}
