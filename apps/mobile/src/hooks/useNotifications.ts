/**
 * useNotifications Hook
 * Manages notification state and handlers
 * 
 * Requirements:
 * - 5.1: Handle notification tap navigation
 * - 14.1: Display push notifications
 * - 14.5: Parse notification content
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NavigationProp } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import {
  initializePushNotifications,
  parseNotificationData,
  NotificationData,
} from '../lib/notifications';

export function useNotifications() {
  const navigation = useNavigation<NavigationProp<any>>();
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [notificationData, setNotificationData] = useState<NotificationData | null>(null);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    // Initialize push notifications
    initializePushNotifications();

    // Listener for notifications received while app is in foreground
    // Requirement 14.1: Implement foreground notification display
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification: Notifications.Notification) => {
        console.log('Notification received (foreground):', notification);
        setNotification(notification);
        
        const data = parseNotificationData(notification);
        if (data) {
          setNotificationData(data);
        }
      }
    );

    // Listener for notification tap/interaction
    // Requirement 5.1: Implement notification tap navigation to relevant screens
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response: Notifications.NotificationResponse) => {
        console.log('Notification tapped:', response);
        const notification = response.notification;
        const data = parseNotificationData(notification);

        if (data) {
          handleNotificationNavigation(data);
        }
      }
    );

    // Check if app was opened from a notification (quit state)
    // Requirement 5.1: Handle background and quit state notifications
    Notifications.getLastNotificationResponseAsync().then((response: Notifications.NotificationResponse | null) => {
      if (response) {
        console.log('App opened from notification (quit state):', response);
        const data = parseNotificationData(response.notification);
        if (data) {
          // Delay navigation to ensure navigation is ready
          setTimeout(() => {
            handleNotificationNavigation(data);
          }, 1000);
        }
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  /**
   * Handle navigation based on notification type
   * Requirement 5.1: Navigate to relevant screens based on notification
   */
  const handleNotificationNavigation = (data: NotificationData) => {
    try {
      if (data.type === 'job_assigned') {
        // Navigate to job detail screen
        navigation.navigate('Jobs', {
          screen: 'JobDetail',
          params: { jobId: data.job_id },
        });
      } else if (data.type === 'job_status_changed') {
        // Navigate to job detail screen
        navigation.navigate('Jobs', {
          screen: 'JobDetail',
          params: { jobId: data.job_id },
        });
      }
    } catch (error) {
      console.error('Error navigating from notification:', error);
    }
  };

  /**
   * Dismiss current notification
   */
  const dismissNotification = async (notificationId: string) => {
    try {
      await Notifications.dismissNotificationAsync(notificationId);
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  /**
   * Dismiss all notifications
   */
  const dismissAllNotifications = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing all notifications:', error);
    }
  };

  /**
   * Get badge count
   */
  const getBadgeCount = async (): Promise<number> => {
    try {
      return await Notifications.getBadgeCountAsync();
    } catch (error) {
      console.error('Error getting badge count:', error);
      return 0;
    }
  };

  /**
   * Set badge count
   */
  const setBadgeCount = async (count: number) => {
    try {
      await Notifications.setBadgeCountAsync(count);
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  };

  return {
    notification,
    notificationData,
    dismissNotification,
    dismissAllNotifications,
    getBadgeCount,
    setBadgeCount,
  };
}
