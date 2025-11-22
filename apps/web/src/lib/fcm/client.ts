/**
 * Firebase Cloud Messaging Client
 * Handles sending push notifications via FCM HTTP v1 API
 * 
 * Requirement 14.1: Push notification sending
 * Requirement 14.5: Notification content formatting
 */

import { getFCMConfig, FCM_API_ENDPOINT, validateFCMConfig } from './config';
import type {
  FCMMessage,
  FCMResponse,
  PushNotificationContent,
  NotificationData,
} from './types';

/**
 * FCM Client for sending push notifications
 */
export class FCMClient {
  private serverKey: string;

  constructor(serverKey?: string) {
    const config = serverKey ? { serverKey } : getFCMConfig();
    
    if (!validateFCMConfig(config)) {
      throw new Error('Invalid FCM configuration');
    }

    this.serverKey = config.serverKey;
  }

  /**
   * Send push notification to a single device
   * 
   * @param token - FCM device token
   * @param content - Notification content
   * @returns FCM response
   */
  async sendToDevice(
    token: string,
    content: PushNotificationContent
  ): Promise<FCMResponse> {
    const message: FCMMessage = {
      to: token,
      notification: {
        title: content.title,
        body: content.body,
        sound: content.sound || 'default',
      },
      data: this.serializeData(content.data),
      priority: content.priority || 'high',
      content_available: true,
      time_to_live: 86400, // 24 hours
    };

    return this.send(message);
  }

  /**
   * Send push notification to multiple devices
   * 
   * @param tokens - Array of FCM device tokens
   * @param content - Notification content
   * @returns FCM response
   */
  async sendToDevices(
    tokens: string[],
    content: PushNotificationContent
  ): Promise<FCMResponse> {
    if (tokens.length === 0) {
      return {
        success: 0,
        failure: 0,
      };
    }

    // FCM supports up to 1000 tokens per request
    if (tokens.length > 1000) {
      throw new Error('Cannot send to more than 1000 devices at once');
    }

    const message: FCMMessage = {
      registration_ids: tokens,
      notification: {
        title: content.title,
        body: content.body,
        sound: content.sound || 'default',
      },
      data: this.serializeData(content.data),
      priority: content.priority || 'high',
      content_available: true,
      time_to_live: 86400, // 24 hours
    };

    return this.send(message);
  }

  /**
   * Send data-only notification (silent push)
   * 
   * @param token - FCM device token
   * @param data - Notification data
   * @returns FCM response
   */
  async sendDataMessage(
    token: string,
    data: Record<string, any>
  ): Promise<FCMResponse> {
    const message: FCMMessage = {
      to: token,
      data: this.serializeData(data),
      priority: 'high',
      content_available: true,
    };

    return this.send(message);
  }

  /**
   * Send FCM message via HTTP API
   * 
   * @param message - FCM message payload
   * @returns FCM response
   */
  private async send(message: FCMMessage): Promise<FCMResponse> {
    try {
      const response = await fetch(FCM_API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${this.serverKey}`,
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `FCM request failed with status ${response.status}: ${errorText}`
        );
      }

      const result: FCMResponse = await response.json();
      return result;
    } catch (error) {
      console.error('Error sending FCM notification:', error);
      throw error;
    }
  }

  /**
   * Serialize notification data to string values
   * FCM requires all data values to be strings
   * 
   * @param data - Notification data object
   * @returns Serialized data with string values
   */
  private serializeData(
    data?: Record<string, any>
  ): Record<string, string> | undefined {
    if (!data) {
      return undefined;
    }

    const serialized: Record<string, string> = {};

    for (const [key, value] of Object.entries(data)) {
      if (value !== null && value !== undefined) {
        serialized[key] =
          typeof value === 'string' ? value : JSON.stringify(value);
      }
    }

    return Object.keys(serialized).length > 0 ? serialized : undefined;
  }
}

/**
 * Create FCM client instance
 */
export function createFCMClient(serverKey?: string): FCMClient {
  return new FCMClient(serverKey);
}

/**
 * Singleton FCM client instance
 */
let fcmClient: FCMClient | null = null;

/**
 * Get singleton FCM client instance
 */
export function getFCMClient(): FCMClient {
  if (!fcmClient) {
    fcmClient = createFCMClient();
  }
  return fcmClient;
}

/**
 * Reset FCM client (useful for testing)
 */
export function resetFCMClient(): void {
  fcmClient = null;
}
