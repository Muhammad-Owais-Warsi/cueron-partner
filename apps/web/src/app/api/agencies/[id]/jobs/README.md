# Agency Jobs Listing and Filtering API

## Endpoint

```
GET /api/agencies/{id}/jobs
```

## Description

Lists and filters jobs assigned to a specific agency with comprehensive filtering capabilities including status, date range, location-based (PostGIS spatial queries), and multi-filter combination with AND logic. Results are sorted by urgency (emergency > urgent > normal > scheduled) and then by scheduled time.

## Requirements

- **3.1**: Agency job isolation - only shows jobs assigned to the requesting agency
- **3.2**: Job detail completeness - returns complete job information
- **3.3**: Job list sorting - sorts by urgency and scheduled time
- **18.1**: Filter criteria matching - all returned jobs match specified criteria
- **18.2**: Status filter accuracy - filters by job status
- **18.3**: Date range filter accuracy - filters by scheduled time range
- **18.4**: Spatial filter accuracy - filters by geographic location using PostGIS
- **18.5**: Multi-filter combination - combines filters using AND logic

## Authentication

Requires valid JWT session token. User must have `agency:read` permission and can only access jobs for their own agency.

## Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `id` | UUID | Yes | Agency ID |

## Query Parameters

| Parameter | Type | Required | Description | Example |
|-----------|------|----------|-------------|---------|
| `status` | string | No | Comma-separated job statuses | `pending,assigned` |
| `urgency` | string | No | Comma-separated urgency levels | `emergency,urgent` |
| `date_from` | string | No | ISO 8601 date for start of range | `2025-01-01T00:00:00Z` |
| `date_to` | string | No | ISO 8601 date for end of range | `2025-01-31T23:59:59Z` |
| `location_lat` | number | No | Latitude for spatial filtering | `28.6139` |
| `location_lng` | number | No | Longitude for spatial filtering | `77.2090` |
| `location_radius_km` | number | No | Radius in kilometers | `50` |
| `page` | number | No | Page number (default: 1) | `1` |
| `limit` | number | No | Items per page (default: 20, max: 100) | `20` |

### Valid Filter Values

**Status**: `pending`, `assigned`, `accepted`, `travelling`, `onsite`, `completed`, `cancelled`

**Urgency**: `emergency`, `urgent`, `normal`, `scheduled`

## Response

### Success Response (200 OK)

```json
{
  "jobs": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "job_number": "JOB-2025-1234",
      "client_name": "ABC Cold Storage",
      "client_phone": "9876543210",
      "job_type": "AMC",
      "equipment_type": "Industrial Chiller",
      "equipment_details": {
        "brand": "Carrier",
        "model": "30XA",
        "capacity": "500 TR"
      },
      "issue_description": "Routine maintenance check",
      "site_location": {
        "address": "123 Industrial Area",
        "city": "Delhi",
        "state": "Delhi",
        "lat": 28.6139,
        "lng": 77.2090
      },
      "assigned_agency_id": "660e8400-e29b-41d4-a716-446655440000",
      "assigned_engineer_id": "770e8400-e29b-41d4-a716-446655440000",
      "required_skill_level": 4,
      "scheduled_time": "2025-01-20T10:00:00Z",
      "urgency": "normal",
      "status": "assigned",
      "assigned_at": "2025-01-19T15:30:00Z",
      "service_fee": 5000.00,
      "payment_status": "pending",
      "created_at": "2025-01-19T15:00:00Z",
      "updated_at": "2025-01-19T15:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "filters_applied": {
    "status": ["pending", "assigned"],
    "urgency": null,
    "date_from": "2025-01-01T00:00:00Z",
    "date_to": "2025-01-31T23:59:59Z",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090,
      "radius_km": 50
    }
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid ID Format
```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid agency ID format",
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 400 Bad Request - Invalid Filter
```json
{
  "error": {
    "code": "INVALID_FILTER",
    "message": "Invalid status values: invalid_status",
    "details": {
      "status": ["Valid values are: pending, assigned, accepted, travelling, onsite, completed, cancelled"]
    },
    "timestamp": "2025-01-20T10:30:00Z",
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
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden - Insufficient Permissions
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions for agency:read",
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden - Data Isolation Violation
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied: cannot access data for agency 660e8400-e29b-41d4-a716-446655440000",
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch jobs",
    "timestamp": "2025-01-20T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Sorting Logic

Jobs are sorted using the following priority:

1. **Urgency** (highest priority first):
   - `emergency` (priority 1)
   - `urgent` (priority 2)
   - `normal` (priority 3)
   - `scheduled` (priority 4)

2. **Scheduled Time** (earlier first):
   - Jobs with earlier scheduled times appear first
   - Jobs without scheduled time appear last

## Spatial Filtering

The location filter uses PostGIS spatial queries for accurate geographic filtering:

1. Attempts to use the `filter_jobs_by_location` RPC function for server-side PostGIS filtering
2. Falls back to client-side Haversine distance calculation if RPC is unavailable
3. Filters jobs within the specified radius from the given coordinates

## Multi-Filter Combination

All filters are combined using AND logic (Property 86):
- A job must match ALL specified filter criteria to be included in results
- Example: `status=pending&urgency=emergency` returns only jobs that are BOTH pending AND emergency

## Examples

### Get all pending and assigned jobs
```bash
GET /api/agencies/660e8400-e29b-41d4-a716-446655440000/jobs?status=pending,assigned
```

### Get emergency jobs in January 2025
```bash
GET /api/agencies/660e8400-e29b-41d4-a716-446655440000/jobs?urgency=emergency&date_from=2025-01-01T00:00:00Z&date_to=2025-01-31T23:59:59Z
```

### Get jobs within 50km of Delhi
```bash
GET /api/agencies/660e8400-e29b-41d4-a716-446655440000/jobs?location_lat=28.6139&location_lng=77.2090&location_radius_km=50
```

### Combined filters with pagination
```bash
GET /api/agencies/660e8400-e29b-41d4-a716-446655440000/jobs?status=assigned,travelling&urgency=urgent,emergency&date_from=2025-01-15T00:00:00Z&page=2&limit=10
```

## Correctness Properties

This endpoint validates the following correctness properties:

- **Property 11**: Agency job isolation - all returned jobs belong to the requesting agency
- **Property 13**: Job list sorting - jobs are sorted by urgency then scheduled time
- **Property 82**: Filter criteria matching - all jobs match specified criteria
- **Property 83**: Status filter accuracy - status filtering works correctly
- **Property 84**: Date range filter accuracy - date range filtering works correctly
- **Property 85**: Spatial filter accuracy - location filtering works correctly
- **Property 86**: Multi-filter combination - multiple filters combine with AND logic

## Notes

- The endpoint enforces Row Level Security (RLS) through authorization checks
- Pagination is applied after filtering and sorting
- Location filtering requires all three parameters: lat, lng, and radius_km
- Maximum limit is 100 items per page to prevent performance issues
- Jobs without scheduled times are sorted to the end of the list
