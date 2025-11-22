# Job Completion Screen

## Overview

The Job Completion Screen allows field engineers to finalize job completion with client signature capture and comprehensive validation. This screen ensures all requirements are met before marking a job as complete.

## Features

### 1. Completion Summary
- **Checklist Status**: Shows completion progress of mandatory checklist items
- **Photo Status**: Displays count of before and after photos
- **Parts Used**: Lists all parts used during service with quantities and costs
- **Engineer Notes**: Shows any notes added by the engineer

### 2. Validation
The screen validates the following requirements before allowing completion:
- All mandatory checklist items must be completed
- At least one before photo must be captured
- At least one after photo must be captured
- Client signature must be captured

### 3. Signature Capture
- Interactive signature canvas using `react-native-signature-canvas`
- Clear and save functionality
- Signature preview after capture
- Option to retake signature

### 4. Completion Flow
1. Engineer reviews completion summary
2. System validates all requirements
3. Engineer captures client signature
4. Engineer confirms completion
5. Signature is uploaded to Supabase Storage
6. Job completion API is called
7. Success dialog is shown
8. Engineer is navigated back to jobs list

### 5. Error Handling
- Displays validation errors prominently
- Handles signature upload failures with retry option
- Handles API failures with retry option
- Shows user-friendly error messages

## Technical Implementation

### Dependencies
- `react-native-signature-canvas`: For signature capture
- `react-native-paper`: UI components
- `@react-navigation/native`: Navigation
- `@supabase/supabase-js`: Backend integration

### API Integration

#### Complete Job Endpoint
```typescript
POST /api/jobs/{jobId}/complete
Headers:
  - Authorization: Bearer {token}
  - Content-Type: application/json

Body:
{
  checklist: Array<ChecklistItem>,
  photos_before: string[],
  photos_after: string[],
  parts_used: Array<Part>,
  signature_url: string,
  notes?: string
}

Response:
{
  completed_job: Job,
  payment_created: Payment
}
```

### Signature Upload Process
1. Signature is captured as base64 PNG data
2. Base64 is converted to Blob
3. Blob is uploaded to Supabase Storage bucket `job-photos`
4. Public URL is retrieved and included in completion request

### State Management
- Uses `useJobs` hook for job data and completion action
- Local state for signature, validation, and UI dialogs
- Real-time validation on component mount and updates

## User Experience

### Validation Feedback
- Red error card at top shows all unmet requirements
- Each summary item shows status with colored chips:
  - Green: Requirement met
  - Orange: Requirement not met
- Complete button is disabled until signature is captured

### Success Flow
- Success dialog shows:
  - Checkmark icon
  - Confirmation message
  - Job number and client name
  - Done button to return to jobs list

### Error Recovery
- Upload failures show alert with retry option
- API failures show alert with retry option
- User can cancel and fix issues before retrying

## Requirements Validation

This screen validates the following requirements:

- **8.1**: Requires all mandatory checklist items to be completed
- **8.2**: Prompts for client signature capture
- **8.3**: Uploads signature to Supabase Storage
- **8.4**: Updates job status to 'completed' with timestamp
- **8.5**: Updates engineer availability to 'available' (via API)

## Navigation

### Route Parameters
```typescript
{
  jobId: string  // ID of the job to complete
}
```

### Navigation Flow
```
JobDetailScreen → JobCompletionScreen → JobsListScreen (on success)
```

## Styling

- Follows Material Design principles via React Native Paper
- Responsive layout with ScrollView for content
- Fixed footer with completion button
- Card-based layout for organized information
- Color-coded status indicators

## Future Enhancements

1. **Offline Support**: Cache completion data and sync when online
2. **Photo Preview**: Show thumbnails of captured photos in summary
3. **PDF Generation**: Generate completion report PDF for client
4. **Email Receipt**: Send completion receipt to client email
5. **Rating Prompt**: Prompt engineer to rate the job experience
6. **Checklist Review**: Allow reviewing checklist items before completion

## Testing Considerations

### Unit Tests
- Validation logic for checklist, photos, signature
- Signature upload conversion and error handling
- API call formatting and error handling

### Integration Tests
- Complete flow from summary to success
- Error recovery flows
- Navigation after completion

### Manual Testing Checklist
- [ ] Validation errors display correctly
- [ ] Signature capture works smoothly
- [ ] Signature clear and retake works
- [ ] Upload progress shows during completion
- [ ] Success dialog displays correctly
- [ ] Navigation returns to jobs list
- [ ] Error alerts show with retry options
- [ ] All requirements are validated before completion
