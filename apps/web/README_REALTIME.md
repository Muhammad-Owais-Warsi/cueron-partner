# Real-time Functionality Implementation

This document explains how real-time updates are implemented in the application using Supabase Realtime.

## Overview

The application uses Supabase Realtime to provide live updates for:
- Job status changes
- Earnings updates
- Dashboard metrics

## Implementation Details

### 1. Custom Hooks

Two custom hooks were created to handle real-time updates:

#### `useRealtimeEarnings`
Located in `src/hooks/useRealtimeEarnings.ts`, this hook:
- Fetches initial earnings data from the API
- Subscribes to job updates that affect earnings
- Automatically refreshes earnings when relevant jobs are updated or created

#### `useRealtimeJobs`
Located in `src/hooks/useRealtimeJobs.ts`, this hook:
- Fetches initial jobs data from Supabase
- Subscribes to all job changes for the agency
- Automatically refreshes the job list when changes occur

### 2. Dashboard Integration

The dashboard (`src/app/dashboard/page.tsx`) now uses:
- `useRealtimeEarnings` for live earnings data
- Traditional API calls for analytics data (refreshed periodically)

### 3. Jobs List Integration

The jobs list view (`src/components/jobs/JobsListView.tsx`) uses:
- `useRealtimeJobs` for live job data
- Maintains pagination and filtering locally

## How It Works

1. **Initial Load**: Components fetch initial data via API or direct Supabase queries
2. **Subscription**: Components subscribe to PostgreSQL changes using `supabase.channel()`
3. **Updates**: When database changes occur, Supabase broadcasts updates to all subscribers
4. **Refresh**: Components automatically refresh their data when relevant changes occur

## Event Types Monitored

- `INSERT`: New jobs added
- `UPDATE`: Job status changes, completions, assignments
- `DELETE`: Jobs removed (rare in this application)

## Performance Considerations

- Subscriptions are automatically cleaned up when components unmount
- Only relevant changes trigger data refreshes
- Earnings updates are optimized to only refresh when job completion status changes

## Testing Real-time Functionality

To test the real-time functionality:

1. Open the dashboard in two browser windows
2. Complete a job in one window
3. Observe the earnings update automatically in both windows

You can also use the test utility in `src/lib/realtime/testRealtime.ts` for debugging.