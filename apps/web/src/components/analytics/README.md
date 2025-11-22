# Analytics Components

This directory contains components for the analytics and reports functionality of the Cueron Partner Platform.

## Components

### AnalyticsDashboard
Main analytics dashboard component that displays comprehensive performance metrics with charts.

**Features:**
- Summary cards for key metrics (jobs completed, revenue, ratings, engineer utilization)
- Performance trend indicators
- Interactive charts (jobs trend, revenue trend, rating distribution, job type distribution)
- Top performing engineers table
- Period selection (1 month, 3 months, 6 months, 1 year, all time)

**Requirements:** 10.1, 10.3, 10.4

**Usage:**
```tsx
<AnalyticsDashboard
  data={analyticsData}
  loading={isLoading}
  period="6months"
/>
```

### EngineerPerformanceComparison
Component for comparing performance metrics across engineers.

**Features:**
- Sortable table view with engineer performance metrics
- Interactive chart view with bar charts and radar charts
- Multi-select for detailed comparison (up to 5 engineers)
- Performance metrics: jobs completed, average rating, success rate
- Visual indicators for availability status

**Requirements:** 10.4

**Usage:**
```tsx
<EngineerPerformanceComparison
  engineers={engineersData}
  loading={isLoading}
  agencyId={agencyId}
/>
```

### ReportExportInterface
Interface for exporting reports in CSV and PDF formats.

**Features:**
- Report type selection (monthly, quarterly, annual, custom range)
- Format selection (CSV, PDF)
- Custom date range picker
- Export status feedback
- Report contents preview

**Requirements:** 16.1, 16.4

**Usage:**
```tsx
<ReportExportInterface agencyId={agencyId} />
```

### MonthlyReportPreview
Preview component for monthly report content before exporting.

**Features:**
- Month selector for last 12 months
- Executive summary with key metrics
- Performance trends display
- Report contents checklist
- Visual metric cards

**Requirements:** 16.4

**Usage:**
```tsx
<MonthlyReportPreview agencyId={agencyId} />
```

## Data Flow

1. **Analytics Dashboard Page** (`/dashboard/analytics`)
   - Fetches analytics data from `/api/agencies/{id}/analytics`
   - Fetches engineer data from `/api/agencies/{id}/engineers`
   - Manages tab navigation and period selection

2. **Analytics API** (`/api/agencies/{id}/analytics`)
   - Queries materialized views for performance metrics
   - Calculates trends and aggregations
   - Returns chart-ready data structures

3. **Engineer Performance API** (`/api/engineers/{id}/performance`)
   - Provides detailed performance metrics for individual engineers
   - Used for detailed comparison in radar charts

## Charts

All charts use **Recharts** library with consistent styling:
- Line charts for trends over time
- Bar charts for comparisons and distributions
- Pie charts for proportional data
- Radar charts for multi-dimensional comparisons

## Styling

Components use Tailwind CSS with consistent design patterns:
- White cards with shadow-sm for content containers
- Blue color scheme for primary actions
- Green for positive trends, red for negative trends
- Gray scale for neutral elements
- Responsive grid layouts

## Future Enhancements

- Real-time data updates using Supabase Realtime
- Export scheduling and email delivery
- Custom report templates
- Advanced filtering and drill-down capabilities
- Comparison with industry benchmarks
