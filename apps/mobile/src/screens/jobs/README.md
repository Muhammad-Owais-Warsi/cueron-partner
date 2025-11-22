# Job Screens

This directory contains all job-related screens for the mobile application.

## Screens

### JobsListScreen
Displays a list of jobs assigned to the current engineer, sorted by scheduled time.

**Features:**
- Real-time job list updates
- Pull-to-refresh functionality
- Status badges and urgency indicators
- Navigation to job details

**Requirements:** 5.4

### JobDetailScreen
Shows detailed information about a specific job including location, client info, and equipment details.

**Features:**
- Embedded map with job location (Requirements: 19.1, 19.4)
- Navigation to device maps app (Requirements: 5.3, 19.3)
- Job acceptance functionality (Requirements: 5.5)
- Client and equipment information display
- Status-based action buttons

**Requirements:** 5.2, 5.3, 5.4, 5.5, 19.1, 19.3, 19.4

### JobStatusScreen
Allows engineers to update job status with location tracking and progress timeline.

**Features:**
- Status update buttons (travelling, onsite, completed)
- Status change confirmation dialogs
- Automatic location tracking activation when status changes to 'travelling' (Requirements: 6.2)
- Background location tracking with 30-second intervals (Requirements: 9.1)
- Status timeline display showing job progress (Requirements: 6.1)
- Location permission handling for iOS and Android
- Real-time location updates to API (Requirements: 9.1, 9.2)
- Onsite feature enablement (Requirements: 6.5)

**Requirements:** 6.1, 6.2, 6.3, 6.5, 9.1, 9.2

**Location Tracking:**
- Uses `expo-location` for GPS access
- Requests foreground and background permissions
- Tracks location every 30 seconds when status is 'travelling'
- Sends location updates to `/api/engineers/{id}/location`
- Automatically stops tracking when job is completed or cancelled

**Status Transitions:**
- accepted → travelling
- travelling → onsite
- onsite → completed

### ServiceChecklistScreen
Interactive checklist for service delivery with parts tracking and notes.

**Features:**
- Display all required verification items (Requirements: 7.1)
- Interactive checkbox toggling for completion tracking
- Real-time progress indicator with percentage
- Parts used tracking with name, quantity, and cost
- Engineer notes text area for service observations
- Completion validation - all items must be checked (Requirements: 7.5, 8.1)
- Save checklist state to API (Requirements: 7.2)
- Visual feedback for completion status
- Offline state handling with local storage

**Requirements:** 7.1, 7.2, 7.5, 8.1

**Data Structures:**
- ChecklistItem: { item: string, completed: boolean, notes?: string }
- PartUsed: { name: string, quantity: number, cost: number }

**Validation:**
- All mandatory checklist items must be completed before job completion
- Part name is required
- Quantity must be positive integer
- Cost must be non-negative number

### PhotoCaptureScreen
Allows engineers to capture before and after photos during service delivery.

**Features:**
- Camera access for before and after photos (Requirements: 7.3, 7.4)
- Photo preview with retake option
- Upload to Supabase Storage
- Progress indicators during upload
- Camera and gallery selection support
- Permission handling for iOS and Android
- Error handling with retry option

**Requirements:** 7.3, 7.4

**Implementation:**
- Uses `expo-image-picker` for camera and gallery access
- Uploads to Supabase Storage bucket `job-photos`
- Stores URLs in job record (photos_before, photos_after arrays)
- Validates file types and sizes

### JobCompletionScreen
Finalizes job completion with client signature capture and comprehensive validation.

**Features:**
- Completion summary display (checklist, photos, parts, notes)
- Validation of all requirements (Requirements: 8.1)
- Client signature capture canvas (Requirements: 8.2, 8.3)
- Signature upload to Supabase Storage (Requirements: 8.3)
- Job completion API call (Requirements: 8.4)
- Engineer availability restoration (Requirements: 8.5)
- Success feedback screen
- Error handling with retry options

**Requirements:** 8.1, 8.2, 8.3, 8.4, 8.5

**Validation Requirements:**
- All mandatory checklist items must be completed
- At least one before photo must be captured
- At least one after photo must be captured
- Client signature must be captured

**Completion Flow:**
1. Review completion summary
2. Validate all requirements
3. Capture client signature
4. Confirm completion
5. Upload signature to storage
6. Call completion API
7. Show success dialog
8. Navigate to jobs list

**Implementation:**
- Uses `react-native-signature-canvas` for signature capture
- Converts signature to PNG and uploads to Supabase Storage
- Calls `POST /api/jobs/{id}/complete` with all completion data
- Updates job status to 'completed' with timestamp
- Updates engineer availability to 'available'

## Navigation

All job screens are part of the `JobsStackNavigator` which is nested within the main tab navigator.

## API Integration

Job screens use React Query hooks from `hooks/useJobs.ts`:
- `useEngineerJobs(engineerId)` - Fetch jobs assigned to engineer
- `useJob(jobId)` - Fetch single job details
- `useUpdateJobStatus()` - Update job status with location
- `useUpdateEngineerLocation()` - Send location updates

ServiceChecklistScreen uses direct API calls:
- `GET /api/jobs/{id}/checklist` - Fetch checklist with completion stats
- `PATCH /api/jobs/{id}/checklist` - Update checklist items

PhotoCaptureScreen uses direct API calls:
- `POST /api/jobs/{id}/photos` - Upload photos to Supabase Storage

JobCompletionScreen uses direct API calls:
- `POST /api/jobs/{id}/complete` - Complete job with signature and all data

## Location Tracking

The JobStatusScreen implements comprehensive location tracking:

1. **Permission Handling:**
   - Requests foreground location permission on mount
   - Requests background permission for Android
   - Shows alert if permission denied

2. **Tracking Activation:**
   - Automatically starts when status changes to 'travelling'
   - Uses `Location.watchPositionAsync` for continuous tracking
   - Backup interval timer ensures updates every 30 seconds

3. **Location Updates:**
   - Sends updates to `/api/engineers/{id}/location`
   - Includes latitude and longitude coordinates
   - Handles errors gracefully without disrupting user experience

4. **Tracking Deactivation:**
   - Stops when job is completed or cancelled
   - Cleans up subscriptions and intervals
   - Handles app state changes

## Status Timeline

The status timeline provides visual feedback on job progress:
- Shows all status stages (assigned → accepted → travelling → onsite → completed)
- Highlights completed stages with green indicators
- Displays current status prominently
- Updates in real-time as status changes

## Error Handling

All screens implement comprehensive error handling:
- Loading states with activity indicators
- Error states with user-friendly messages
- Retry options for failed operations
- Graceful degradation for missing data

## Testing

Property-based tests are defined in the tasks document:
- Property 29: Onsite feature enablement (Requirements 6.5)
- Property 30: Checklist display completeness (Requirements 7.1)
- Property 31: Checklist completion persistence (Requirements 7.2)
- Property 32: Before photo upload (Requirements 7.3)
- Property 33: After photo association (Requirements 7.4)
- Property 34: Completion enablement (Requirements 7.5)
- Property 35: Completion checklist validation (Requirements 8.1)
- Property 36: Signature upload (Requirements 8.3)
- Property 37: Job completion status update (Requirements 8.4)
- Property 38: Engineer availability restoration (Requirements 8.5)

## Future Enhancements

- Offline support for status updates
- Enhanced location tracking with battery optimization
- Status history display with timestamps
- Push notification integration for status changes
