# Job Photos API

## Overview

This API endpoint handles photo uploads for jobs, supporting both "before" and "after" service photos. Photos are stored in Supabase Storage with proper access control and validation.

## Endpoints

### POST /api/jobs/[id]/photos

Upload a photo for a job (before or after service).

**Requirements**: 7.3, 7.4, 17.4, 20.4

**Authentication**: Required (Engineer or Agency user)

**Request**:
- Content-Type: `multipart/form-data`
- Body:
  - `file`: Image file (JPEG, PNG, WebP)
  - `photo_type`: `"before"` or `"after"`

**Validation**:
- File size: Maximum 10MB
- File types: image/jpeg, image/jpg, image/png, image/webp
- Photo type: Must be "before" or "after"

**Response** (201 Created):
```json
{
  "success": true,
  "photo_url": "https://...supabase.co/storage/v1/object/public/job-photos/...",
  "photo_type": "before",
  "file_name": "job-id/before_1234567890.jpg"
}
```

**Error Responses**:

- 400 Bad Request - Invalid file type or size
```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Invalid file type. Allowed types: image/jpeg, image/jpg, image/png, image/webp"
  }
}
```

- 400 Bad Request - File too large
```json
{
  "error": {
    "code": "FILE_TOO_LARGE",
    "message": "File size exceeds maximum of 10MB"
  }
}
```

- 401 Unauthorized - Not authenticated
- 403 Forbidden - Not authorized for this job
- 404 Not Found - Job not found
- 500 Internal Server Error - Upload failed (with retry available)

### GET /api/jobs/[id]/photos

Retrieve all photos for a job.

**Authentication**: Required (Engineer or Agency user)

**Response** (200 OK):
```json
{
  "job_id": "uuid",
  "photos_before": [
    "https://...supabase.co/storage/v1/object/public/job-photos/...",
    "https://...supabase.co/storage/v1/object/public/job-photos/..."
  ],
  "photos_after": [
    "https://...supabase.co/storage/v1/object/public/job-photos/..."
  ]
}
```

## Features

### File Validation (Requirement 17.4)
- File type validation against allowed MIME types
- File size validation (10MB maximum)
- Proper error messages for validation failures

### Upload Retry Mechanism (Requirement 20.4)
- Automatic retry on upload failure (up to 3 attempts)
- Exponential backoff between retries
- Clear error message when all retries fail

### Before Photo Upload (Requirement 7.3)
- Engineers can upload before photos when job status is "onsite"
- Photos are stored in Supabase Storage with proper folder structure
- Photo URLs are added to the job's `photos_before` array

### After Photo Upload (Requirement 7.4)
- Engineers can upload after photos during service completion
- Photos are stored separately from before photos
- Photo URLs are added to the job's `photos_after` array

## Storage Structure

Photos are stored in the `job-photos` bucket with the following structure:
```
job-photos/
  {job-id}/
    before_{timestamp}.{ext}
    before_{timestamp}.{ext}
    after_{timestamp}.{ext}
    after_{timestamp}.{ext}
```

## Access Control

- Engineers can upload photos for jobs they are assigned to
- Agency users can upload photos for jobs assigned to their agency
- Both engineers and agency users can view photos for their jobs
- Row Level Security policies enforce data isolation

## Error Handling

The endpoint implements comprehensive error handling:
- Network errors with retry logic
- File validation errors with clear messages
- Authorization errors
- Storage errors with cleanup on failure

## Usage Example

### Upload Before Photo

```typescript
const formData = new FormData();
formData.append('file', photoFile);
formData.append('photo_type', 'before');

const response = await fetch(`/api/jobs/${jobId}/photos`, {
  method: 'POST',
  body: formData,
});

const result = await response.json();
if (result.success) {
  console.log('Photo uploaded:', result.photo_url);
}
```

### Upload After Photo

```typescript
const formData = new FormData();
formData.append('file', photoFile);
formData.append('photo_type', 'after');

const response = await fetch(`/api/jobs/${jobId}/photos`, {
  method: 'POST',
  body: formData,
});
```

### Get All Photos

```typescript
const response = await fetch(`/api/jobs/${jobId}/photos`);
const photos = await response.json();

console.log('Before photos:', photos.photos_before);
console.log('After photos:', photos.photos_after);
```

## Testing

The endpoint includes comprehensive tests covering:
- File type validation
- File size validation
- Upload retry mechanism
- Authorization checks
- Before and after photo uploads
- Error handling scenarios

Run tests with:
```bash
pnpm test apps/web/src/app/api/jobs/[id]/photos/route.test.ts
```
