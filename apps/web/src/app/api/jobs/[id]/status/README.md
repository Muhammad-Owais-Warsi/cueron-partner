# Job Status Management API

## Endpoint

`PATCH /api/jobs/{id}/status`

## Description

Updates the status of a job with comprehensive history tracking, location recording, and real-time broadcasting. This endpoint implements status transition validation to ensure jobs follow the correct workflow.

## Requirements

- **6.1**: Record status change with timestamp and engineer location
- **6.3**: Record arrival time when status changes to 'onsite' (started_at)
- **6.4**: Broadcast status changes via Supabase Realtime

## Authentication

Requires valid JWT token in Authorization header or session cookie.

## Authorization

- **Agency Users** (admin, manager): Can update status for jobs assigned to their agency
- **Engineers**: Can update status for jobs assigned to them
- **Viewers**: Read-only access (cannot update status)

## Request

### Path Parameters

- `id` (string, required): Job UUID

### Body Parameters

```json
{
  "status": "travelling",
  "location": {
    "lat": 28.6139,
    "lng": 77.2090
  },
  "notes": "On the way to client location"
}
```

- `status` (string, required): New job status. Must be one of:
  - `pending`
  - `assigned`
  - `accepted`
  - `travelling`
  - `onsite`
  - `completed`
  - `cancelled`
- `location` (object, optional): Current location coordinates
  - `lat` (number): Latitude (-90 to 90)
  - `lng` (number): Longitude (-180 to 180)
- `notes` (string, optional): Additional notes about the status change

## Status Transitions

Valid status transitions follow this workflow:

```
pending → assigned → accepted → travelling → onsite → completed
    ↓         ↓          ↓           ↓          ↓
cancelled  cancelled  cancelled  cancelled  cancelled
```

### Transition Rules

- **pending**: Can transition to `assigned` or `cancelled`
- **assigned**: Can transition to `accepted` or `cancelled`
- **accepted**: Can transition to `travelling` or `cancelled`
- **travelling**: Can transition to `onsite` or `cancelled`
- **onsite**: Can transition to `completed` or `cancelled`
- **completed**: Terminal state (no further transitions)
- **cancelled**: Terminal state (no further transitions)

## Timestamp Recording

The following status changes automatically record timestamps:

- `assigned` → Sets `assigned_at`
- `accepted` → Sets `accepted_at`
- `onsite` → Sets `started_at` (Requirement 6.3)
- `completed` → Sets `completed_at`

## Response

### Success Response (200 OK)

```json
{
  "job": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "job_number": "JOB-2025-1234",
    "status": "travelling",
    "started_at": null,
    "assigned_at": "2025-01-15T10:00:00Z",
    "accepted_at": "2025-01-15T10:05:00Z",
    "updated_at": "2025-01-15T10:15:00Z",
    ...
  },
  "status_history": [
    {
      "id": "hist-001",
      "job_id": "123e4567-e89b-12d3-a456-426614174000",
      "status": "travelling",
      "changed_by": "engineer-uuid",
      "location": {
        "type": "Point",
        "coordinates": [77.2090, 28.6139]
      },
      "notes": "On the way to client location",
      "created_at": "2025-01-15T10:15:00Z"
    },
    ...
  ],
  "metadata": {
    "previous_status": "accepted",
    "new_status": "travelling",
    "transition_valid": true,
    "timestamp_recorded": null,
    "location_recorded": true,
    "realtime_broadcast_sent": true
  }
}
```

### Error Responses

#### 400 Bad Request - Missing Status

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field",
    "details": {
      "status": ["Status is required"]
    },
    "timestamp": "2025-01-15T10:15:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 400 Bad Request - Invalid Status

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid status value",
    "details": {
      "status": ["Status must be one of: pending, assigned, accepted, travelling, onsite, completed, cancelled"]
    },
    "timestamp": "2025-01-15T10:15:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 400 Bad Request - Invalid Transition

```json
{
  "error": {
    "code": "INVALID_TRANSITION",
    "message": "Invalid status transition from 'completed' to 'travelling'. Allowed transitions: ",
    "timestamp": "2025-01-15T10:15:00Z",
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
    "timestamp": "2025-01-15T10:15:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have access to this job",
    "timestamp": "2025-01-15T10:15:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 404 Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Job not found",
    "timestamp": "2025-01-15T10:15:00Z",
    "request_id": "req_abc123"
  }
}
```

## Real-time Updates

When a job status is updated, the following real-time events are broadcast:

### Channel: `job:{jobId}`

```javascript
{
  type: 'broadcast',
  event: 'status_update',
  payload: {
    job_id: '123e4567-e89b-12d3-a456-426614174000',
    status: 'travelling',
    timestamp: '2025-01-15T10:15:00Z',
    location: { lat: 28.6139, lng: 77.2090 },
    changed_by: 'engineer-uuid'
  }
}
```

### Subscribing to Updates (Client-side)

```typescript
const supabase = createClient();

const channel = supabase
  .channel(`job:${jobId}`)
  .on('broadcast', { event: 'status_update' }, (payload) => {
    console.log('Job status updated:', payload);
    // Update UI with new status
  })
  .subscribe();
```

## Status History

All status changes are recorded in the `job_status_history` table with:

- Job ID
- New status
- User who made the change
- Location coordinates (if provided)
- Optional notes
- Timestamp

This provides a complete audit trail of all job status changes.

## Example Usage

### Update Status to Travelling

```bash
curl -X PATCH https://api.cueron.com/api/jobs/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "travelling",
    "location": {
      "lat": 28.6139,
      "lng": 77.2090
    },
    "notes": "On the way to client location"
  }'
```

### Update Status to Onsite

```bash
curl -X PATCH https://api.cueron.com/api/jobs/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "onsite",
    "location": {
      "lat": 28.6150,
      "lng": 77.2100
    },
    "notes": "Arrived at client location"
  }'
```

### Update Status to Completed

```bash
curl -X PATCH https://api.cueron.com/api/jobs/123e4567-e89b-12d3-a456-426614174000/status \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed",
    "notes": "Service completed successfully"
  }'
```

## Implementation Notes

1. **Status Validation**: The endpoint validates that status transitions follow the defined workflow
2. **Timestamp Recording**: Specific status changes automatically set corresponding timestamp fields
3. **Location Tracking**: Location coordinates are stored in PostGIS POINT format in the status history
4. **Real-time Broadcasting**: Status changes are broadcast to subscribed clients via Supabase Realtime
5. **Audit Trail**: Complete history of status changes is maintained for compliance and debugging
6. **Error Handling**: Comprehensive error responses with specific error codes and messages

## Related Endpoints

- `GET /api/jobs/{id}` - Get job details
- `POST /api/jobs/{id}/assign` - Assign engineer to job
- `POST /api/jobs/{id}/complete` - Complete job with checklist and photos
