# Job Detail and Distance Calculation API

## Endpoint

`GET /api/jobs/{id}`

## Description

Retrieves detailed information about a specific job, including complete job details, skill requirement highlighting, and calculated distances from available engineers to the job site.

## Requirements

- **3.2**: Display complete job details (client information, location, equipment type, required skill level)
- **3.4**: Highlight skill requirement in job details
- **3.5**: Calculate and show distance from available engineers

## Authentication

Requires valid JWT token in session. User must have `job:read` permission.

## Authorization

- **Agency users** (admin/manager/viewer): Can only access jobs assigned to their agency
- **Engineers**: Can only access jobs assigned to them

## Request

### Path Parameters

- `id` (required): UUID of the job

### Headers

- `Cookie`: Session cookie with JWT token

## Response

### Success Response (200 OK)

```json
{
  "job": {
    "id": "uuid",
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
      "city": "Mumbai",
      "state": "Maharashtra",
      "lat": 19.0760,
      "lng": 72.8777
    },
    "assigned_agency_id": "uuid",
    "assigned_engineer_id": "uuid",
    "required_skill_level": 3,
    "scheduled_time": "2025-01-20T10:00:00Z",
    "urgency": "normal",
    "status": "assigned",
    "skill_requirement_highlighted": true,
    "skill_requirement": {
      "level": 3,
      "description": "Intermediate - 3-5 years experience"
    },
    ...
  },
  "completeness": {
    "is_complete": true,
    "missing_fields": []
  },
  "engineer_distances": [
    {
      "engineer_id": "uuid",
      "distance_km": 5.2,
      "duration_minutes": 15
    },
    {
      "engineer_id": "uuid",
      "distance_km": 8.7,
      "duration_minutes": 22
    }
  ],
  "metadata": {
    "distance_calculation_method": "google_maps_distance_matrix",
    "available_engineers_count": 2
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid ID Format
```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid job ID format",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 401 Unauthorized - Not Authenticated
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

#### 403 Forbidden - No Access
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this job",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 404 Not Found - Job Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Job not found",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 500 Internal Server Error
```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to fetch job details",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Features

### Job Detail Completeness Validation

The API validates that all required fields are present:
- `client_name`
- `site_location` (with valid coordinates)
- `equipment_type`
- `required_skill_level`

If any fields are missing, they are reported in the `completeness.missing_fields` array.

### Skill Requirement Highlighting

The response includes a `skill_requirement` object with:
- `level`: Numeric skill level (1-5)
- `description`: Human-readable description of the skill level

This enables the UI to prominently display the skill requirements.

### Distance Calculation

The API calculates distances from available engineers to the job site using:

1. **Google Maps Distance Matrix API** (preferred):
   - Provides accurate road distances
   - Includes estimated travel duration
   - Requires `GOOGLE_MAPS_API_KEY` environment variable

2. **Haversine Formula** (fallback):
   - Calculates straight-line distance
   - Used when Google Maps API is unavailable or fails
   - No travel duration provided

Engineers are sorted by distance (closest first).

### Data Isolation

The API enforces strict data isolation:
- Agency users can only view jobs assigned to their agency
- Engineers can only view jobs assigned to them
- Attempts to access unauthorized jobs return 403 Forbidden

## Environment Variables

- `GOOGLE_MAPS_API_KEY` (optional): Google Maps API key for distance calculations. If not provided, falls back to Haversine distance calculation.

## Implementation Notes

### Distance Calculation Method

The `metadata.distance_calculation_method` field indicates which method was used:
- `google_maps_distance_matrix`: Google Maps API was used
- `haversine_formula`: Fallback calculation was used

### Engineer Filtering

Only engineers with:
- `availability_status = 'available'`
- Valid `current_location` coordinates
- Belonging to the job's assigned agency

are included in distance calculations.

### Performance Considerations

- Distance calculations are performed asynchronously
- Google Maps API calls are batched (up to 25 origins per request)
- Results are sorted by distance for optimal engineer selection

## Related Endpoints

- `GET /api/agencies/{id}/jobs` - List and filter jobs for an agency
- `POST /api/jobs/{id}/assign` - Assign an engineer to a job
- `PATCH /api/jobs/{id}/status` - Update job status

## Correctness Properties

### Property 12: Job detail completeness
*For any* job detail view, the rendered output should contain client information, location, equipment type, and required skill level.

### Property 14: Skill requirement highlighting
*For any* job with a required_skill_level value, the job detail rendering should include highlighting of the skill requirement.

### Property 15: Distance calculation accuracy
*For any* job location and engineer location, the calculated distance should match the actual geographic distance within acceptable tolerance.
