/**
 * Job Detail Screen
 * Displays detailed job information with map and navigation
 * Requirements: 5.2, 5.3, 5.5, 19.1, 19.3, 19.4
 */

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform, Alert } from 'react-native';
import { Text, Card, Button, Divider, Chip, ActivityIndicator } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import type { JobsStackScreenProps } from '../../navigation/types';
import { useJob, useUpdateJobStatus } from '../../hooks/useJobs';

type Props = JobsStackScreenProps<'JobDetail'>;

/**
 * Get status color
 */
function getStatusColor(status: string): string {
  switch (status) {
    case 'assigned':
      return '#2196F3';
    case 'accepted':
      return '#4CAF50';
    case 'travelling':
      return '#FF9800';
    case 'onsite':
      return '#9C27B0';
    case 'completed':
      return '#4CAF50';
    default:
      return '#757575';
  }
}

/**
 * Open device maps app with destination
 * Requirements: 5.3, 19.3
 */
function openMapsApp(lat: number, lng: number, label: string) {
  const scheme = Platform.select({
    ios: 'maps:0,0?q=',
    android: 'geo:0,0?q=',
  });
  const latLng = `${lat},${lng}`;
  const url = Platform.select({
    ios: `${scheme}${label}@${latLng}`,
    android: `${scheme}${latLng}(${label})`,
  });

  if (url) {
    Linking.openURL(url).catch((err) => {
      console.error('Error opening maps:', err);
      Alert.alert('Error', 'Could not open maps application');
    });
  }
}

export const JobDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { jobId } = route.params;
  const { data: job, isLoading, error } = useJob(jobId);
  const updateStatus = useUpdateJobStatus();
  const [accepting, setAccepting] = useState(false);

  /**
   * Handle job acceptance
   * Requirements: 5.5
   */
  const handleAcceptJob = async () => {
    if (!job) return;

    Alert.alert(
      'Accept Job',
      `Do you want to accept job ${job.job_number}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            setAccepting(true);
            try {
              await updateStatus.mutateAsync({
                jobId: job.id,
                status: 'accepted',
              });
              Alert.alert('Success', 'Job accepted successfully');
            } catch (err: any) {
              console.error('Error accepting job:', err);
              Alert.alert('Error', err.message || 'Failed to accept job');
            } finally {
              setAccepting(false);
            }
          },
        },
      ]
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading job details...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Failed to load job details
        </Text>
        <Text variant="bodySmall" style={styles.errorDetail}>
          {error?.message || 'Job not found'}
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          Go Back
        </Button>
      </View>
    );
  }

  const { site_location } = job;
  const mapRegion = {
    latitude: site_location.lat,
    longitude: site_location.lng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <ScrollView style={styles.container}>
      {/* Job Header */}
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <View>
              <Text variant="headlineSmall">{job.job_number}</Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                {job.client_name}
              </Text>
            </View>
            <Chip
              mode="flat"
              style={{ backgroundColor: getStatusColor(job.status) }}
              textStyle={{ color: '#fff' }}
            >
              {job.status.toUpperCase()}
            </Chip>
          </View>

          {job.urgency === 'emergency' && (
            <Chip
              mode="flat"
              icon="alert"
              style={styles.emergencyChip}
              textStyle={{ color: '#fff' }}
            >
              EMERGENCY
            </Chip>
          )}
        </Card.Content>
      </Card>

      {/* Map - Requirements: 19.1, 19.4 */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Location
          </Text>
          <View style={styles.mapContainer}>
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              region={mapRegion}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: site_location.lat,
                  longitude: site_location.lng,
                }}
                title={job.client_name}
                description={site_location.address}
              />
            </MapView>
          </View>
          <Text variant="bodyMedium" style={styles.address}>
            {site_location.address}
          </Text>
          <Text variant="bodySmall" style={styles.cityState}>
            {site_location.city}, {site_location.state}
          </Text>
          <Button
            mode="outlined"
            icon="navigation"
            onPress={() =>
              openMapsApp(site_location.lat, site_location.lng, job.client_name)
            }
            style={styles.navigationButton}
          >
            Open in Maps
          </Button>
        </Card.Content>
      </Card>

      {/* Client Information */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Client Information
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.label}>
              Name:
            </Text>
            <Text variant="bodyMedium">{job.client_name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.label}>
              Phone:
            </Text>
            <Text variant="bodyMedium">{job.client_phone}</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Equipment Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Equipment Details
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.label}>
              Type:
            </Text>
            <Text variant="bodyMedium">{job.equipment_type}</Text>
          </View>
          {job.equipment_details?.brand && (
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Brand:
              </Text>
              <Text variant="bodyMedium">{job.equipment_details.brand}</Text>
            </View>
          )}
          {job.equipment_details?.model && (
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Model:
              </Text>
              <Text variant="bodyMedium">{job.equipment_details.model}</Text>
            </View>
          )}
          {job.issue_description && (
            <>
              <Divider style={styles.divider} />
              <Text variant="bodySmall" style={styles.label}>
                Issue Description:
              </Text>
              <Text variant="bodyMedium">{job.issue_description}</Text>
            </>
          )}
        </Card.Content>
      </Card>

      {/* Job Details */}
      <Card style={styles.card}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Job Details
          </Text>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.label}>
              Type:
            </Text>
            <Text variant="bodyMedium">{job.job_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text variant="bodySmall" style={styles.label}>
              Skill Level:
            </Text>
            <Text variant="bodyMedium">Level {job.required_skill_level}</Text>
          </View>
          {job.scheduled_time && (
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Scheduled:
              </Text>
              <Text variant="bodyMedium">
                {new Date(job.scheduled_time).toLocaleString()}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>

      {/* Actions */}
      <View style={styles.actions}>
        {job.status === 'assigned' && (
          <Button
            mode="contained"
            onPress={handleAcceptJob}
            loading={accepting}
            disabled={accepting}
            style={styles.button}
            icon="check"
          >
            Accept Job
          </Button>
        )}
        {(job.status === 'accepted' || job.status === 'travelling' || job.status === 'onsite') && (
          <Button
            mode="contained"
            onPress={() => navigation.navigate('JobStatus', { jobId })}
            style={styles.button}
            icon="update"
          >
            Update Status
          </Button>
        )}
        {job.status === 'onsite' && (
          <Button
            mode="outlined"
            onPress={() => navigation.navigate('ServiceChecklist', { jobId })}
            style={styles.button}
            icon="clipboard-check"
          >
            View Checklist
          </Button>
        )}
      </View>
    </ScrollView>
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
  card: {
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 4,
    color: '#666',
    fontSize: 16,
  },
  emergencyChip: {
    backgroundColor: '#F44336',
    alignSelf: 'flex-start',
    marginTop: 12,
  },
  mapContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginVertical: 12,
  },
  map: {
    flex: 1,
  },
  address: {
    marginBottom: 4,
  },
  cityState: {
    color: '#666',
    marginBottom: 12,
  },
  navigationButton: {
    marginTop: 8,
  },
  divider: {
    marginVertical: 12,
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'flex-start',
  },
  label: {
    color: '#666',
    width: 100,
    marginRight: 8,
  },
  actions: {
    padding: 16,
    paddingBottom: 32,
  },
  button: {
    marginBottom: 12,
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
  backButton: {
    marginTop: 16,
  },
});
