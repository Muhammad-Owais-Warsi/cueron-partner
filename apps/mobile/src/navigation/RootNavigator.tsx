/**
 * Root Navigator
 * Top-level navigation handling authentication flow
 * Requirements: 5.1, 5.2
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from './types';

// Import navigators and screens
import { MainTabNavigator } from './MainTabNavigator';
import { LoginScreen } from '../screens/auth/LoginScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

interface RootNavigatorProps {
  isAuthenticated?: boolean;
}

export const RootNavigator: React.FC<RootNavigatorProps> = ({
  isAuthenticated = false,
}) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Auth" component={LoginScreen} />
      ) : (
        <Stack.Screen name="Main" component={MainTabNavigator} />
      )}
    </Stack.Navigator>
  );
};
