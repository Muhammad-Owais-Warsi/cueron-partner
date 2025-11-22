# Agency Analytics Dashboard API

## Endpoint
`GET /api/agencies/{id}/analytics`

## Description
Provides comprehensive analytics data formatted for dashboard visualizations including jobs completed aggregation, revenue calculations, rating aggregations, trend analysis, and chart-ready data.

This endpoint differs from `/api/agencies/{id}/metrics` by focusing on chart-ready data structures optimized for frontend visualization libraries like Recharts.

## Requirements
- **10.1**: Analytics dashboard completeness - Display jobs completed, revenue, and ratings
- **10.3**: Performance chart presence - Include charts and visualizations
- **10.4**: Engineer metrics calculation - Calculate success rate, ratings, and job counts

## Authentication
Requires valid JWT session token.

## Authorization
- User must have `agency:read` permission
- User can only access analytics for their own agency (RLS enforcement)

## Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `'6months'` | Time period: `'1month'`, `'3months'`, `'6months'`, `'1year'`, `'all'` |
| `includeCharts` | boolean | `true` | Include chart-ready data structures |

## Response Format

### Success Response (200 OK)
```json
{
  "agency_id": "uuid",
  "period": "6months",
  "summary": {
    "total_jobs_completed": 150,
    "total_revenue": 450000,
    "avg_rating": 4.5,
    "total_engineers": 12,
    "active_engineers": 8
  },
  "charts": {
    "jobs_trend": [
      {
        "month": "2024-08",
        "completed": 20,
        "cancelled": 2,
        "total": 22
      }
    ],
    "revenue_trend": [
      {
        "month": "2024-08",
        "revenue": 60000,
        "avg_job_value": 3000
      }
    ],
    "rating_distribution": [
      { "rating": 5, "count": 80 },
      { "rating": 4, "count": 50 },
      { "rating": 3, "count": 15 },
      { "rating": 2, "count": 3 },
      { "rating": 1, "count": 2 }
    ],
    "job_type_distribution": [
      { "type": "AMC", "count": 60, "percentage": 40 },
      { "type": "Repair", "count": 50, "percentage": 33.3 },
      { "type": "Installation", "count": 30, "percentage": 20 },
      { "type": "Emergency", "count": 10, "percentage": 6.7 }
    ],
    "engineer_performance": [
      {
        "engineer_id": "uuid",
        "engineer_name": "John Doe",
        "jobs_completed": 25,
        "avg_rating": 4.8,
        "success_rate": 96
      }
    ]
  },
  "trends": {
    "jobs_growth": 15.5,
    "revenue_growth": 12.3,
    "rating_change": 0.2
  },
  "generated_at": "2024-08-15T10:30:00Z"
}
```

### Error Responses

#### 400 Bad Request - Invalid Parameters
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid period parameter",
    "timestamp": "2024-08-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 401 Unauthorized
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "timestamp": "2024-08-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden - Access Denied
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied to agency data",
    "timestamp": "2024-08-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Data Sources
- `agency_monthly_metrics` materialized view
- `engineer_performance_metrics` materialized view
- `dashboard_realtime` view
- `jobs` table for detailed analytics

## Performance Considerations
- Materialized views are refreshed periodically
- Chart data is pre-aggregated for fast response times
- Response is cached for 5 minutes on the client side

## Example Usage

### Get 6-month analytics with charts
```bash
curl -X GET \
  'https://api.cueron.com/api/agencies/123e4567-e89b-12d3-a456-426614174000/analytics?period=6months' \
  -H 'Authorization: Bearer <token>'
```

### Get 1-year analytics without charts
```bash
curl -X GET \
  'https://api.cueron.com/api/agencies/123e4567-e89b-12d3-a456-426614174000/analytics?period=1year&includeCharts=false' \
  -H 'Authorization: Bearer <token>'
```

## Related Endpoints
- `GET /api/agencies/{id}/metrics` - Detailed metrics with trends
- `GET /api/agencies/{id}/jobs` - Job listings
- `POST /api/reports/export` - Export analytics as PDF/CSV
