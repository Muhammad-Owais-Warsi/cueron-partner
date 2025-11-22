/**
 * Main Tab Navigator
 * Bottom tab navigation for the main app screens
 * Requirements: 5.1, 5.2
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from 'react-native-paper';
import type { MainTabParamList } from './types';
import { TabBarIcon } from '../components/navigation/TabBarIcon';

// Import stack navigators
import { JobsStackNavigator } from './JobsStackNavigator';
import { ProfileStackNavigator } from './ProfileStackNavigator';
import { NotificationsStackNavigator } from './NotificationsStackNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export const MainTabNavigator: React.FC = () => {
  const theme = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="JobsTab"
        component={JobsStackNavigator}
        options={{
          title: 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="briefcase"
              color={color}
              focused={focused}
            />
          ),
          tabBarBadge: undefined, // Can be set dynamically for pending jobs
        }}
      />
      <Tab.Screen
        name="NotificationsTab"
        component={NotificationsStackNavigator}
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="bell"
              color={color}
              focused={focused}
            />
          ),
          tabBarBadge: undefined, // Can be set dynamically for unread notifications
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStackNavigator}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name="account"
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
