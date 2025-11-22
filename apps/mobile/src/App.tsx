/**
 * Cueron Engineer Mobile Application
 * Main entry point with navigation setup and push notification handling
 * Requirements: 5.1, 5.2, 14.1
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Import navigation
import { RootNavigator, linking } from './navigation';

// Import notification initialization
import { initializePushNotifications } from './lib/notifications';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  // TODO: Implement actual authentication state management in task 41
  const [isAuthenticated] = React.useState(false);

  // Initialize push notifications on app launch
  // Requirement 5.1: Request notification permissions on app launch
  // Requirement 14.1: Register FCM token with backend
  useEffect(() => {
    // Initialize notifications after a short delay to ensure everything is ready
    const timer = setTimeout(() => {
      initializePushNotifications();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider>
          <NavigationContainer linking={linking}>
            <RootNavigator isAuthenticated={isAuthenticated} />
            <StatusBar style="auto" />
          </NavigationContainer>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
