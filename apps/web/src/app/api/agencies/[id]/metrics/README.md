# Agency Metrics and Analytics API

## Overview

This API endpoint provides comprehensive performance metrics and analytics for agencies, including monthly metrics, performance trends, revenue aggregation, and engineer utilization statistics.

## Endpoint

```
GET /api/agencies/{id}/metrics
```

## Authentication

Requires valid JWT session token. User must have `agency:read` permission and can only access metrics for their own agency (enforced by Row Level Security).

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `monthly` | Aggregation period: `monthly`, `quarterly`, or `yearly` |
| `months` | number | `6` | Number of months to include (1-24) |

## Response Format

```typescript
{
  agency_id: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  months_included: number;
  
  // Current month real-time snapshot
  current_month: {
    jobs_today: number;
    active_engineers: number;
    available_engineers: number;
    pending_jobs: number;
    in_progress_jobs: number;
    completed_today: number;
    pending_payments: number;
    monthly_revenue: number;
    monthly_avg_rating: number;
  } | null;
  
  // Historical monthly metrics
  monthly_metrics: Array<{
    agency_id: string;
    agency_name: string;
    month: string;
    jobs_completed: number;
    engineers_utilized: number;
    total_revenue: number;
    avg_job_value: number;
    avg_rating: number;
    positive_ratings: number;
    avg_completion_hours: number;
    avg_response_hours: number;
    amc_jobs: number;
    repair_jobs: number;
    installation_jobs: number;
    emergency_jobs: number;
    successful_jobs: number;
    cancelled_jobs: number;
    last_refreshed: string;
  }>;
  
  // Performance trends (month-over-month)
  trends: {
    jobs_completed: number; // Percentage change
    revenue: number; // Percentage change
    avg_rating: number; // Percentage change
    engineer_utilization: number; // Percentage change
  };
  
  // Revenue aggregation
  revenue_summary: {
    total_revenue: number;
    avg_monthly_revenue: number;
    highest_month: {
      month: string;
      revenue: number;
    } | null;
    lowest_month: {
      month: string;
      revenue: number;
    } | null;
  };
  
  // Engineer utilization statistics
  engineer_utilization: {
    avg_utilization: number;
    total_engineers_utilized: number;
    utilization_trend: Array<{
      month: string;
      engineers_utilized: number;
      jobs_completed: number;
      jobs_per_engineer: string;
    }>;
  };
  
  // Top performing engineers
  top_engineers: Array<{
    engineer_id: string;
    engineer_name: string;
    avg_rating: number;
    completed_jobs: number;
    success_rate: number;
  }>;
  
  // Metadata
  last_refreshed: string;
  generated_at: string;
}
```

## Example Requests

### Get default metrics (last 6 months, monthly)
```bash
curl -X GET \
  'https://api.cueron.com/api/agencies/123e4567-e89b-12d3-a456-426614174000/metrics' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get quarterly metrics for last 12 months
```bash
curl -X GET \
  'https://api.cueron.com/api/agencies/123e4567-e89b-12d3-a456-426614174000/metrics?period=quarterly&months=12' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Error Responses

### 400 Bad Request - Invalid ID Format
```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid agency ID format",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 400 Bad Request - Invalid Parameters
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid period parameter. Must be monthly, quarterly, or yearly",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 403 Forbidden - Insufficient Permissions
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "User does not have permission to perform agency:read",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 403 Forbidden - Data Isolation Violation
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied: User can only access their own agency data",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

### 500 Internal Server Error
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch metrics data",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Data Sources

The endpoint aggregates data from multiple sources:

1. **agency_monthly_metrics** (Materialized View)
   - Pre-aggregated monthly statistics
   - Refreshed automatically or on-demand
   - Provides historical performance data

2. **dashboard_realtime** (View)
   - Real-time current month snapshot
   - Live job and engineer status
   - Current day metrics

3. **engineer_performance_metrics** (Materialized View)
   - Individual engineer performance
   - Used for top performers ranking

## Performance Considerations

- The endpoint attempts to refresh materialized views before querying
- If refresh fails, it continues with existing cached data
- Materialized views are indexed for fast queries
- Response time typically < 500ms for 12 months of data

## Requirements Validation

This endpoint validates the following requirements:

- **10.1**: Analytics dashboard displays jobs completed, revenue, and average ratings
- **10.2**: Monthly metrics queried from materialized view
- **10.3**: Performance data displayed with trends and charts
- **10.4**: Engineer performance metrics calculated (success rate, rating, jobs)
- **10.5**: Analytics data filtered to show only requesting agency information

## Security

- JWT authentication required
- Role-based access control (requires `agency:read` permission)
- Data isolation enforced (users can only access their own agency metrics)
- Row Level Security policies applied at database level
- No sensitive data exposed in error messages

## Related Endpoints

- `GET /api/agencies/{id}` - Get agency profile
- `PATCH /api/agencies/{id}` - Update agency profile
- `GET /api/agencies/{id}/engineers` - List agency engineers
- `GET /api/agencies/{id}/jobs` - List agency jobs
