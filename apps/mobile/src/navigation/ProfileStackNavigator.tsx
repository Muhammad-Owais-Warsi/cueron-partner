/**
 * Profile Stack Navigator
 * Handles navigation for profile-related screens
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProfileStackParamList } from './types';
import { CustomHeader } from '../components/navigation/CustomHeader';

// Import screens
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { JobHistoryScreen } from '../screens/profile/JobHistoryScreen';
import { PerformanceMetricsScreen } from '../screens/profile/PerformanceMetricsScreen';
import { SettingsScreen } from '../screens/profile/SettingsScreen';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export const ProfileStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
      }}
    >
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
      <Stack.Screen
        name="JobHistory"
        component={JobHistoryScreen}
        options={{ title: 'Job History' }}
      />
      <Stack.Screen
        name="PerformanceMetrics"
        component={PerformanceMetricsScreen}
        options={{ title: 'Performance' }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Stack.Navigator>
  );
};
