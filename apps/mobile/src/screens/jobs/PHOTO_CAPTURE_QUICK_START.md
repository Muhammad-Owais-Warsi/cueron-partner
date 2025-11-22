# Photo Capture Quick Start Guide

## For Developers

### Installation
```bash
cd apps/mobile
pnpm install
```

### Usage in Code
```typescript
// Navigate to photo capture screen
navigation.navigate('PhotoCapture', {
  jobId: 'job-uuid',
  type: 'before' // or 'after'
});
```

### Testing
```bash
# iOS
pnpm ios

# Android
pnpm android
```

## For Engineers (End Users)

### Capturing Before Photos
1. Open the job details
2. Tap "Capture Before Photos"
3. Choose "Take Photo" or "Choose from Gallery"
4. Review the photo
5. Tap "Upload Photo"
6. Wait for confirmation

### Capturing After Photos
1. Complete the service checklist
2. Tap "Capture After Photos"
3. Follow the same steps as before photos

### Tips
- Ensure good lighting
- Capture multiple angles
- Photos must be under 10MB
- Supported formats: JPEG, PNG, WebP

### Troubleshooting
- **Camera not working**: Check permissions in device settings
- **Upload failed**: Check internet connection and retry
- **Photo too large**: Use camera app's quality settings

## API Reference

### Upload Photo
```typescript
POST /api/jobs/{jobId}/photos
Content-Type: multipart/form-data

FormData:
  - file: File
  - photo_type: 'before' | 'after'

Response:
{
  success: true,
  photo_url: string,
  photo_type: string,
  file_name: string
}
```

### Get Photos
```typescript
GET /api/jobs/{jobId}/photos

Response:
{
  job_id: string,
  photos_before: string[],
  photos_after: string[]
}
```

## Permissions Required

### iOS (Info.plist)
- NSCameraUsageDescription
- NSPhotoLibraryUsageDescription

### Android (AndroidManifest.xml)
- CAMERA
- READ_EXTERNAL_STORAGE
- WRITE_EXTERNAL_STORAGE

## File Specifications
- **Max Size**: 10MB
- **Formats**: JPEG, PNG, WebP
- **Quality**: 80% compression
- **Aspect Ratio**: 4:3 (editable)

## Error Codes
- `UNAUTHORIZED`: Not logged in
- `VALIDATION_ERROR`: Invalid file or parameters
- `INVALID_FILE_TYPE`: Unsupported format
- `FILE_TOO_LARGE`: Exceeds 10MB
- `JOB_NOT_FOUND`: Invalid job ID
- `FORBIDDEN`: No permission for this job
- `UPLOAD_FAILED`: Network or storage error
