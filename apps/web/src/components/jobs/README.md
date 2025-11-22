# Jobs Components

This directory contains components for the jobs list and filtering UI.

## Components

### JobsListView
Main container component that manages the jobs list state, filtering, sorting, and pagination.

**Features:**
- Fetches jobs from the API
- Manages filter state
- Handles sorting by urgency and scheduled time
- Implements pagination
- Displays loading and error states

**Requirements:** 3.1, 3.3, 18.1, 18.2, 18.3, 18.4

### JobsTable
Displays jobs in a sortable table format with status badges and action links.

**Features:**
- Sortable columns (urgency, scheduled time)
- Status and urgency badges with color coding
- Job details display (client, type, location)
- View action link to job details page
- Loading skeleton

**Requirements:** 3.1, 3.3

### JobsFilters
Collapsible filter panel with multiple filter types.

**Features:**
- Status filter (multi-select dropdown)
- Date range filter (from/to date pickers)
- Location filter (geographic radius)
- Active filter count badge
- Clear all filters button

**Requirements:** 18.1, 18.2, 18.3, 18.4

### Filter Components

#### StatusFilter
Multi-select dropdown for filtering by job status.

**Statuses:**
- Pending
- Assigned
- Accepted
- Travelling
- On Site
- Completed
- Cancelled

**Requirement:** 18.2

#### DateRangeFilter
Date range picker for filtering jobs by scheduled time.

**Features:**
- From date picker
- To date picker
- Clear button
- Min/max validation

**Requirement:** 18.3

#### LocationFilter
Geographic filter with radius selection.

**Features:**
- Latitude/longitude input
- Radius (km) selection
- Modal interface
- Helpful tips for getting coordinates

**Requirement:** 18.4

### JobsPagination
Pagination controls with page numbers and navigation buttons.

**Features:**
- Previous/Next buttons
- Page number buttons
- Ellipsis for large page counts
- Results count display
- Disabled state for boundary pages

## Usage

```tsx
import { JobsListView } from '@/components/jobs';

export default function JobsPage() {
  return <JobsListView />;
}
```

## API Integration

The components integrate with the `/api/agencies/{id}/jobs` endpoint, which supports:

- **Pagination:** `page`, `limit` query parameters
- **Sorting:** `sort_by`, `sort_order` query parameters
- **Filters:**
  - `status`: Comma-separated list of statuses
  - `urgency`: Comma-separated list of urgency levels
  - `date_from`, `date_to`: ISO date strings
  - `lat`, `lng`, `radius_km`: Geographic filter parameters

## Styling

Components use Tailwind CSS with the following design patterns:
- White backgrounds with subtle shadows
- Blue accent color for primary actions
- Status-specific color coding
- Responsive grid layouts
- Hover states for interactive elements
- Loading skeletons for async data

### JobDetailView

Comprehensive job detail page with real-time updates, map integration, and engineer assignment.

**Features:**
- Complete job information display with skill requirement highlighting
- Embedded Google Maps with job and engineer location markers
- Engineer selection with availability, distance, and travel time
- Job assignment confirmation dialog with skill level warnings
- Real-time status updates via Supabase Realtime
- Job status timeline with visual progression
- Distance calculation using Google Maps Distance Matrix API or Haversine formula

**Requirements:** 3.2, 3.4, 3.5, 4.1, 4.2, 6.4

**Usage:**
```tsx
import { JobDetailView } from '@/components/jobs';

<JobDetailView jobId="job-uuid" />
```

### JobMap

Interactive Google Maps component showing job and engineer locations.

**Features:**
- Google Maps JavaScript API integration
- Job location marker (red)
- Engineer location marker (blue) with real-time updates
- Auto-fit bounds to show all markers
- Fallback display for API failures

**Requirements:** 3.5, 6.4

### EngineerSelector

Engineer selection component with search and filtering.

**Features:**
- Search engineers by name or phone
- Display distance and travel time
- Show engineer details (skill level, availability, ratings)
- Highlight selected engineer
- Sorted by distance (closest first)

**Requirements:** 3.5, 4.1

### AssignmentConfirmDialog

Modal dialog for confirming engineer assignment to a job.

**Features:**
- Assignment summary with engineer and job details
- Distance and travel time display
- Skill level mismatch warning
- Loading state during assignment
- Confirmation and cancellation actions

**Requirements:** 4.1, 4.2

### JobStatusTimeline

Visual timeline showing job progression through all stages.

**Features:**
- Visual representation of job stages with icons
- Timestamps for each completed stage
- Current status highlighting
- Completion details (rating, feedback)
- Cancellation handling

**Requirements:** 6.4

## Future Enhancements

- Map view for location filter
- Saved filter presets
- Export filtered results
- Bulk actions on selected jobs
- Print job details
- Job history/audit log
- Route optimization for multiple jobs
