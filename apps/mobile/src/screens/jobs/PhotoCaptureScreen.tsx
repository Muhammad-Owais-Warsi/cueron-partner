/**
 * Photo Capture Screen
 * Allows engineers to capture before and after photos for job documentation
 * 
 * Requirements: 7.3, 7.4
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  ActivityIndicator,
  IconButton,
  Chip,
} from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';
import type { JobsStackScreenProps } from '../../navigation/types';
import type { Job } from '@cueron/types';
import { supabase } from '../../lib/supabase';

type Props = JobsStackScreenProps<'PhotoCapture'>;

interface Photo {
  uri: string;
  type: string;
  name: string;
}

export const PhotoCaptureScreen: React.FC<Props> = ({ route }) => {
  const { jobId, type } = route.params;
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [uploading, setUploading] = useState(false);
  const [existingPhotos, setExistingPhotos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestPermissions();
    loadExistingPhotos();
  }, []);

  const requestPermissions = async () => {
    // Request camera permissions
    const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
    if (cameraStatus.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera permission is required to capture photos. Please enable it in settings.',
        [{ text: 'OK' }]
      );
    }

    // Request media library permissions
    const mediaStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (mediaStatus.status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Media library permission is required to select photos. Please enable it in settings.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadExistingPhotos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('photos_before, photos_after')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      const jobData = data as unknown as Job;
      const photos = type === 'before' ? jobData.photos_before : jobData.photos_after;
      setExistingPhotos(photos || []);
    } catch (error) {
      console.error('Error loading existing photos:', error);
      Alert.alert('Error', 'Failed to load existing photos');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          type: 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture photo');
    }
  };

  const selectFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setPhoto({
          uri: asset.uri,
          type: asset.type === 'image' ? 'image/jpeg' : 'image/jpeg',
          name: `photo_${Date.now()}.jpg`,
        });
      }
    } catch (error) {
      console.error('Error selecting photo:', error);
      Alert.alert('Error', 'Failed to select photo');
    }
  };

  const uploadPhoto = async () => {
    if (!photo) {
      Alert.alert('Error', 'Please capture or select a photo first');
      return;
    }

    try {
      setUploading(true);

      // Get the session token
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'You must be logged in to upload photos');
        return;
      }

      // Create form data
      const formData = new FormData();
      
      // For React Native, we need to format the file properly
      const fileUri = Platform.OS === 'ios' ? photo.uri.replace('file://', '') : photo.uri;
      
      formData.append('file', {
        uri: fileUri,
        type: photo.type,
        name: photo.name,
      } as any);
      
      formData.append('photo_type', type);

      // Upload to API
      const apiUrl = process.env.SUPABASE_URL?.replace('/rest/v1', '') || '';
      const response = await fetch(`${apiUrl}/api/jobs/${jobId}/photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Upload failed');
      }

      Alert.alert(
        'Success',
        `${type === 'before' ? 'Before' : 'After'} photo uploaded successfully`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Reload existing photos and clear current photo
              loadExistingPhotos();
              setPhoto(null);
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      Alert.alert(
        'Upload Failed',
        error.message || 'Failed to upload photo. Please try again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: uploadPhoto },
        ]
      );
    } finally {
      setUploading(false);
    }
  };

  const retakePhoto = () => {
    setPhoto(null);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading photos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.header}>
            <Text variant="titleLarge">
              {type === 'before' ? 'Before Photos' : 'After Photos'}
            </Text>
            <Chip icon="information">
              {existingPhotos.length} uploaded
            </Chip>
          </View>

          <Text variant="bodyMedium" style={styles.description}>
            {type === 'before'
              ? 'Capture photos of the equipment before starting service work'
              : 'Capture photos of the completed work and equipment condition'}
          </Text>
        </Card.Content>
      </Card>

      {/* Existing Photos */}
      {existingPhotos.length > 0 && (
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Uploaded Photos
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {existingPhotos.map((photoUrl, index) => (
                <Image
                  key={index}
                  source={{ uri: photoUrl }}
                  style={styles.thumbnail}
                />
              ))}
            </ScrollView>
          </Card.Content>
        </Card>
      )}

      {/* Photo Preview */}
      {photo && (
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.previewHeader}>
              <Text variant="titleMedium">Photo Preview</Text>
              <IconButton
                icon="close"
                size={20}
                onPress={retakePhoto}
              />
            </View>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
          </Card.Content>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        {!photo ? (
          <>
            <Button
              mode="contained"
              icon="camera"
              onPress={takePhoto}
              style={styles.button}
            >
              Take Photo
            </Button>
            <Button
              mode="outlined"
              icon="image"
              onPress={selectFromGallery}
              style={styles.button}
            >
              Choose from Gallery
            </Button>
          </>
        ) : (
          <>
            <Button
              mode="contained"
              icon="upload"
              onPress={uploadPhoto}
              loading={uploading}
              disabled={uploading}
              style={styles.button}
            >
              {uploading ? 'Uploading...' : 'Upload Photo'}
            </Button>
            <Button
              mode="outlined"
              icon="camera-retake"
              onPress={retakePhoto}
              disabled={uploading}
              style={styles.button}
            >
              Retake Photo
            </Button>
          </>
        )}
      </View>

      {/* Help Text */}
      <Card style={styles.helpCard}>
        <Card.Content>
          <Text variant="bodySmall" style={styles.helpText}>
            💡 Tips:
          </Text>
          <Text variant="bodySmall" style={styles.helpText}>
            • Ensure good lighting for clear photos
          </Text>
          <Text variant="bodySmall" style={styles.helpText}>
            • Capture multiple angles if needed
          </Text>
          <Text variant="bodySmall" style={styles.helpText}>
            • Photos are limited to 10MB each
          </Text>
          <Text variant="bodySmall" style={styles.helpText}>
            • Supported formats: JPEG, PNG, WebP
          </Text>
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
  content: {
    padding: 16,
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
  card: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#666',
    lineHeight: 20,
  },
  sectionTitle: {
    marginBottom: 12,
  },
  thumbnail: {
    width: 100,
    height: 100,
    borderRadius: 8,
    marginRight: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  preview: {
    width: '100%',
    height: 300,
    borderRadius: 8,
  },
  actions: {
    marginBottom: 16,
  },
  button: {
    marginBottom: 12,
  },
  helpCard: {
    backgroundColor: '#e3f2fd',
    marginBottom: 16,
  },
  helpText: {
    color: '#1976d2',
    marginBottom: 4,
  },
});
