# Dashboard Components

This directory contains the dashboard UI components for the Cueron Partner Agency Management Platform web application.

## Components

### OverviewCard

Displays key metrics with icon, label, value, and optional trend indicator.

**Props:**
- `title`: string - Card title/label
- `value`: string | number - Main metric value to display
- `icon`: React.ReactNode - Icon component
- `trend`: { value: number, isPositive: boolean } - Optional trend indicator
- `subtitle`: string - Optional subtitle text
- `loading`: boolean - Show loading skeleton

**Usage:**
```tsx
<OverviewCard
  title="Jobs Completed"
  value={150}
  icon={<JobIcon />}
  trend={{ value: 12.5, isPositive: true }}
  subtitle="Last 6 months"
/>
```

### QuickActions

Displays a grid of action buttons for common tasks.

**Props:**
- `actions`: QuickAction[] - Array of action button configurations

**QuickAction Interface:**
```typescript
interface QuickAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}
```

**Usage:**
```tsx
<QuickActions
  actions={[
    {
      label: 'Assign Job',
      icon: <PlusIcon />,
      onClick: () => handleAssignJob(),
      variant: 'primary',
    },
    // ... more actions
  ]}
/>
```

### RecentActivity

Displays a real-time activity feed with Supabase Realtime integration.

**Props:**
- `agencyId`: string - Agency ID to fetch activities for
- `limit`: number - Maximum number of activities to display (default: 10)

**Features:**
- Real-time updates via Supabase Realtime
- Activity type icons (job assigned, completed, engineer added, payment received)
- Relative timestamps (e.g., "5m ago", "2h ago")
- Auto-scrolling feed

**Usage:**
```tsx
<RecentActivity agencyId="agency-uuid" limit={10} />
```

### PerformanceCharts

Displays analytics charts using Recharts library.

**Props:**
- `jobsTrend`: JobsTrendData[] - Jobs trend over time
- `revenueTrend`: RevenueTrendData[] - Revenue trend over time
- `ratingDistribution`: RatingDistributionData[] - Rating distribution
- `jobTypeDistribution`: JobTypeDistributionData[] - Job type breakdown
- `loading`: boolean - Show loading skeletons

**Chart Types:**
1. **Jobs Trend** - Line chart showing completed, cancelled, and total jobs
2. **Revenue Trend** - Bar chart showing monthly revenue
3. **Rating Distribution** - Bar chart showing rating counts (1-5 stars)
4. **Job Type Distribution** - Pie chart showing job type breakdown

**Usage:**
```tsx
<PerformanceCharts
  jobsTrend={data.charts.jobs_trend}
  revenueTrend={data.charts.revenue_trend}
  ratingDistribution={data.charts.rating_distribution}
  jobTypeDistribution={data.charts.job_type_distribution}
/>
```

### Loading Skeletons

Provides loading placeholders for async data.

**Components:**
- `DashboardSkeleton` - Full dashboard loading state
- `CardSkeleton` - Single card loading state
- `ChartSkeleton` - Chart loading state

**Usage:**
```tsx
{loading ? <DashboardSkeleton /> : <DashboardContent />}
```

## Data Flow

1. Dashboard page fetches analytics data from `/api/agencies/{id}/analytics`
2. Data is passed to individual components as props
3. RecentActivity component subscribes to Supabase Realtime for live updates
4. Charts are rendered using Recharts with responsive containers

## Requirements Validation

This implementation satisfies the following requirements:

- **Requirement 10.1**: Analytics dashboard displays jobs completed, revenue, and average ratings
- **Requirement 10.3**: Performance data is displayed using charts and visualizations
- **Requirement 10.4**: Engineer metrics calculation and display

## Styling

All components use Tailwind CSS for styling with:
- Consistent color palette (blue, green, yellow, purple, red)
- Responsive grid layouts
- Hover and focus states
- Loading animations
- Shadow and border utilities

## Real-time Features

The RecentActivity component uses Supabase Realtime to:
- Subscribe to job updates for the agency
- Display new activities as they occur
- Show live indicator when connected
- Handle reconnection automatically

## Accessibility

- Semantic HTML elements
- ARIA labels where appropriate
- Keyboard navigation support
- Focus indicators on interactive elements
- Color contrast compliance

## Performance

- Lazy loading of chart library (Recharts)
- Memoization of expensive calculations
- Efficient re-rendering with React hooks
- Responsive container sizing
- Optimized SVG icons
