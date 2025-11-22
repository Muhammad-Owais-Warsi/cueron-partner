/**
 * Jobs List Screen
 * Displays list of assigned jobs with real-time data
 * Requirements: 5.2, 5.4
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, Chip, FAB, ActivityIndicator } from 'react-native-paper';
import type { JobsStackScreenProps } from '../../navigation/types';
import { useEngineerJobs, getCurrentEngineerId } from '../../hooks/useJobs';
import type { Job } from '@cueron/types/src/job';

type Props = JobsStackScreenProps<'JobsList'>;

/**
 * Get status color for chip
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'assigned':
      return '#2196F3'; // Blue
    case 'accepted':
      return '#4CAF50'; // Green
    case 'travelling':
      return '#FF9800'; // Orange
    case 'onsite':
      return '#9C27B0'; // Purple
    case 'completed':
      return '#4CAF50'; // Green
    default:
      return '#757575'; // Grey
  }
}

/**
 * Format date for display
 */
function formatScheduledTime(timestamp: Date | string | undefined): string {
  if (!timestamp) return 'Not scheduled';
  
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffMs < 0) {
    return `Overdue: ${date.toLocaleString()}`;
  } else if (diffHours < 24) {
    return `In ${diffHours}h ${diffMins}m`;
  } else {
    return date.toLocaleString();
  }
}

export const JobsListScreen: React.FC<Props> = ({ navigation }) => {
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const { data: jobs, isLoading, error, refetch } = useEngineerJobs(engineerId);
  const [refreshing, setRefreshing] = useState(false);

  // Get current engineer ID on mount
  useEffect(() => {
    getCurrentEngineerId().then(setEngineerId);
  }, []);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Render job card
  const renderJobCard = ({ item }: { item: Job }) => (
    <Card
      style={styles.card}
      onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
    >
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text variant="titleMedium">{item.job_number}</Text>
          <Chip
            mode="flat"
            compact
            style={{ backgroundColor: getStatusColor(item.status) }}
            textStyle={{ color: '#fff' }}
          >
            {item.status.toUpperCase()}
          </Chip>
        </View>
        <Text variant="bodyMedium" style={styles.clientName}>
          {item.client_name}
        </Text>
        <Text variant="bodySmall" style={styles.location}>
          📍 {item.site_location.city}, {item.site_location.state}
        </Text>
        <Text variant="bodySmall" style={styles.time}>
          ⏰ {formatScheduledTime(item.scheduled_time)}
        </Text>
        {item.urgency === 'emergency' && (
          <Chip
            mode="flat"
            compact
            style={styles.urgencyChip}
            textStyle={{ color: '#fff' }}
            icon="alert"
          >
            EMERGENCY
          </Chip>
        )}
      </Card.Content>
    </Card>
  );

  // Loading state
  if (isLoading && !jobs) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading jobs...
        </Text>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Failed to load jobs
        </Text>
        <Text variant="bodySmall" style={styles.errorDetail}>
          {error.message}
        </Text>
        <FAB
          icon="refresh"
          style={styles.retryButton}
          onPress={() => refetch()}
          label="Retry"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={jobs || []}
        renderItem={renderJobCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text variant="headlineSmall" style={styles.emptyTitle}>
              No Active Jobs
            </Text>
            <Text variant="bodyMedium" style={styles.emptyText}>
              You don't have any assigned jobs at the moment.
            </Text>
          </View>
        }
      />
      <FAB
        icon="refresh"
        style={styles.fab}
        onPress={onRefresh}
        label="Refresh"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  list: {
    padding: 16,
    paddingBottom: 80, // Space for FAB
  },
  card: {
    marginBottom: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  clientName: {
    marginBottom: 4,
    fontWeight: '600',
  },
  location: {
    color: '#666',
    marginBottom: 4,
  },
  time: {
    color: '#666',
    marginBottom: 8,
  },
  urgencyChip: {
    backgroundColor: '#F44336',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    minHeight: 400,
  },
  emptyTitle: {
    marginBottom: 8,
    color: '#666',
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorText: {
    color: '#F44336',
    marginBottom: 8,
  },
  errorDetail: {
    color: '#999',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    marginTop: 16,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
  },
});
