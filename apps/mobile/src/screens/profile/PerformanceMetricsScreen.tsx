/**
 * Performance Metrics Screen
 * Displays detailed performance analytics and trends
 * Requirements: 15.1, 15.2
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, SegmentedButtons, ActivityIndicator, Button } from 'react-native-paper';
import type { ProfileStackScreenProps } from '../../navigation/types';
import { useEngineerPerformance, getCurrentEngineerId } from '../../hooks/useEngineerProfile';

type Props = ProfileStackScreenProps<'PerformanceMetrics'>;

export const PerformanceMetricsScreen: React.FC<Props> = () => {
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [refreshing, setRefreshing] = useState(false);

  // Fetch engineer ID on mount
  useEffect(() => {
    getCurrentEngineerId().then(setEngineerId);
  }, []);

  // Fetch performance data
  const { data: performance, isLoading, refetch } = useEngineerPerformance(engineerId, period);

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading performance data...</Text>
      </View>
    );
  }

  // Error state
  if (!performance) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium">Unable to load performance data</Text>
        <Button mode="contained" onPress={onRefresh} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <SegmentedButtons
          value={period}
          onValueChange={(value) => setPeriod(value as typeof period)}
          buttons={[
            { value: 'week', label: 'Week' },
            { value: 'month', label: 'Month' },
            { value: 'quarter', label: 'Quarter' },
            { value: 'year', label: 'Year' },
          ]}
        />
      </View>

      {/* Performance Summary - Requirement 15.1 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Performance Summary
          </Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text variant="headlineMedium" style={styles.metricValue}>
                {performance.performance_summary.total_jobs_completed}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Jobs Completed
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="headlineMedium" style={styles.metricValue}>
                {performance.performance_summary.average_rating.toFixed(1)}
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Average Rating
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="headlineMedium" style={[styles.metricValue, styles.successRate]}>
                {performance.performance_summary.success_rate.toFixed(0)}%
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Success Rate
              </Text>
            </View>
            <View style={styles.metricItem}>
              <Text variant="headlineMedium" style={[styles.metricValue, styles.revenue]}>
                ₹{(performance.performance_summary.revenue_generated / 1000).toFixed(1)}k
              </Text>
              <Text variant="bodySmall" style={styles.metricLabel}>
                Revenue Generated
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Rating Distribution */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Rating Distribution
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Based on {performance.rating_details.total_ratings} ratings
          </Text>
          <View style={styles.ratingBars}>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = performance.rating_details.rating_distribution[rating as keyof typeof performance.rating_details.rating_distribution];
              const percentage = performance.rating_details.total_ratings > 0
                ? (count / performance.rating_details.total_ratings) * 100
                : 0;
              
              return (
                <View key={rating} style={styles.ratingBar}>
                  <Text variant="bodySmall" style={styles.ratingLabel}>
                    {rating}⭐
                  </Text>
                  <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${percentage}%` }]} />
                  </View>
                  <Text variant="bodySmall" style={styles.ratingCount}>
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </Card.Content>
      </Card>

      {/* Performance by Job Type */}
      {performance.performance_by_job_type.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Performance by Job Type
            </Text>
            {performance.performance_by_job_type.map((jobType) => (
              <View key={jobType.job_type} style={styles.jobTypeItem}>
                <View style={styles.jobTypeHeader}>
                  <Text variant="bodyLarge" style={styles.jobTypeName}>
                    {jobType.job_type}
                  </Text>
                  <Text variant="bodyMedium" style={styles.jobTypeCount}>
                    {jobType.total_jobs} jobs
                  </Text>
                </View>
                <View style={styles.jobTypeMetrics}>
                  <View style={styles.jobTypeMetric}>
                    <Text variant="bodySmall" style={styles.metricLabel}>
                      Avg Rating
                    </Text>
                    <Text variant="bodyMedium" style={styles.metricValue}>
                      {jobType.average_rating.toFixed(1)} ⭐
                    </Text>
                  </View>
                  <View style={styles.jobTypeMetric}>
                    <Text variant="bodySmall" style={styles.metricLabel}>
                      Revenue
                    </Text>
                    <Text variant="bodyMedium" style={[styles.metricValue, styles.revenue]}>
                      ₹{jobType.total_revenue.toLocaleString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Monthly Trend */}
      {performance.monthly_trend.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Monthly Trend
            </Text>
            {performance.monthly_trend.slice(-6).map((month) => (
              <View key={month.month} style={styles.trendItem}>
                <Text variant="bodyMedium" style={styles.trendMonth}>
                  {new Date(month.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </Text>
                <View style={styles.trendMetrics}>
                  <Text variant="bodySmall" style={styles.trendMetric}>
                    {month.jobs_completed} jobs
                  </Text>
                  <Text variant="bodySmall" style={styles.trendMetric}>
                    {month.average_rating.toFixed(1)} ⭐
                  </Text>
                  <Text variant="bodySmall" style={[styles.trendMetric, styles.revenue]}>
                    ₹{(month.revenue / 1000).toFixed(1)}k
                  </Text>
                </View>
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Success Rate Calculation - Requirement 15.2 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Success Rate Breakdown
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Success Rate = (Completed Jobs / Total Jobs) × 100
          </Text>
          <View style={styles.breakdownItem}>
            <Text variant="bodyMedium">Completed Jobs:</Text>
            <Text variant="bodyMedium" style={styles.breakdownValue}>
              {performance.performance_summary.total_jobs_completed}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text variant="bodyMedium">Cancelled Jobs:</Text>
            <Text variant="bodyMedium" style={styles.breakdownValue}>
              {performance.performance_summary.total_jobs_cancelled}
            </Text>
          </View>
          <View style={styles.breakdownItem}>
            <Text variant="bodyMedium">Total Jobs:</Text>
            <Text variant="bodyMedium" style={styles.breakdownValue}>
              {performance.performance_summary.total_jobs_completed + performance.performance_summary.total_jobs_cancelled}
            </Text>
          </View>
          <View style={[styles.breakdownItem, styles.successRateItem]}>
            <Text variant="titleMedium">Success Rate:</Text>
            <Text variant="titleMedium" style={[styles.breakdownValue, styles.successRate]}>
              {performance.performance_summary.success_rate.toFixed(2)}%
            </Text>
          </View>
        </Card.Content>
      </Card>
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
  periodSelector: {
    padding: 16,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
  },
  metricValue: {
    fontWeight: 'bold',
    color: '#333',
  },
  metricLabel: {
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  successRate: {
    color: '#4CAF50',
  },
  revenue: {
    color: '#2196F3',
  },
  ratingBars: {
    marginTop: 8,
  },
  ratingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingLabel: {
    width: 40,
    color: '#666',
  },
  barContainer: {
    flex: 1,
    height: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#FFB300',
    borderRadius: 10,
  },
  ratingCount: {
    width: 30,
    textAlign: 'right',
    color: '#666',
  },
  jobTypeItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  jobTypeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobTypeName: {
    fontWeight: '500',
  },
  jobTypeCount: {
    color: '#666',
  },
  jobTypeMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  jobTypeMetric: {
    alignItems: 'center',
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  trendMonth: {
    fontWeight: '500',
    width: 100,
  },
  trendMetrics: {
    flexDirection: 'row',
    gap: 16,
  },
  trendMetric: {
    color: '#666',
  },
  breakdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  breakdownValue: {
    fontWeight: '500',
  },
  successRateItem: {
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: '#4CAF50',
  },
});
