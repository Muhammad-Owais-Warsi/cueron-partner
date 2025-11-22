/**
 * Notifications Stack Navigator
 * Handles navigation for notification-related screens
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NotificationsStackParamList } from './types';
import { CustomHeader } from '../components/navigation/CustomHeader';

// Import screens
import { NotificationsListScreen } from '../screens/notifications/NotificationsListScreen';

// Placeholder screens for future implementation
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

const PlaceholderScreen = ({ title }: { title: string }) => (
  <View style={styles.placeholder}>
    <Text variant="headlineSmall">{title}</Text>
    <Text variant="bodyMedium" style={styles.note}>
      To be implemented in future tasks
    </Text>
  </View>
);

const Stack = createNativeStackNavigator<NotificationsStackParamList>();

export const NotificationsStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        header: (props) => <CustomHeader {...props} />,
      }}
    >
      <Stack.Screen
        name="NotificationsList"
        component={NotificationsListScreen}
        options={{ title: 'Notifications' }}
      />
      <Stack.Screen
        name="NotificationDetail"
        component={() => <PlaceholderScreen title="Notification Detail" />}
        options={{ title: 'Notification' }}
      />
    </Stack.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  note: {
    marginTop: 16,
    color: '#666',
    textAlign: 'center',
  },
});
