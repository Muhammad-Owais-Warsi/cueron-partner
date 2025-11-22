/**
 * Service Checklist Screen
 * Interactive checklist for service delivery with parts tracking and notes
 * Requirements: 7.1, 7.2, 7.5, 8.1
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  Text,
  Card,
  Checkbox,
  Button,
  TextInput,
  Divider,
  ActivityIndicator,
  ProgressBar,
  IconButton,
  Portal,
  Dialog,
} from 'react-native-paper';
import type { JobsStackScreenProps } from '../../navigation/types';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import type { ChecklistItem, PartUsed } from '@cueron/types/src/job';

type Props = JobsStackScreenProps<'ServiceChecklist'>;

interface ChecklistResponse {
  job_id: string;
  status: string;
  checklist: ChecklistItem[];
  stats: {
    total_items: number;
    completed_items: number;
    pending_items: number;
    completion_percentage: number;
    all_completed: boolean;
  };
  completion_enabled: boolean;
  can_complete_job: boolean;
}

/**
 * Fetch checklist from API
 * Requirements: 7.1
 */
async function fetchChecklist(jobId: string): Promise<ChecklistResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/jobs/${jobId}/checklist`,
    {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to fetch checklist');
  }

  return response.json();
}

/**
 * Update checklist on API
 * Requirements: 7.2
 */
async function updateChecklist(
  jobId: string,
  checklist: ChecklistItem[]
): Promise<ChecklistResponse> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Not authenticated');
  }

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_API_URL}/api/jobs/${jobId}/checklist`,
    {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ checklist }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to update checklist');
  }

  return response.json();
}

export const ServiceChecklistScreen: React.FC<Props> = ({ route, navigation }) => {
  const { jobId } = route.params;
  const queryClient = useQueryClient();

  // State for checklist items
  const [localChecklist, setLocalChecklist] = useState<ChecklistItem[]>([]);
  
  // State for parts used
  const [partsUsed, setPartsUsed] = useState<PartUsed[]>([]);
  const [showAddPartDialog, setShowAddPartDialog] = useState(false);
  const [newPart, setNewPart] = useState({ name: '', quantity: '', cost: '' });
  
  // State for engineer notes
  const [engineerNotes, setEngineerNotes] = useState('');
  
  // State for unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Fetch checklist
  const { data, isLoading, error } = useQuery({
    queryKey: ['checklist', jobId],
    queryFn: () => fetchChecklist(jobId),
  });

  // Update checklist mutation
  const updateMutation = useMutation({
    mutationFn: (checklist: ChecklistItem[]) => updateChecklist(jobId, checklist),
    onSuccess: (data) => {
      queryClient.setQueryData(['checklist', jobId], data);
      setHasUnsavedChanges(false);
      
      if (data.can_complete_job) {
        Alert.alert(
          'Checklist Complete',
          'All items completed! You can now proceed to complete the job.',
          [
            { text: 'OK', style: 'default' },
          ]
        );
      }
    },
    onError: (error: Error) => {
      Alert.alert('Error', error.message || 'Failed to save checklist');
    },
  });

  // Initialize local checklist when data loads
  useEffect(() => {
    if (data?.checklist) {
      setLocalChecklist(data.checklist);
    }
  }, [data]);

  /**
   * Toggle checklist item completion
   * Requirements: 7.2
   */
  const toggleChecklistItem = (index: number) => {
    const updated = [...localChecklist];
    updated[index] = {
      ...updated[index],
      completed: !updated[index].completed,
    };
    setLocalChecklist(updated);
    setHasUnsavedChanges(true);
  };

  /**
   * Save checklist to API
   * Requirements: 7.2
   */
  const handleSaveChecklist = () => {
    if (localChecklist.length === 0) {
      Alert.alert('Error', 'No checklist items to save');
      return;
    }
    updateMutation.mutate(localChecklist);
  };

  /**
   * Add part to parts used list
   */
  const handleAddPart = () => {
    if (!newPart.name.trim()) {
      Alert.alert('Error', 'Part name is required');
      return;
    }
    
    const quantity = parseInt(newPart.quantity);
    const cost = parseFloat(newPart.cost);
    
    if (isNaN(quantity) || quantity <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }
    
    if (isNaN(cost) || cost < 0) {
      Alert.alert('Error', 'Please enter a valid cost');
      return;
    }

    setPartsUsed([...partsUsed, { name: newPart.name, quantity, cost }]);
    setNewPart({ name: '', quantity: '', cost: '' });
    setShowAddPartDialog(false);
  };

  /**
   * Remove part from list
   */
  const handleRemovePart = (index: number) => {
    Alert.alert(
      'Remove Part',
      'Are you sure you want to remove this part?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            const updated = partsUsed.filter((_, i) => i !== index);
            setPartsUsed(updated);
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
          Loading checklist...
        </Text>
      </View>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <View style={styles.centerContainer}>
        <Text variant="bodyLarge" style={styles.errorText}>
          Failed to load checklist
        </Text>
        <Text variant="bodySmall" style={styles.errorDetail}>
          {error?.message || 'Checklist not found'}
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

  const { stats } = data;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.scrollView}>
        {/* Progress Card */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Completion Progress
            </Text>
            <View style={styles.progressContainer}>
              <ProgressBar
                progress={stats.completion_percentage / 100}
                color="#4CAF50"
                style={styles.progressBar}
              />
              <Text variant="bodyMedium" style={styles.progressText}>
                {stats.completed_items} of {stats.total_items} items completed
                ({stats.completion_percentage}%)
              </Text>
            </View>
            {stats.all_completed && (
              <View style={styles.completeBadge}>
                <Text variant="bodyMedium" style={styles.completeText}>
                  ✓ All items completed
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Checklist Items - Requirements: 7.1, 7.2 */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Service Checklist
            </Text>
            {localChecklist.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No checklist items for this job
              </Text>
            ) : (
              localChecklist.map((item, index) => (
                <View key={index}>
                  <View style={styles.checklistItem}>
                    <Checkbox
                      status={item.completed ? 'checked' : 'unchecked'}
                      onPress={() => toggleChecklistItem(index)}
                    />
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.checklistText,
                        item.completed && styles.checklistTextCompleted,
                      ]}
                    >
                      {item.item}
                    </Text>
                  </View>
                  {item.notes && (
                    <Text variant="bodySmall" style={styles.itemNotes}>
                      Note: {item.notes}
                    </Text>
                  )}
                  {index < localChecklist.length - 1 && <Divider style={styles.divider} />}
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Parts Used */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Parts Used
              </Text>
              <IconButton
                icon="plus"
                size={24}
                onPress={() => setShowAddPartDialog(true)}
              />
            </View>
            {partsUsed.length === 0 ? (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No parts added yet
              </Text>
            ) : (
              partsUsed.map((part, index) => (
                <View key={index} style={styles.partItem}>
                  <View style={styles.partInfo}>
                    <Text variant="bodyMedium" style={styles.partName}>
                      {part.name}
                    </Text>
                    <Text variant="bodySmall" style={styles.partDetails}>
                      Qty: {part.quantity} • Cost: ₹{part.cost.toFixed(2)}
                    </Text>
                  </View>
                  <IconButton
                    icon="delete"
                    size={20}
                    onPress={() => handleRemovePart(index)}
                  />
                </View>
              ))
            )}
          </Card.Content>
        </Card>

        {/* Engineer Notes */}
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Engineer Notes
            </Text>
            <TextInput
              mode="outlined"
              placeholder="Add any observations or notes about the service..."
              value={engineerNotes}
              onChangeText={setEngineerNotes}
              multiline
              numberOfLines={4}
              style={styles.notesInput}
            />
          </Card.Content>
        </Card>

        {/* Validation Message - Requirements: 7.5, 8.1 */}
        {!stats.all_completed && (
          <Card style={[styles.card, styles.warningCard]}>
            <Card.Content>
              <Text variant="bodyMedium" style={styles.warningText}>
                ⚠️ Complete all checklist items to enable job completion
              </Text>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {hasUnsavedChanges && (
          <Button
            mode="contained"
            onPress={handleSaveChecklist}
            loading={updateMutation.isPending}
            disabled={updateMutation.isPending}
            style={styles.button}
            icon="content-save"
          >
            Save Checklist
          </Button>
        )}
        <Button
          mode="outlined"
          onPress={() => navigation.goBack()}
          style={styles.button}
        >
          Back to Job
        </Button>
      </View>

      {/* Add Part Dialog */}
      <Portal>
        <Dialog visible={showAddPartDialog} onDismiss={() => setShowAddPartDialog(false)}>
          <Dialog.Title>Add Part Used</Dialog.Title>
          <Dialog.Content>
            <TextInput
              mode="outlined"
              label="Part Name"
              value={newPart.name}
              onChangeText={(text) => setNewPart({ ...newPart, name: text })}
              style={styles.dialogInput}
            />
            <TextInput
              mode="outlined"
              label="Quantity"
              value={newPart.quantity}
              onChangeText={(text) => setNewPart({ ...newPart, quantity: text })}
              keyboardType="numeric"
              style={styles.dialogInput}
            />
            <TextInput
              mode="outlined"
              label="Cost (₹)"
              value={newPart.cost}
              onChangeText={(text) => setNewPart({ ...newPart, cost: text })}
              keyboardType="decimal-pad"
              style={styles.dialogInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowAddPartDialog(false)}>Cancel</Button>
            <Button onPress={handleAddPart}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
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
  warningCard: {
    backgroundColor: '#FFF3E0',
  },
  sectionTitle: {
    marginBottom: 12,
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    color: '#666',
  },
  completeBadge: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
  },
  completeText: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  checklistText: {
    flex: 1,
    marginLeft: 8,
  },
  checklistTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemNotes: {
    marginLeft: 48,
    marginTop: -4,
    marginBottom: 8,
    color: '#666',
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: 8,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    paddingVertical: 16,
  },
  partItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  partInfo: {
    flex: 1,
  },
  partName: {
    fontWeight: '500',
  },
  partDetails: {
    color: '#666',
    marginTop: 4,
  },
  notesInput: {
    marginTop: 8,
  },
  warningText: {
    color: '#F57C00',
    textAlign: 'center',
  },
  actions: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  button: {
    marginBottom: 8,
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
  dialogInput: {
    marginBottom: 12,
  },
});
