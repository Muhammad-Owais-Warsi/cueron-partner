# Job Assignment API

## Endpoint

`POST /api/jobs/{id}/assign`

## Description

Assigns an engineer to a job. This endpoint validates engineer availability, updates the job status to 'assigned', changes the engineer's availability status to 'on_job', and sends a push notification to the assigned engineer.

## Requirements

- **4.1**: Verify engineer availability status is 'available'
- **4.2**: Update job status to 'assigned' and record assignment timestamp
- **4.3**: Change engineer availability status to 'on_job'
- **4.4**: Send push notification to assigned engineer
- **4.5**: Prevent assignment to engineers already on a job

## Authentication

Requires valid JWT token in session. User must have 'admin' or 'manager' role.

## Authorization

- User must belong to the agency assigned to the job
- Engineer must belong to the same agency as the job

## Request

### Path Parameters

- `id` (string, required): UUID of the job to assign

### Body Parameters

```json
{
  "engineer_id": "uuid"
}
```

- `engineer_id` (string, required): UUID of the engineer to assign to the job

## Response

### Success Response (200 OK)

```json
{
  "job": {
    "id": "uuid",
    "job_number": "JOB-2025-1234",
    "status": "assigned",
    "assigned_engineer_id": "uuid",
    "assigned_at": "2025-01-15T10:30:00Z",
    ...
  },
  "engineer": {
    "id": "uuid",
    "name": "John Doe",
    "phone": "9876543210",
    "availability_status": "on_job"
  },
  "assignment": {
    "assigned_at": "2025-01-15T10:30:00Z",
    "assigned_by": "uuid"
  },
  "notification_sent": true
}
```

### Error Responses

#### 400 Bad Request - Invalid Input

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "engineer_id": ["Invalid engineer ID format"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

#### 401 Unauthorized

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

#### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to assign jobs",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Job not found",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

#### 409 Conflict - Engineer Not Available

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Engineer is not available for assignment. Current status: on_job",
    "details": {
      "engineer_id": ["Engineer availability status is 'on_job', must be 'available'"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

#### 409 Conflict - Job Already Assigned

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Job is already assigned to an engineer",
    "details": {
      "job": ["This job has already been assigned"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to assign engineer to job",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

## Business Logic

1. **Validate Request**: Ensure job ID and engineer ID are valid UUIDs
2. **Authenticate User**: Verify user has valid session
3. **Authorize User**: Check user has 'job:assign' permission (admin or manager role)
4. **Fetch Job**: Retrieve job details and verify user has access
5. **Check Job Status**: Ensure job is not already assigned
6. **Fetch Engineer**: Retrieve engineer details
7. **Verify Agency Match**: Ensure engineer belongs to the job's assigned agency
8. **Check Availability**: Verify engineer status is 'available' (Requirements 4.1, 4.5)
9. **Update Job**: Set status to 'assigned', record engineer ID and timestamp (Requirement 4.2)
10. **Update Engineer**: Change availability to 'on_job' (Requirement 4.3)
11. **Send Notification**: Push notification to engineer (Requirement 4.4)
12. **Return Response**: Include updated job, engineer info, and notification status

## Rollback Behavior

If the engineer status update fails after the job has been updated, the endpoint will automatically rollback the job assignment to maintain data consistency.

## Push Notifications

The current implementation includes a placeholder for push notifications. The actual Firebase Cloud Messaging (FCM) integration will be implemented in Phase 9 (Task 27). For now, notifications are logged to the console.

## Example Usage

```bash
curl -X POST https://api.cueron.com/api/jobs/123e4567-e89b-12d3-a456-426614174000/assign \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  -d '{
    "engineer_id": "987fcdeb-51a2-43f7-8765-123456789abc"
  }'
```

## Related Endpoints

- `GET /api/jobs/{id}` - Get job details
- `GET /api/agencies/{id}/jobs` - List jobs for an agency
- `PATCH /api/engineers/{id}` - Update engineer details
- `GET /api/engineers/{id}/performance` - Get engineer performance metrics

## Database Tables

- `jobs` - Job records with assignment information
- `engineers` - Engineer records with availability status
- `agency_users` - User roles and permissions

## Correctness Properties

This endpoint implements the following correctness properties from the design document:

- **Property 16**: Assignment availability validation - Only allows assignment to available engineers
- **Property 17**: Assignment status update - Updates job status to 'assigned' with timestamp
- **Property 18**: Engineer status on assignment - Changes engineer status to 'on_job'
- **Property 19**: Assignment notification - Sends push notification to assigned engineer
- **Property 20**: Prevent double assignment - Rejects assignment to engineers already on a job
