/**
 * Job Completion Screen
 * Allows engineers to complete jobs with signature capture and validation
 * 
 * Features:
 * - Displays completion summary (checklist, photos, parts)
 * - Signature capture canvas
 * - Validates all requirements before completion
 * - Uploads signature and completes job
 * - Shows success feedback
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  Divider,
  Chip,
  Portal,
  Dialog,
  IconButton,
} from 'react-native-paper';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { JobsStackScreenProps } from '../../navigation/types';
import { useJob, useUpdateJobStatus } from '../../hooks/useJobs';
import { supabase } from '../../lib/supabase';

// Signature canvas component (using expo-gl for drawing)
import SignatureCanvas from 'react-native-signature-canvas';

type RouteParams = JobsStackScreenProps<'JobCompletion'>['route']['params'];

export const JobCompletionScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId } = route.params as RouteParams;
  
  const { data: job, refetch: refetchJob } = useJob(jobId);
  const updateJobStatus = useUpdateJobStatus();

  const [signature, setSignature] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const signatureRef = useRef<any>(null);

  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  useEffect(() => {
    if (job) {
      validateCompletion();
    }
  }, [job]);

  const validateCompletion = () => {
    const errors: string[] = [];

    if (!job) {
      errors.push('Job not found');
      setValidationErrors(errors);
      return false;
    }

    // Check checklist completion
    const checklist = job.service_checklist || [];
    const completedItems = checklist.filter((item) => item.completed);
    
    if (checklist.length > 0 && completedItems.length < checklist.length) {
      errors.push(`Complete all checklist items (${completedItems.length}/${checklist.length})`);
    }

    // Check photos
    const beforePhotos = job.photos_before || [];
    const afterPhotos = job.photos_after || [];
    
    if (beforePhotos.length === 0) {
      errors.push('Capture at least one before photo');
    }
    
    if (afterPhotos.length === 0) {
      errors.push('Capture at least one after photo');
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSignatureEnd = () => {
    if (signatureRef.current) {
      signatureRef.current.readSignature();
    }
  };

  const handleSignatureOK = (signatureData: string) => {
    setSignature(signatureData);
  };

  const handleSignatureClear = () => {
    setSignature(null);
    if (signatureRef.current) {
      signatureRef.current.clearSignature();
    }
  };

  const uploadSignature = async (signatureData: string): Promise<string> => {
    try {
      // Convert base64 to ArrayBuffer
      const base64Data = signatureData.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);

      // Upload to Supabase Storage
      const fileName = `signatures/${jobId}_${Date.now()}.png`;
      const { error } = await supabase.storage
        .from('job-photos')
        .upload(fileName, byteArray.buffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('job-photos')
        .getPublicUrl(fileName);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading signature:', error);
      throw new Error('Failed to upload signature');
    }
  };

  const handleCompleteJob = async () => {
    // Validate before showing confirmation
    if (!validateCompletion()) {
      Alert.alert(
        'Cannot Complete Job',
        'Please complete all requirements:\n\n' + validationErrors.join('\n'),
        [{ text: 'OK' }]
      );
      return;
    }

    if (!signature) {
      Alert.alert(
        'Signature Required',
        'Please capture client signature before completing the job.',
        [{ text: 'OK' }]
      );
      return;
    }

    setShowConfirmDialog(true);
  };

  const confirmCompletion = async () => {
    setShowConfirmDialog(false);
    setIsUploading(true);

    try {
      // Upload signature
      const signatureUrl = await uploadSignature(signature!);

      // Complete job via API
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_API_URL}/api/jobs/${jobId}/complete`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            checklist: job?.service_checklist,
            photos_before: job?.photos_before,
            photos_after: job?.photos_after,
            parts_used: job?.parts_used,
            signature_url: signatureUrl,
            notes: job?.engineer_notes,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to complete job');
      }

      // Update local state
      await updateJobStatus.mutateAsync({
        jobId,
        status: 'completed',
      });

      // Refetch job data
      await refetchJob();

      setIsUploading(false);
      setShowSuccessDialog(true);
    } catch (error) {
      setIsUploading(false);
      console.error('Error completing job:', error);
      
      Alert.alert(
        'Completion Failed',
        'Failed to complete the job. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: confirmCompletion },
        ]
      );
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessDialog(false);
    // Navigate back to jobs list
    navigation.navigate('JobsList' as never);
  };

  if (!job) {
    return (
      <View style={styles.centerContainer}>
        <Text>Job not found</Text>
      </View>
    );
  }

  const checklist = job.service_checklist || [];
  const completedItems = checklist.filter((item) => item.completed);
  const beforePhotos = job.photos_before || [];
  const afterPhotos = job.photos_after || [];
  const partsUsed = job.parts_used || [];

  const isValid = validationErrors.length === 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Validation Status */}
        {!isValid && (
          <Card style={styles.errorCard}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.errorTitle}>
                Requirements Not Met
              </Text>
              {validationErrors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  • {error}
                </Text>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Completion Summary */}
        <Card style={styles.card}>
          <Card.Title title="Completion Summary" />
          <Card.Content>
            {/* Checklist Status */}
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Checklist:</Text>
              <Chip
                icon={completedItems.length === checklist.length ? 'check' : 'alert'}
                mode="outlined"
                style={
                  completedItems.length === checklist.length
                    ? styles.chipSuccess
                    : styles.chipWarning
                }
              >
                {completedItems.length}/{checklist.length} Complete
              </Chip>
            </View>

            {/* Photos Status */}
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Before Photos:</Text>
              <Chip
                icon={beforePhotos.length > 0 ? 'check' : 'alert'}
                mode="outlined"
                style={beforePhotos.length > 0 ? styles.chipSuccess : styles.chipWarning}
              >
                {beforePhotos.length} Photo{beforePhotos.length !== 1 ? 's' : ''}
              </Chip>
            </View>

            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">After Photos:</Text>
              <Chip
                icon={afterPhotos.length > 0 ? 'check' : 'alert'}
                mode="outlined"
                style={afterPhotos.length > 0 ? styles.chipSuccess : styles.chipWarning}
              >
                {afterPhotos.length} Photo{afterPhotos.length !== 1 ? 's' : ''}
              </Chip>
            </View>

            {/* Parts Used */}
            {partsUsed.length > 0 && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Parts Used
                </Text>
                {partsUsed.map((part, index) => (
                  <View key={index} style={styles.partRow}>
                    <Text variant="bodyMedium">{part.name}</Text>
                    <Text variant="bodySmall" style={styles.partDetails}>
                      Qty: {part.quantity} | ₹{part.cost}
                    </Text>
                  </View>
                ))}
              </>
            )}

            {/* Engineer Notes */}
            {job.engineer_notes && (
              <>
                <Divider style={styles.divider} />
                <Text variant="titleSmall" style={styles.sectionTitle}>
                  Notes
                </Text>
                <Text variant="bodyMedium">{job.engineer_notes}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Signature Capture */}
        <Card style={styles.card}>
          <Card.Title
            title="Client Signature"
            right={(props) =>
              signature ? (
                <IconButton
                  {...props}
                  icon="refresh"
                  onPress={handleSignatureClear}
                />
              ) : null
            }
          />
          <Card.Content>
            <View style={styles.signatureContainer}>
              {!signature ? (
                <SignatureCanvas
                  ref={signatureRef}
                  onEnd={handleSignatureEnd}
                  onOK={handleSignatureOK}
                  descriptionText="Sign above"
                  clearText="Clear"
                  confirmText="Save"
                  webStyle={signatureWebStyle}
                  style={styles.signature}
                />
              ) : (
                <View style={styles.signaturePreview}>
                  <Text variant="bodyMedium" style={styles.signatureSaved}>
                    ✓ Signature Captured
                  </Text>
                </View>
              )}
            </View>
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Complete Button */}
      <View style={styles.footer}>
        <Button
          mode="contained"
          onPress={handleCompleteJob}
          disabled={isUploading || !signature}
          loading={isUploading}
          style={styles.completeButton}
        >
          {isUploading ? 'Completing Job...' : 'Complete Job'}
        </Button>
      </View>

      {/* Confirmation Dialog */}
      <Portal>
        <Dialog visible={showConfirmDialog} onDismiss={() => setShowConfirmDialog(false)}>
          <Dialog.Title>Confirm Job Completion</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium">
              Are you sure you want to mark this job as complete? This action cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowConfirmDialog(false)}>Cancel</Button>
            <Button onPress={confirmCompletion}>Confirm</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Success Dialog */}
        <Dialog visible={showSuccessDialog} dismissable={false}>
          <Dialog.Icon icon="check-circle" size={60} color="#4CAF50" />
          <Dialog.Title style={styles.successTitle}>Job Completed!</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={styles.successText}>
              The job has been successfully completed. Your availability status has been updated
              to available.
            </Text>
            <View style={styles.successSummary}>
              <Text variant="bodySmall">Job Number: {job.job_number}</Text>
              <Text variant="bodySmall">Client: {job.client_name}</Text>
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={handleSuccessClose}>Done</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
};

const signatureWebStyle = `
  .m-signature-pad {
    box-shadow: none;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
`;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  errorCard: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#ffebee',
  },
  errorTitle: {
    color: '#c62828',
    marginBottom: 8,
  },
  errorText: {
    color: '#c62828',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 8,
  },
  chipSuccess: {
    backgroundColor: '#e8f5e9',
  },
  chipWarning: {
    backgroundColor: '#fff3e0',
  },
  divider: {
    marginVertical: 16,
  },
  sectionTitle: {
    marginBottom: 8,
    fontWeight: '600',
  },
  partRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  partDetails: {
    color: '#666',
  },
  signatureContainer: {
    height: 250,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  signature: {
    flex: 1,
  },
  signaturePreview: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  signatureSaved: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  completeButton: {
    paddingVertical: 8,
  },
  successTitle: {
    textAlign: 'center',
  },
  successText: {
    textAlign: 'center',
    marginBottom: 16,
  },
  successSummary: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
});
