# Profile Screens

This directory contains the engineer profile and performance screens for the mobile application.

## Screens

### ProfileScreen
**File:** `ProfileScreen.tsx`  
**Requirements:** 15.1, 15.2, 15.3, 15.4, 15.5

Main profile screen displaying:
- Engineer profile information (photo, name, contact)
- Performance metrics summary (jobs completed, average rating, success rate)
- Availability status toggle (available, offline, on_leave)
- Specializations and certifications
- Navigation to detailed screens

**Features:**
- Pull-to-refresh for updated data
- Real-time availability status updates
- Profile photo display with fallback to initials
- Certification verification status indicators

### JobHistoryScreen
**File:** `JobHistoryScreen.tsx`  
**Requirements:** 15.3, 15.4

Displays complete job history with:
- Job details (number, type, client, location)
- Completion dates
- Client ratings (star display)
- Client feedback text
- Service fees

**Features:**
- Pull-to-refresh
- Color-coded job types
- Empty state handling
- Chronological ordering (newest first)

### PerformanceMetricsScreen
**File:** `PerformanceMetricsScreen.tsx`  
**Requirements:** 15.1, 15.2

Detailed performance analytics including:
- Performance summary (jobs, ratings, success rate, revenue)
- Rating distribution visualization
- Performance by job type breakdown
- Monthly trend analysis
- Success rate calculation breakdown

**Features:**
- Period selector (week, month, quarter, year)
- Pull-to-refresh
- Visual data representations
- Detailed metric breakdowns

### SettingsScreen
**File:** `SettingsScreen.tsx`

App settings and preferences:
- Notification preferences
- Location tracking toggle
- Account management
- App information
- Logout functionality

## Data Hooks

### useEngineerProfile
**File:** `../../hooks/useEngineerProfile.ts`

Custom React Query hooks for:
- `useEngineerProfile()` - Fetch engineer profile data
- `useEngineerPerformance()` - Fetch performance metrics and history
- `useUpdateAvailability()` - Update availability status
- `useUploadProfilePhoto()` - Upload profile photo
- `getCurrentEngineerId()` - Get current user's engineer ID

## API Integration

### Endpoints Used

1. **GET /api/engineers/{id}**
   - Fetches engineer profile data
   - Returns: name, phone, email, photo_url, certifications, skill_level, specializations, availability_status

2. **GET /api/engineers/{id}/performance**
   - Fetches performance metrics and job history
   - Query params: `period` (week|month|quarter|year|all), `include_history` (true|false)
   - Returns: performance summary, rating details, job history, certifications, trends

3. **PATCH /api/engineers/{id}**
   - Updates engineer information (availability status, profile data)
   - Body: `{ availability_status: 'available' | 'offline' | 'on_leave' }`

## Requirements Mapping

### Requirement 15.1: Profile Metrics Display
**Validated by Property 67**
- ProfileScreen displays total_jobs_completed and average_rating
- PerformanceMetricsScreen shows comprehensive metrics

### Requirement 15.2: Success Rate Calculation
**Validated by Property 68**
- Success rate = (completed_jobs / (completed_jobs + cancelled_jobs)) × 100
- Displayed in ProfileScreen and PerformanceMetricsScreen
- Detailed breakdown in PerformanceMetricsScreen

### Requirement 15.3: Job History Display
**Validated by Property 69**
- JobHistoryScreen shows all completed jobs
- Each job displays completion date and client rating
- Chronologically ordered

### Requirement 15.4: Feedback Display
**Validated by Property 70**
- JobHistoryScreen displays client_feedback alongside ratings
- Formatted in a dedicated feedback section

### Requirement 15.5: Certification Display
**Validated by Property 71**
- ProfileScreen shows all certifications
- Displays type, level, and verification status
- Includes cert number and issue date

## Usage

```typescript
// Navigate to profile screens
navigation.navigate('ProfileHome');
navigation.navigate('JobHistory');
navigation.navigate('PerformanceMetrics');
navigation.navigate('Settings');
```

## State Management

- Uses React Query for data fetching and caching
- Automatic refetch on focus
- Pull-to-refresh support
- Optimistic updates for availability changes

## Error Handling

- Loading states with ActivityIndicator
- Error states with retry buttons
- Empty states for no data
- Alert dialogs for user feedback

## Styling

- Consistent with React Native Paper theme
- Responsive layouts
- Color-coded status indicators
- Card-based UI components

## Future Enhancements

1. Profile photo upload functionality
2. Edit profile information
3. Change password
4. Export performance reports
5. Share achievements
6. Performance goal setting
