/**
 * Job History Screen
 * Displays engineer's completed jobs with ratings and feedback
 * Requirements: 15.3, 15.4
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Chip, ActivityIndicator, Button } from 'react-native-paper';
import type { ProfileStackScreenProps } from '../../navigation/types';
import { useEngineerPerformance, getCurrentEngineerId } from '../../hooks/useEngineerProfile';

type Props = ProfileStackScreenProps<'JobHistory'>;

export const JobHistoryScreen: React.FC<Props> = () => {
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch engineer ID on mount
  useEffect(() => {
    getCurrentEngineerId().then(setEngineerId);
  }, []);

  // Fetch performance data with job history
  const { data: performance, isLoading, refetch } = useEngineerPerformance(engineerId, 'all');

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Get job type color
  const getJobTypeColor = (type: string) => {
    switch (type) {
      case 'Emergency':
        return '#F44336';
      case 'Repair':
        return '#FF9800';
      case 'AMC':
        return '#4CAF50';
      case 'Installation':
        return '#2196F3';
      default:
        return '#9E9E9E';
    }
  };

  // Render star rating
  const renderStars = (rating: number | null) => {
    if (!rating) return <Text style={styles.noRating}>Not rated</Text>;
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Text key={star} style={styles.star}>
            {star <= rating ? '⭐' : '☆'}
          </Text>
        ))}
      </View>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading job history...</Text>
      </View>
    );
  }

  // Error state
  if (!performance) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium">Unable to load job history</Text>
        <Button mode="contained" onPress={onRefresh} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  // Empty state
  if (performance.job_history.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text variant="titleLarge">No completed jobs yet</Text>
        <Text variant="bodyMedium" style={styles.emptyText}>
          Your completed jobs will appear here
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text variant="titleLarge">Job History</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          {performance.job_history.length} completed jobs
        </Text>
      </View>

      {performance.job_history.map((job) => (
        <Card key={job.job_id} style={styles.card}>
          <Card.Content>
            {/* Job Header */}
            <View style={styles.jobHeader}>
              <View style={styles.jobInfo}>
                <Text variant="titleMedium">{job.job_number}</Text>
                <Chip
                  style={[styles.typeChip, { backgroundColor: getJobTypeColor(job.job_type) }]}
                  textStyle={styles.typeChipText}
                  compact
                >
                  {job.job_type}
                </Chip>
              </View>
              <Text variant="bodySmall" style={styles.date}>
                {new Date(job.completed_at).toLocaleDateString()}
              </Text>
            </View>

            {/* Client Info */}
            <View style={styles.clientInfo}>
              <Text variant="bodyMedium" style={styles.clientName}>
                {job.client_name}
              </Text>
              {job.site_location?.city && (
                <Text variant="bodySmall" style={styles.location}>
                  📍 {job.site_location.city}
                </Text>
              )}
            </View>

            {/* Rating - Requirement 15.3 */}
            <View style={styles.ratingSection}>
              <Text variant="bodySmall" style={styles.ratingLabel}>
                Client Rating:
              </Text>
              {renderStars(job.client_rating)}
            </View>

            {/* Feedback - Requirement 15.4 */}
            {job.client_feedback && (
              <View style={styles.feedbackSection}>
                <Text variant="bodySmall" style={styles.feedbackLabel}>
                  Feedback:
                </Text>
                <Text variant="bodyMedium" style={styles.feedbackText}>
                  "{job.client_feedback}"
                </Text>
              </View>
            )}

            {/* Service Fee */}
            {job.service_fee && (
              <Text variant="bodySmall" style={styles.serviceFee}>
                Service Fee: ₹{job.service_fee.toLocaleString()}
              </Text>
            )}
          </Card.Content>
        </Card>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  retryButton: {
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 24,
  },
  emptyText: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginTop: 4,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  jobInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeChip: {
    height: 24,
  },
  typeChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  date: {
    color: '#666',
  },
  clientInfo: {
    marginBottom: 12,
  },
  clientName: {
    fontWeight: '500',
  },
  location: {
    color: '#666',
    marginTop: 4,
  },
  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ratingLabel: {
    color: '#666',
    marginRight: 8,
  },
  starsContainer: {
    flexDirection: 'row',
  },
  star: {
    fontSize: 16,
    marginRight: 2,
  },
  noRating: {
    color: '#999',
    fontStyle: 'italic',
  },
  feedbackSection: {
    marginTop: 8,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  feedbackLabel: {
    color: '#666',
    marginBottom: 4,
  },
  feedbackText: {
    fontStyle: 'italic',
    color: '#333',
  },
  serviceFee: {
    marginTop: 8,
    color: '#4CAF50',
    fontWeight: '500',
  },
});
