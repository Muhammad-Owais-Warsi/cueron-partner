/**
 * Job Status Update Screen
 * Allows engineers to update job status with location tracking
 * Requirements: 6.1, 6.2, 6.3, 6.5
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  AppState,
  AppStateStatus,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  ActivityIndicator,
  Portal,
  Dialog,
  Paragraph,
} from 'react-native-paper';
import * as Location from 'expo-location';
import type { JobsStackScreenProps } from '../../navigation/types';
import {
  useJob,
  useUpdateJobStatus,
  useUpdateEngineerLocation,
  getCurrentEngineerId,
} from '../../hooks/useJobs';
import type { JobStatus } from '@cueron/types/src/job';

type Props = JobsStackScreenProps<'JobStatus'>;

/**
 * Status timeline item
 */
interface TimelineItem {
  status: JobStatus;
  timestamp: string;
  label: string;
  completed: boolean;
}

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
 * Build status timeline
 */
function buildTimeline(currentStatus: JobStatus): TimelineItem[] {
  const statuses: Array<{ status: JobStatus; label: string }> = [
    { status: 'assigned', label: 'Assigned' },
    { status: 'accepted', label: 'Accepted' },
    { status: 'travelling', label: 'Travelling' },
    { status: 'onsite', label: 'On Site' },
    { status: 'completed', label: 'Completed' },
  ];

  const statusOrder: JobStatus[] = [
    'assigned',
    'accepted',
    'travelling',
    'onsite',
    'completed',
  ];
  const currentIndex = statusOrder.indexOf(currentStatus);

  return statuses.map((item, index) => ({
    ...item,
    timestamp: '',
    completed: index <= currentIndex,
  }));
}

export const JobStatusScreen: React.FC<Props> = ({ route, navigation }) => {
  const { jobId } = route.params;
  const { data: job, isLoading, error } = useJob(jobId);
  const updateStatus = useUpdateJobStatus();
  const updateLocation = useUpdateEngineerLocation();

  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isTracking, setIsTracking] = useState(false);
  const [engineerId, setEngineerId] = useState<string | null>(null);

  // Refs for location tracking
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);
  const locationUpdateInterval = useRef<NodeJS.Timeout | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  /**
   * Get engineer ID on mount
   */
  useEffect(() => {
    (async () => {
      const id = await getCurrentEngineerId();
      setEngineerId(id);
    })();
  }, []);

  /**
   * Request location permissions
   * Requirements: 6.2
   */
  useEffect(() => {
    (async () => {
      try {
        const { status: foregroundStatus } =
          await Location.requestForegroundPermissionsAsync();

        if (foregroundStatus === 'granted') {
          setLocationPermission(true);

          // Get initial location
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          setCurrentLocation({
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          });

          // Request background permissions for location tracking
          if (Platform.OS === 'android') {
            await Location.requestBackgroundPermissionsAsync();
          }
        } else {
          Alert.alert(
            'Location Permission Required',
            'Location access is required to update job status and track your progress.',
            [{ text: 'OK' }]
          );
        }
      } catch (err) {
        console.error('Error requesting location permissions:', err);
      }
    })();
  }, []);

  /**
   * Start location tracking when status is 'travelling'
   * Requirements: 6.2, 9.1
   */
  useEffect(() => {
    if (job?.status === 'travelling' && locationPermission && !isTracking) {
      startLocationTracking();
    }

    return () => {
      stopLocationTracking();
    };
  }, [job?.status, locationPermission]);

  /**
   * Handle app state changes for background tracking
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  /**
   * Start location tracking
   * Sends location updates every 30 seconds
   * Requirements: 6.2, 9.1
   */
  const startLocationTracking = async () => {
    try {
      setIsTracking(true);

      // Start watching location
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 30000, // 30 seconds
          distanceInterval: 50, // 50 meters
        },
        (location) => {
          const newLocation = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          setCurrentLocation(newLocation);

          // Send location update to API
          sendLocationUpdate(newLocation);
        }
      );

      locationSubscription.current = subscription;

      // Also set up interval as backup
      locationUpdateInterval.current = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          const newLocation = {
            lat: location.coords.latitude,
            lng: location.coords.longitude,
          };
          setCurrentLocation(newLocation);
          sendLocationUpdate(newLocation);
        } catch (err) {
          console.error('Error getting location in interval:', err);
        }
      }, 30000); // 30 seconds

      console.log('Location tracking started');
    } catch (err) {
      console.error('Error starting location tracking:', err);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  /**
   * Stop location tracking
   */
  const stopLocationTracking = () => {
    if (locationSubscription.current) {
      locationSubscription.current.remove();
      locationSubscription.current = null;
    }

    if (locationUpdateInterval.current) {
      clearInterval(locationUpdateInterval.current);
      locationUpdateInterval.current = null;
    }

    setIsTracking(false);
    console.log('Location tracking stopped');
  };

  /**
   * Send location update to API
   * Requirements: 9.1, 9.2
   */
  const sendLocationUpdate = async (location: { lat: number; lng: number }) => {
    if (!engineerId) return;

    try {
      await updateLocation.mutateAsync({
        engineerId,
        location,
      });
      console.log('Location update sent successfully');
    } catch (err) {
      console.error('Error sending location update:', err);
      // Don't show error to user, just log it
    }
  };

  /**
   * Show status change confirmation dialog
   */
  const showConfirmDialog = (status: JobStatus) => {
    setSelectedStatus(status);
    setDialogVisible(true);
  };

  /**
   * Hide confirmation dialog
   */
  const hideDialog = () => {
    setDialogVisible(false);
    setSelectedStatus(null);
  };

  /**
   * Handle status update
   * Requirements: 6.1, 6.2, 6.3
   */
  const handleStatusUpdate = async () => {
    if (!selectedStatus || !job) return;

    hideDialog();
    setUpdating(true);

    try {
      // Get current location if available
      let location = currentLocation;
      if (locationPermission && !location) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setCurrentLocation(location);
      }

      // Update job status
      await updateStatus.mutateAsync({
        jobId: job.id,
        status: selectedStatus,
        location: location || undefined,
      });

      // Start location tracking if status is 'travelling'
      // Requirements: 6.2
      if (selectedStatus === 'travelling' && locationPermission) {
        startLocationTracking();
      }

      // Stop location tracking if status is 'completed' or 'cancelled'
      if (selectedStatus === 'completed' || selectedStatus === 'cancelled') {
        stopLocationTracking();
      }

      // Enable onsite features when status is 'onsite'
      // Requirements: 6.5
      if (selectedStatus === 'onsite') {
        Alert.alert(
          'Status Updated',
          'You can now access the service checklist and photo capture.',
          [
            {
              text: 'View Checklist',
              onPress: () => navigation.navigate('ServiceChecklist', { jobId }),
            },
            {
              text: 'OK',
              style: 'cancel',
            },
          ]
        );
      } else {
        Alert.alert('Success', `Job status updated to ${selectedStatus}`);
      }
    } catch (err: any) {
      console.error('Error updating status:', err);
      Alert.alert('Error', err.message || 'Failed to update job status');
    } finally {
      setUpdating(false);
    }
  };

  /**
   * Get available status transitions
   */
  const getAvailableStatuses = (): JobStatus[] => {
    if (!job) return [];

    const transitions: Record<JobStatus, JobStatus[]> = {
      pending: [],
      assigned: [],
      accepted: ['travelling'],
      travelling: ['onsite'],
      onsite: ['completed'],
      completed: [],
      cancelled: [],
    };

    return transitions[job.status] || [];
  };

  /**
   * Get status button label
   */
  const getStatusLabel = (status: JobStatus): string => {
    const labels: Record<JobStatus, string> = {
      pending: 'Pending',
      assigned: 'Assigned',
      accepted: 'Accepted',
      travelling: 'Start Travelling',
      onsite: 'Arrive On Site',
      completed: 'Complete Job',
      cancelled: 'Cancelled',
    };

    return labels[status] || status;
  };

  /**
   * Get status button icon
   */
  const getStatusIcon = (status: JobStatus): string => {
    const icons: Record<JobStatus, string> = {
      pending: 'clock-outline',
      assigned: 'account-check',
      accepted: 'check',
      travelling: 'car',
      onsite: 'map-marker-check',
      completed: 'check-circle',
      cancelled: 'close-circle',
    };

    return icons[status] || 'update';
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <Text variant="bodyMedium" style={styles.loadingText}>
          Loading job status...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Failed to load job
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

  const timeline = buildTimeline(job.status);
  const availableStatuses = getAvailableStatuses();

  return (
    <>
      <ScrollView style={styles.container}>
        {/* Current Status */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Current Status
            </Text>
            <View style={styles.currentStatusContainer}>
              <Chip
                mode="flat"
                style={{
                  backgroundColor: getStatusColor(job.status),
                  alignSelf: 'flex-start',
                }}
                textStyle={{ color: '#fff', fontSize: 16 }}
              >
                {job.status.toUpperCase()}
              </Chip>
            </View>
          </Card.Content>
        </Card>

        {/* Status Timeline - Requirements: 6.1 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Progress Timeline
            </Text>
            <View style={styles.timeline}>
              {timeline.map((item, index) => (
                <View key={item.status} style={styles.timelineItem}>
                  <View style={styles.timelineIndicator}>
                    <View
                      style={[
                        styles.timelineDot,
                        item.completed && styles.timelineDotCompleted,
                      ]}
                    />
                    {index < timeline.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          item.completed && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.timelineLabel,
                        item.completed && styles.timelineLabelCompleted,
                      ]}
                    >
                      {item.label}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Location Tracking Status */}
        {isTracking && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={styles.trackingContainer}>
                <ActivityIndicator size="small" color="#FF9800" />
                <Text variant="bodyMedium" style={styles.trackingText}>
                  Location tracking active
                </Text>
              </View>
              {currentLocation && (
                <Text variant="bodySmall" style={styles.locationText}>
                  Last update: {currentLocation.lat.toFixed(6)},{' '}
                  {currentLocation.lng.toFixed(6)}
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Status Update Actions */}
        {availableStatuses.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Update Status
              </Text>
              <View style={styles.actions}>
                {availableStatuses.map((status) => (
                  <Button
                    key={status}
                    mode="contained"
                    icon={getStatusIcon(status)}
                    onPress={() => showConfirmDialog(status)}
                    disabled={updating}
                    style={[
                      styles.statusButton,
                      { backgroundColor: getStatusColor(status) },
                    ]}
                  >
                    {getStatusLabel(status)}
                  </Button>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Job Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Job Information
            </Text>
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Job Number:
              </Text>
              <Text variant="bodyMedium">{job.job_number}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Client:
              </Text>
              <Text variant="bodyMedium">{job.client_name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text variant="bodySmall" style={styles.label}>
                Type:
              </Text>
              <Text variant="bodyMedium">{job.job_type}</Text>
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={hideDialog}>
          <Dialog.Title>Confirm Status Update</Dialog.Title>
          <Dialog.Content>
            <Paragraph>
              Are you sure you want to update the job status to{' '}
              <Text style={{ fontWeight: 'bold' }}>
                {selectedStatus?.toUpperCase()}
              </Text>
              ?
            </Paragraph>
            {selectedStatus === 'travelling' && (
              <Paragraph style={styles.warningText}>
                Location tracking will be activated to monitor your progress.
              </Paragraph>
            )}
            {selectedStatus === 'onsite' && (
              <Paragraph style={styles.infoText}>
                You will be able to access the service checklist and photo capture.
              </Paragraph>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={hideDialog}>Cancel</Button>
            <Button onPress={handleStatusUpdate} mode="contained">
              Confirm
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </>
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
  sectionTitle: {
    marginBottom: 16,
    fontWeight: '600',
  },
  currentStatusContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineIndicator: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E0E0E0',
    borderWidth: 2,
    borderColor: '#BDBDBD',
  },
  timelineDotCompleted: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 4,
    minHeight: 32,
  },
  timelineLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 0,
  },
  timelineLabel: {
    color: '#757575',
  },
  timelineLabelCompleted: {
    color: '#212121',
    fontWeight: '600',
  },
  trackingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 8,
  },
  trackingText: {
    marginLeft: 12,
    color: '#E65100',
    fontWeight: '600',
  },
  locationText: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
  },
  actions: {
    gap: 12,
  },
  statusButton: {
    marginBottom: 8,
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
  warningText: {
    marginTop: 12,
    color: '#FF9800',
    fontStyle: 'italic',
  },
  infoText: {
    marginTop: 12,
    color: '#2196F3',
    fontStyle: 'italic',
  },
});
