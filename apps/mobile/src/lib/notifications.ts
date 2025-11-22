/**
 * Push Notification Service
 * Handles FCM token registration, notification permissions, and notification handling
 * 
 * Requirements:
 * - 5.1: Push notification display for job assignments
 * - 14.1: Job assignment notification
 * - 14.5: Notification content completeness
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

const FCM_TOKEN_KEY = '@cueron:fcm_token';

/**
 * Notification handler configuration
 * Requirement 5.1: Foreground notification display
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Notification data types
 */
export interface JobAssignmentNotification {
  type: 'job_assigned';
  job_id: string;
  job_number: string;
  client_name: string;
  scheduled_time?: string;
  urgency: string;
}

export interface JobStatusNotification {
  type: 'job_status_changed';
  job_id: string;
  job_number: string;
  old_status: string;
  new_status: string;
}

export type NotificationData = JobAssignmentNotification | JobStatusNotification;

/**
 * Request notification permissions
 * Requirement 5.1: Request notification permissions on app launch
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Failed to get push notification permissions');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

/**
 * Get Expo push token (FCM token)
 * Requirement 14.1: Register FCM token with backend
 */
export async function getExpoPushToken(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return null;
    }

    // Configure notification channel for Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PROJECT_ID || 'your-expo-project-id',
    });

    return tokenData.data;
  } catch (error) {
    console.error('Error getting Expo push token:', error);
    return null;
  }
}

/**
 * Register FCM token with backend
 * Requirement 14.1: Register FCM token with POST /api/fcm/register endpoint
 */
export async function registerFCMToken(token: string): Promise<boolean> {
  try {
    const deviceType = Platform.OS === 'ios' ? 'ios' : 'android';
    const deviceId = Device.modelId || undefined;

    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      console.warn('No active session, skipping FCM token registration');
      return false;
    }

    // Get the API URL from environment or construct it
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.SUPABASE_URL?.replace('/rest/v1', '');
    
    if (!apiUrl) {
      console.error('API URL not configured');
      return false;
    }

    // Make HTTP request to register token
    const response = await fetch(`${apiUrl}/api/fcm/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        token,
        device_type: deviceType,
        device_id: deviceId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error registering FCM token:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('FCM token registered successfully:', data);

    // Store token locally
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    return true;
  } catch (error) {
    console.error('Error in registerFCMToken:', error);
    return false;
  }
}

/**
 * Initialize push notifications
 * Requirement 5.1: Request permissions and register token on app launch
 */
export async function initializePushNotifications(): Promise<void> {
  try {
    // Request permissions
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      console.warn('Notification permissions not granted');
      return;
    }

    // Get push token
    const token = await getExpoPushToken();
    if (!token) {
      console.warn('Failed to get push token');
      return;
    }

    // Register token with backend
    await registerFCMToken(token);

    // Set up token refresh listener
    Notifications.addPushTokenListener(async (tokenData) => {
      console.log('Push token refreshed:', tokenData.data);
      await registerFCMToken(tokenData.data);
    });
  } catch (error) {
    console.error('Error initializing push notifications:', error);
  }
}

/**
 * Parse notification data
 * Requirement 14.5: Handle notification payload parsing
 */
export function parseNotificationData(
  notification: Notifications.Notification
): NotificationData | null {
  try {
    const data = notification.request.content.data;
    
    if (!data || typeof data !== 'object') {
      return null;
    }

    // Validate notification type
    if (data.type === 'job_assigned') {
      return {
        type: 'job_assigned',
        job_id: String(data.job_id || ''),
        job_number: String(data.job_number || ''),
        client_name: String(data.client_name || ''),
        scheduled_time: data.scheduled_time ? String(data.scheduled_time) : undefined,
        urgency: String(data.urgency || 'normal'),
      };
    }

    if (data.type === 'job_status_changed') {
      return {
        type: 'job_status_changed',
        job_id: String(data.job_id || ''),
        job_number: String(data.job_number || ''),
        old_status: String(data.old_status || ''),
        new_status: String(data.new_status || ''),
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing notification data:', error);
    return null;
  }
}

/**
 * Get stored FCM token
 */
export async function getStoredFCMToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Error getting stored FCM token:', error);
    return null;
  }
}

/**
 * Clear stored FCM token
 */
export async function clearFCMToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('Error clearing FCM token:', error);
  }
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<void> {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: data || {},
        sound: true,
      },
      trigger: null, // Show immediately
    });
  } catch (error) {
    console.error('Error scheduling local notification:', error);
  }
}
