import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { getQueuedRequestCount } from '../lib/offline';

/**
 * Offline indicator component
 * Displays a banner when device is offline
 */
export function OfflineIndicator(): JSX.Element | null {
  const { isOnline } = useNetworkStatus();
  const queuedCount = getQueuedRequestCount();

  if (isOnline) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.icon}>📡</Text>
      <View style={styles.textContainer}>
        <Text style={styles.title}>You're offline</Text>
        {queuedCount > 0 && (
          <Text style={styles.subtitle}>
            {queuedCount} {queuedCount === 1 ? 'request' : 'requests'} queued
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f59e0b',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 12,
    marginTop: 2,
    opacity: 0.9,
  },
});
