# Engineer Performance Tracking API

## Endpoint

`GET /api/engineers/{id}/performance`

## Description

Retrieves comprehensive performance metrics and history for a specific engineer, including success rate calculation, job completion tracking, rating aggregation, and performance history.

## Requirements

- **15.1**: Display total jobs completed and average rating
- **15.2**: Calculate success rate from completed vs cancelled jobs
- **15.3**: Show job history with completion dates and ratings
- **15.4**: Display client feedback with ratings
- **15.5**: Show certification type, level, and verification status

## Authentication

Requires valid JWT token in the Authorization header or session cookie.

## Authorization

- User must have `engineer:read` permission
- User can only access engineers from their own agency (data isolation enforced)

## Path Parameters

| Parameter | Type   | Required | Description           |
|-----------|--------|----------|-----------------------|
| id        | UUID   | Yes      | Engineer ID           |

## Query Parameters

| Parameter       | Type    | Required | Default | Description                                    |
|----------------|---------|----------|---------|------------------------------------------------|
| period         | string  | No       | month   | Time period: week, month, quarter, year, all   |
| include_history| boolean | No       | true    | Whether to include detailed job history        |

## Response

### Success Response (200 OK)

```json
{
  "engineer_id": "uuid",
  "engineer_name": "John Doe",
  "period": "month",
  "performance_summary": {
    "total_jobs_completed": 45,
    "total_jobs_cancelled": 3,
    "success_rate": 93.75,
    "average_rating": 4.67,
    "total_ratings": 42,
    "revenue_generated": 135000
  },
  "rating_details": {
    "average_rating": 4.67,
    "total_ratings": 42,
    "rating_distribution": {
      "5": 28,
      "4": 12,
      "3": 2,
      "2": 0,
      "1": 0
    }
  },
  "job_history": [
    {
      "job_id": "uuid",
      "job_number": "JOB-2025-1234",
      "job_type": "AMC",
      "client_name": "ABC Cold Storage",
      "completed_at": "2025-01-15T10:30:00Z",
      "client_rating": 5,
      "client_feedback": "Excellent service, very professional",
      "service_fee": 3000,
      "site_location": {
        "address": "123 Main St",
        "city": "Mumbai",
        "state": "Maharashtra"
      }
    }
  ],
  "certifications": [
    {
      "type": "PMKVY",
      "level": 3,
      "cert_number": "PMKVY-2024-12345",
      "verified": true,
      "issued_date": "2024-06-15T00:00:00Z"
    }
  ],
  "performance_by_job_type": [
    {
      "job_type": "AMC",
      "total_jobs": 25,
      "average_rating": 4.8,
      "total_revenue": 75000
    },
    {
      "job_type": "Repair",
      "total_jobs": 15,
      "average_rating": 4.5,
      "total_revenue": 45000
    }
  ],
  "monthly_trend": [
    {
      "month": "2024-11",
      "jobs_completed": 12,
      "average_rating": 4.6,
      "revenue": 36000
    },
    {
      "month": "2024-12",
      "jobs_completed": 15,
      "average_rating": 4.7,
      "revenue": 45000
    }
  ],
  "engineer_details": {
    "skill_level": 4,
    "specializations": ["Cold Storage", "Industrial HVAC"],
    "employment_type": "full_time",
    "availability_status": "available"
  },
  "generated_at": "2025-01-20T12:00:00Z"
}
```

### Error Responses

#### 400 Bad Request - Invalid ID Format
```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid engineer ID format",
    "timestamp": "2025-01-20T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 400 Bad Request - Invalid Parameter
```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "Invalid period parameter. Must be week, month, quarter, year, or all",
    "timestamp": "2025-01-20T12:00:00Z",
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
    "timestamp": "2025-01-20T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden - Insufficient Permissions
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Insufficient permissions: engineer:read required",
    "timestamp": "2025-01-20T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden - Data Isolation
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied: You can only view engineers from your agency",
    "timestamp": "2025-01-20T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Engineer not found",
    "timestamp": "2025-01-20T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch job history",
    "timestamp": "2025-01-20T12:00:00Z",
    "request_id": "req_abc123"
  }
}
```

## Implementation Details

### Success Rate Calculation (Requirement 15.2)

The success rate is calculated as:
```
success_rate = (completed_jobs / (completed_jobs + cancelled_jobs)) * 100
```

If there are no jobs (completed + cancelled = 0), the success rate is 0.

### Rating Aggregation

- Only completed jobs with client ratings are included
- Average rating is calculated from all rated jobs
- Rating distribution shows count of each rating (1-5 stars)

### Job History

- Includes all completed jobs within the specified period
- Sorted by completion date (most recent first)
- Contains job details, ratings, and client feedback
- Can be excluded by setting `include_history=false`

### Performance by Job Type

- Aggregates metrics for each job type (AMC, Repair, Installation, Emergency)
- Shows total jobs, average rating, and total revenue per type
- Only includes job types with at least one completed job

### Monthly Trend

- Groups jobs by month (YYYY-MM format)
- Calculates jobs completed, average rating, and revenue per month
- Sorted chronologically

## Data Isolation

The API enforces strict data isolation:
- Users can only access engineers from their own agency
- Verified by comparing `session.agency_id` with `engineer.agency_id`
- Returns 403 Forbidden if access is denied

## Example Usage

### Get monthly performance
```bash
curl -X GET \
  'https://api.cueron.com/api/engineers/123e4567-e89b-12d3-a456-426614174000/performance?period=month' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get yearly performance without history
```bash
curl -X GET \
  'https://api.cueron.com/api/engineers/123e4567-e89b-12d3-a456-426614174000/performance?period=year&include_history=false' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Get all-time performance
```bash
curl -X GET \
  'https://api.cueron.com/api/engineers/123e4567-e89b-12d3-a456-426614174000/performance?period=all' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Related Endpoints

- `GET /api/engineers/{id}` - Get engineer details
- `GET /api/engineers/{id}/location` - Get engineer location
- `GET /api/agencies/{id}/engineers` - List all engineers for an agency
- `GET /api/agencies/{id}/metrics` - Get agency-level metrics

## Notes

- Performance metrics are calculated in real-time from the jobs table
- Large job histories may impact response time; consider using pagination for production
- The `include_history` parameter can be used to reduce response size when only summary metrics are needed
- All monetary values are in the smallest currency unit (e.g., paise for INR)
