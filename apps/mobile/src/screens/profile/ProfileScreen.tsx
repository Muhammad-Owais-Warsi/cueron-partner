/**
 * Profile Screen
 * Displays engineer profile and performance
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { Text, Card, Avatar, List, Divider, Chip, ActivityIndicator, Button, Menu } from 'react-native-paper';
import type { ProfileStackScreenProps } from '../../navigation/types';
import {
  useEngineerProfile,
  useEngineerPerformance,
  useUpdateAvailability,
  getCurrentEngineerId,
} from '../../hooks/useEngineerProfile';

type Props = ProfileStackScreenProps<'ProfileHome'>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [engineerId, setEngineerId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [availabilityMenuVisible, setAvailabilityMenuVisible] = useState(false);

  // Fetch engineer ID on mount
  useEffect(() => {
    getCurrentEngineerId().then(setEngineerId);
  }, []);

  // Fetch profile and performance data
  const { data: profile, isLoading: profileLoading, refetch: refetchProfile } = useEngineerProfile(engineerId);
  const { data: performance, isLoading: performanceLoading, refetch: refetchPerformance } = useEngineerPerformance(engineerId, 'month');
  const updateAvailability = useUpdateAvailability();

  // Handle pull-to-refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchPerformance()]);
    setRefreshing(false);
  };

  // Handle availability status change
  const handleAvailabilityChange = (status: 'available' | 'offline' | 'on_leave') => {
    if (!engineerId) return;

    setAvailabilityMenuVisible(false);
    updateAvailability.mutate(
      { engineerId, availabilityStatus: status },
      {
        onSuccess: () => {
          Alert.alert('Success', `Availability updated to ${status}`);
        },
        onError: (error) => {
          Alert.alert('Error', `Failed to update availability: ${error.message}`);
        },
      }
    );
  };

  // Get availability status color
  const getAvailabilityColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#4CAF50';
      case 'on_job':
        return '#2196F3';
      case 'offline':
        return '#9E9E9E';
      case 'on_leave':
        return '#FF9800';
      default:
        return '#9E9E9E';
    }
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Loading state
  if (profileLoading || performanceLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  // Error state
  if (!profile || !performance) {
    return (
      <View style={styles.errorContainer}>
        <Text variant="titleMedium">Unable to load profile</Text>
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
      {/* Profile Header */}
      <Card style={styles.card}>
        <Card.Content style={styles.header}>
          {profile.photo_url ? (
            <Avatar.Image size={80} source={{ uri: profile.photo_url }} />
          ) : (
            <Avatar.Text size={80} label={getInitials(profile.name)} />
          )}
          <Text variant="headlineSmall" style={styles.name}>
            {profile.name}
          </Text>
          <Text variant="bodyMedium" style={styles.role}>
            HVAC Technician - Level {profile.skill_level}
          </Text>
          
          {/* Availability Status */}
          <Menu
            visible={availabilityMenuVisible}
            onDismiss={() => setAvailabilityMenuVisible(false)}
            anchor={
              <TouchableOpacity onPress={() => setAvailabilityMenuVisible(true)}>
                <Chip
                  style={[styles.statusChip, { backgroundColor: getAvailabilityColor(profile.availability_status) }]}
                  textStyle={styles.statusChipText}
                  icon={profile.availability_status === 'on_job' ? 'briefcase' : 'circle'}
                >
                  {profile.availability_status.replace('_', ' ').toUpperCase()}
                </Chip>
              </TouchableOpacity>
            }
          >
            <Menu.Item
              onPress={() => handleAvailabilityChange('available')}
              title="Available"
              leadingIcon="check-circle"
              disabled={profile.availability_status === 'on_job'}
            />
            <Menu.Item
              onPress={() => handleAvailabilityChange('offline')}
              title="Offline"
              leadingIcon="minus-circle"
              disabled={profile.availability_status === 'on_job'}
            />
            <Menu.Item
              onPress={() => handleAvailabilityChange('on_leave')}
              title="On Leave"
              leadingIcon="calendar-remove"
              disabled={profile.availability_status === 'on_job'}
            />
          </Menu>

          {/* Contact Info */}
          <View style={styles.contactInfo}>
            <Text variant="bodySmall" style={styles.contactText}>
              📞 {profile.phone}
            </Text>
            {profile.email && (
              <Text variant="bodySmall" style={styles.contactText}>
                ✉️ {profile.email}
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>

      {/* Performance Metrics - Requirement 15.1 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Performance Metrics
          </Text>
          <View style={styles.metrics}>
            <View style={styles.metric}>
              <Text variant="headlineMedium">{performance.performance_summary.total_jobs_completed}</Text>
              <Text variant="bodySmall">Jobs Completed</Text>
            </View>
            <View style={styles.metric}>
              <Text variant="headlineMedium">{performance.performance_summary.average_rating.toFixed(1)}</Text>
              <Text variant="bodySmall">Avg Rating</Text>
            </View>
            <View style={styles.metric}>
              <Text variant="headlineMedium">{performance.performance_summary.success_rate.toFixed(0)}%</Text>
              <Text variant="bodySmall">Success Rate</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Specializations */}
      {profile.specializations && profile.specializations.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Specializations
            </Text>
            <View style={styles.chipContainer}>
              {profile.specializations.map((spec, index) => (
                <Chip key={index} style={styles.chip} icon="star">
                  {spec}
                </Chip>
              ))}
            </View>
          </Card.Content>
        </Card>
      )}

      {/* Certifications - Requirement 15.5 */}
      {performance.certifications && performance.certifications.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Certifications
            </Text>
            {performance.certifications.map((cert, index) => (
              <View key={index} style={styles.certificationItem}>
                <View style={styles.certificationHeader}>
                  <Text variant="bodyLarge">{cert.type} - Level {cert.level}</Text>
                  {cert.verified && (
                    <Chip icon="check-decagram" style={styles.verifiedChip} compact>
                      Verified
                    </Chip>
                  )}
                </View>
                <Text variant="bodySmall" style={styles.certNumber}>
                  Cert #: {cert.cert_number}
                </Text>
                {cert.issued_date && (
                  <Text variant="bodySmall" style={styles.certDate}>
                    Issued: {new Date(cert.issued_date).toLocaleDateString()}
                  </Text>
                )}
              </View>
            ))}
          </Card.Content>
        </Card>
      )}

      {/* Navigation Menu */}
      <Card style={styles.card}>
        <List.Item
          title="Job History"
          description={`${performance.job_history.length} completed jobs`}
          left={(props) => <List.Icon {...props} icon="history" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('JobHistory')}
        />
        <Divider />
        <List.Item
          title="Performance Details"
          description="View detailed analytics"
          left={(props) => <List.Icon {...props} icon="chart-line" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('PerformanceMetrics')}
        />
        <Divider />
        <List.Item
          title="Settings"
          description="App preferences"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
          onPress={() => navigation.navigate('Settings')}
        />
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
  card: {
    margin: 16,
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  name: {
    marginTop: 12,
  },
  role: {
    color: '#666',
    marginTop: 4,
  },
  statusChip: {
    marginTop: 12,
  },
  statusChipText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  contactInfo: {
    marginTop: 12,
    alignItems: 'center',
  },
  contactText: {
    color: '#666',
    marginTop: 4,
  },
  sectionTitle: {
    marginBottom: 16,
    fontWeight: 'bold',
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  certificationItem: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  certificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verifiedChip: {
    backgroundColor: '#4CAF50',
  },
  certNumber: {
    color: '#666',
    marginTop: 4,
  },
  certDate: {
    color: '#999',
    marginTop: 2,
  },
});
