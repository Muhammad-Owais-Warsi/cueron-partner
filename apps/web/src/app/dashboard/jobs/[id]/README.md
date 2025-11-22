# Job Detail Page

## Overview

The job detail page provides a comprehensive view of a single job with all relevant information, real-time status updates, embedded map with location markers, engineer assignment functionality, and distance calculations.

## Requirements

This implementation satisfies the following requirements:

- **3.2**: Display complete job details (client info, location, equipment type, skill level)
- **3.4**: Highlight skill requirement in job details
- **3.5**: Calculate and show distance from available engineers
- **4.1**: Verify engineer availability before assignment
- **4.2**: Update job status to 'assigned' with timestamp
- **6.4**: Real-time status updates display

## Features

### 1. Job Detail Display

- **Job Information**: Job number, client name, phone, job type, equipment type
- **Skill Requirement Highlighting**: Prominently displayed with level and description in a highlighted box
- **Equipment Details**: Brand, model, serial number, capacity (if available)
- **Issue Description**: Full description of the problem
- **Service Fee**: Displayed if available
- **Scheduled Time**: When the job is scheduled

### 2. Embedded Map with Location Markers

- **Google Maps Integration**: Interactive map showing job location
- **Job Location Marker**: Red marker indicating the service site
- **Engineer Location Marker**: Blue marker showing real-time engineer position (when available)
- **Auto-fit Bounds**: Map automatically adjusts to show both markers
- **Fallback Display**: Shows coordinates if map fails to load

### 3. Engineer Selection with Availability

- **Available Engineers List**: Shows only engineers with 'available' status
- **Distance Display**: Shows distance in kilometers from job location
- **Travel Time**: Estimated travel time in minutes (when Google Maps API is available)
- **Engineer Details**: Name, phone, skill level, availability status, specializations
- **Performance Metrics**: Average rating and completed jobs
- **Search Functionality**: Filter engineers by name or phone
- **Sorted by Distance**: Closest engineers appear first

### 4. Distance Calculation

- **Google Maps Distance Matrix API**: Primary method for accurate distance and duration
- **Haversine Formula Fallback**: Used when Google Maps API is unavailable
- **Real-time Calculation**: Distances calculated when job details are loaded
- **Multiple Engineers**: Calculates distances for all available engineers simultaneously

### 5. Job Assignment Confirmation Dialog

- **Engineer Summary**: Shows selected engineer's details
- **Job Summary**: Displays job information
- **Distance & Travel Time**: Shows calculated distance and estimated travel time
- **Skill Level Warning**: Alerts if engineer's skill level is below required level
- **Confirmation Required**: Prevents accidental assignments
- **Loading State**: Shows progress during assignment

### 6. Real-time Status Updates

- **Supabase Realtime Integration**: Subscribes to job status changes
- **Live Status Display**: Updates job status without page refresh
- **Engineer Location Tracking**: Shows real-time engineer position on map
- **Last Update Timestamp**: Displays when the last update occurred
- **Visual Indicator**: Animated pulse indicator for real-time updates

### 7. Job Status Timeline

- **Visual Timeline**: Shows job progression through all stages
- **Status Icons**: Each stage has a unique icon
- **Timestamps**: Displays when each status was reached
- **Current Status Highlight**: Active status is highlighted in blue
- **Completed Status**: Green checkmarks for completed stages
- **Future Status**: Gray indicators for pending stages
- **Cancellation Display**: Special handling for cancelled jobs
- **Completion Details**: Shows client rating and feedback when completed

## Components

### JobDetailView

Main component that orchestrates the job detail page.

**Props:**
- `jobId: string` - The UUID of the job to display

**Features:**
- Fetches job details from API
- Manages engineer selection state
- Handles job assignment
- Subscribes to real-time updates
- Coordinates all child components

### JobMap

Interactive Google Maps component showing job and engineer locations.

**Props:**
- `jobLocation: { lat: number; lng: number }` - Job site coordinates
- `engineerLocation?: { lat: number; lng: number } | null` - Engineer's current location

**Features:**
- Loads Google Maps JavaScript API
- Creates interactive map with markers
- Auto-adjusts bounds to show all markers
- Updates engineer marker in real-time
- Provides fallback for API failures

### EngineerSelector

Component for selecting an engineer from available options.

**Props:**
- `engineers: EngineerWithDistance[]` - List of available engineers with distance info
- `selectedEngineerId: string | null` - Currently selected engineer ID
- `onSelect: (engineerId: string) => void` - Callback when engineer is selected

**Features:**
- Search/filter engineers
- Display engineer details and metrics
- Show distance and travel time
- Highlight selected engineer
- Responsive design

### AssignmentConfirmDialog

Modal dialog for confirming engineer assignment.

**Props:**
- `engineer: EngineerWithDistance` - Selected engineer
- `job: Job` - Job being assigned
- `onConfirm: () => void` - Callback to confirm assignment
- `onCancel: () => void` - Callback to cancel
- `isAssigning: boolean` - Loading state

**Features:**
- Summary of assignment details
- Skill level mismatch warning
- Loading state during assignment
- Prevents accidental assignments

### JobStatusTimeline

Visual timeline showing job progression.

**Props:**
- `job: Job` - Job with status information

**Features:**
- Visual representation of job stages
- Timestamps for each stage
- Current status highlighting
- Completion details
- Cancellation handling

## API Integration

### GET /api/jobs/{id}

Fetches complete job details including:
- Job information
- Skill requirement highlighting
- Available engineers with distances
- Distance calculation metadata

### POST /api/jobs/{id}/assign

Assigns an engineer to a job:
- Validates engineer availability
- Updates job status to 'assigned'
- Updates engineer status to 'on_job'
- Sends push notification
- Returns updated job and engineer info

## Real-time Features

### Job Status Updates

Uses Supabase Realtime to subscribe to job status changes:
- Automatic status updates
- Engineer location updates
- No page refresh required

### Location Tracking

When engineer is travelling or onsite:
- Real-time location updates every 30 seconds
- Updates map marker position
- Shows last update timestamp

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Navigation

- **From Jobs List**: Click "View" button on any job row
- **Back to Jobs**: Click "← Back to Jobs" button
- **Direct URL**: `/dashboard/jobs/{job-id}`

## Error Handling

- Invalid job ID format validation
- Job not found handling
- API error display
- Map loading failures
- Assignment errors with user feedback

## Responsive Design

- Desktop: Three-column layout with sidebar
- Tablet: Stacked layout with full-width components
- Mobile: Single column with optimized spacing

## Testing

To test the job detail page:

1. Navigate to the jobs list
2. Click "View" on any job
3. Verify all job details are displayed
4. Check that the map loads with job location marker
5. If engineers are available, verify they appear in the selector
6. Select an engineer and click "Assign Engineer"
7. Confirm the assignment in the dialog
8. Verify the job status updates to "assigned"
9. Check that real-time updates work by updating the job status from another client

## Future Enhancements

- Print job details
- Export job information
- Job history/audit log
- Engineer performance comparison
- Route optimization for multiple jobs
- Offline support for mobile
