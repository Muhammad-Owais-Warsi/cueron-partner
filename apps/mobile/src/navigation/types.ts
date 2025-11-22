/**
 * Navigation Types
 * Type definitions for React Navigation routes and parameters
 */

import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

// Root Stack Navigator (handles authentication flow)
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

// Bottom Tab Navigator
export type MainTabParamList = {
  JobsTab: undefined;
  ProfileTab: undefined;
  NotificationsTab: undefined;
};

// Jobs Stack Navigator
export type JobsStackParamList = {
  JobsList: undefined;
  JobDetail: { jobId: string };
  JobStatus: { jobId: string };
  ServiceChecklist: { jobId: string };
  PhotoCapture: { jobId: string; type: 'before' | 'after' };
  JobCompletion: { jobId: string };
};

// Profile Stack Navigator
export type ProfileStackParamList = {
  ProfileHome: undefined;
  JobHistory: undefined;
  PerformanceMetrics: undefined;
  Settings: undefined;
};

// Notifications Stack Navigator
export type NotificationsStackParamList = {
  NotificationsList: undefined;
  NotificationDetail: { notificationId: string };
};

// Screen Props Types
export type RootStackScreenProps<T extends keyof RootStackParamList> =
  NativeStackScreenProps<RootStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> =
  CompositeScreenProps<
    BottomTabScreenProps<MainTabParamList, T>,
    RootStackScreenProps<keyof RootStackParamList>
  >;

export type JobsStackScreenProps<T extends keyof JobsStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<JobsStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type ProfileStackScreenProps<T extends keyof ProfileStackParamList> =
  CompositeScreenProps<
    NativeStackScreenProps<ProfileStackParamList, T>,
    MainTabScreenProps<keyof MainTabParamList>
  >;

export type NotificationsStackScreenProps<
  T extends keyof NotificationsStackParamList
> = CompositeScreenProps<
  NativeStackScreenProps<NotificationsStackParamList, T>,
  MainTabScreenProps<keyof MainTabParamList>
>;

// Deep linking configuration types
export type DeepLinkConfig = {
  screens: {
    Main: {
      screens: {
        JobsTab: {
          screens: {
            JobDetail: string;
            JobStatus: string;
          };
        };
        NotificationsTab: {
          screens: {
            NotificationDetail: string;
          };
        };
      };
    };
  };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
