# Photo Capture Screen

## Overview

The Photo Capture Screen allows field engineers to capture and upload before and after photos for job documentation. This is a critical part of the service delivery workflow, providing visual evidence of work performed.

## Features

### Photo Capture
- **Camera Integration**: Direct camera access for capturing photos
- **Gallery Selection**: Option to select existing photos from device gallery
- **Photo Preview**: Preview captured photos before uploading
- **Retake Option**: Ability to retake photos if not satisfied

### Photo Management
- **Before/After Types**: Separate screens for before and after photos
- **Multiple Photos**: Support for uploading multiple photos per type
- **Existing Photos**: Display previously uploaded photos
- **Photo Validation**: Automatic validation of file type and size

### Upload Functionality
- **Progress Indicator**: Visual feedback during upload
- **Retry Mechanism**: Automatic retry on upload failure
- **Error Handling**: Graceful error handling with user-friendly messages
- **Offline Support**: Queues uploads when offline (future enhancement)

## Technical Implementation

### Dependencies
- `expo-image-picker`: Camera and gallery access
- `@supabase/supabase-js`: API communication
- `react-native-paper`: UI components

### Permissions Required
- **Camera**: Required for taking photos
- **Media Library**: Required for selecting from gallery

### API Integration
- **Endpoint**: `POST /api/jobs/{id}/photos`
- **Authentication**: JWT token from Supabase session
- **Format**: Multipart form data
- **Validation**: File type, size, and photo type

### File Specifications
- **Max Size**: 10MB per photo
- **Supported Formats**: JPEG, PNG, WebP
- **Quality**: 80% compression for optimal balance
- **Aspect Ratio**: 4:3 with editing enabled

## User Flow

1. **Navigate to Screen**: From job detail or service checklist
2. **Request Permissions**: Camera and media library access
3. **Capture/Select Photo**: Choose camera or gallery
4. **Preview Photo**: Review captured photo
5. **Upload Photo**: Submit to server with progress indicator
6. **Confirmation**: Success message and return to previous screen

## Navigation Parameters

```typescript
{
  jobId: string;        // ID of the job
  type: 'before' | 'after';  // Type of photo being captured
}
```

## Error Handling

### Permission Errors
- Displays alert if camera/gallery permissions denied
- Provides guidance to enable in settings

### Upload Errors
- Shows error message with retry option
- Logs errors for debugging
- Maintains photo in preview for retry

### Network Errors
- Detects network failures
- Offers retry functionality
- Future: Queue for offline upload

## Requirements Validation

### Requirement 7.3: Before Photos
✅ Engineers can capture before photos using camera
✅ Photos are uploaded to Supabase Storage
✅ Photo URLs are stored in job record

### Requirement 7.4: After Photos
✅ Engineers can capture after photos using camera
✅ Photos are associated with job completion
✅ Multiple after photos supported

### Requirement 17.4: File Upload Validation
✅ File type validation (JPEG, PNG, WebP)
✅ File size limit enforcement (10MB)
✅ Proper error messages for invalid files

### Requirement 20.4: Upload Retry
✅ Retry option on upload failure
✅ User-friendly error messages
✅ Maintains photo state for retry

## Future Enhancements

1. **Offline Queue**: Store photos locally and upload when online
2. **Batch Upload**: Upload multiple photos at once
3. **Photo Annotations**: Add notes or markings to photos
4. **Compression Options**: User-selectable quality settings
5. **Photo Deletion**: Remove uploaded photos if needed
6. **Photo Metadata**: Capture timestamp and location with photos

## Testing Considerations

### Manual Testing
- Test camera capture on both iOS and Android
- Test gallery selection with various image formats
- Test upload with poor network conditions
- Test permission denial scenarios
- Test file size limit enforcement

### Automated Testing
- Unit tests for upload logic
- Integration tests for API communication
- E2E tests for complete photo capture flow

## Platform-Specific Notes

### iOS
- Requires camera and photo library usage descriptions in Info.plist
- File URI format: `file:///path/to/photo.jpg`
- Photo library access requires explicit permission

### Android
- Requires camera and storage permissions in AndroidManifest.xml
- File URI format: `content://path/to/photo.jpg`
- Scoped storage considerations for Android 10+

## Troubleshooting

### Photos Not Uploading
1. Check network connectivity
2. Verify authentication token is valid
3. Check file size is under 10MB
4. Verify file format is supported

### Camera Not Working
1. Check camera permissions granted
2. Verify device has working camera
3. Check for conflicts with other camera apps

### Gallery Not Accessible
1. Check media library permissions granted
2. Verify photos exist in gallery
3. Check for storage access issues

## Related Components

- `JobDetailScreen`: Navigation entry point
- `ServiceChecklistScreen`: Alternative entry point
- `JobCompletionScreen`: Uses uploaded photos
- `supabase.ts`: API client configuration
