/**
 * Deep Linking Configuration
 * Handles deep links for push notifications and external navigation
 * Requirements: 5.1, 5.2
 */

import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import type { RootStackParamList } from './types';

const prefix = Linking.createURL('/');

/**
 * Deep linking configuration for React Navigation
 * Enables navigation from push notifications to specific screens
 */
export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'cueron://', 'https://cueron.app', 'https://*.cueron.app'],
  config: {
    screens: {
      Auth: 'auth',
      Main: {
        screens: {
          JobsTab: {
            screens: {
              JobsList: 'jobs',
              JobDetail: {
                path: 'jobs/:jobId',
                parse: {
                  jobId: (jobId: string) => jobId,
                },
              },
              JobStatus: {
                path: 'jobs/:jobId/status',
                parse: {
                  jobId: (jobId: string) => jobId,
                },
              },
              ServiceChecklist: {
                path: 'jobs/:jobId/checklist',
                parse: {
                  jobId: (jobId: string) => jobId,
                },
              },
              PhotoCapture: {
                path: 'jobs/:jobId/photos/:type',
                parse: {
                  jobId: (jobId: string) => jobId,
                  type: (type: string) => type as 'before' | 'after',
                },
              },
              JobCompletion: {
                path: 'jobs/:jobId/complete',
                parse: {
                  jobId: (jobId: string) => jobId,
                },
              },
            },
          },
          ProfileTab: {
            screens: {
              ProfileHome: 'profile',
              JobHistory: 'profile/history',
              PerformanceMetrics: 'profile/metrics',
              Settings: 'profile/settings',
            },
          },
          NotificationsTab: {
            screens: {
              NotificationsList: 'notifications',
              NotificationDetail: {
                path: 'notifications/:notificationId',
                parse: {
                  notificationId: (notificationId: string) => notificationId,
                },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Parse notification data to navigation route
 * Used when handling push notification taps
 */
export const parseNotificationToRoute = (
  notification: any
): { screen: string; params?: any } | null => {
  const data = notification?.data;

  if (!data) return null;

  // Job assignment notification - navigate to job detail
  if (data.type === 'job_assigned' && data.jobId) {
    return {
      screen: 'Main',
      params: {
        screen: 'JobsTab',
        params: {
          screen: 'JobDetail',
          params: { jobId: data.jobId },
        },
      },
    };
  }

  // Job status update notification - navigate to job detail
  if (data.type === 'job_status_update' && data.jobId) {
    return {
      screen: 'Main',
      params: {
        screen: 'JobsTab',
        params: {
          screen: 'JobDetail',
          params: { jobId: data.jobId },
        },
      },
    };
  }

  // General notification - navigate to notification detail
  if (data.notificationId) {
    return {
      screen: 'Main',
      params: {
        screen: 'NotificationsTab',
        params: {
          screen: 'NotificationDetail',
          params: { notificationId: data.notificationId },
        },
      },
    };
  }

  return null;
};
