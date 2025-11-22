/**
 * Firebase Cloud Messaging Configuration
 * Handles FCM initialization and configuration
 * 
 * Requirement 14.1: Push notification infrastructure
 */

/**
 * FCM Configuration Interface
 */
export interface FCMConfig {
  serverKey: string;
  senderId?: string;
}

/**
 * Get FCM configuration from environment variables
 */
export function getFCMConfig(): FCMConfig {
  const serverKey = process.env.FCM_SERVER_KEY;

  if (!serverKey) {
    throw new Error('FCM_SERVER_KEY environment variable is not set');
  }

  return {
    serverKey,
    senderId: process.env.FCM_SENDER_ID,
  };
}

/**
 * Validate FCM configuration
 */
export function validateFCMConfig(config: FCMConfig): boolean {
  return !!config.serverKey && config.serverKey.length > 0;
}

/**
 * FCM API endpoint
 */
export const FCM_API_ENDPOINT = 'https://fcm.googleapis.com/fcm/send';
