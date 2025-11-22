# Job Completion API

## Endpoint

`POST /api/jobs/{id}/complete`

## Description

Completes a job with client signature capture, validates checklist completion, updates job and engineer status, and automatically creates a payment record.

## Requirements

- **8.1**: Require all mandatory checklist items to be completed
- **8.2**: Prompt for client signature capture
- **8.3**: Upload signature image to Supabase Storage
- **8.4**: Update job status to 'completed' and record completion timestamp
- **8.5**: Update engineer availability status to 'available'
- **11.2**: Create automatic payment record generation

## Authentication

Requires valid JWT token. User must have `job:write` permission (engineer, manager, or admin role).

## Authorization

- **Agency users** (admin/manager/viewer): Can only complete jobs assigned to their agency
- **Engineers**: Can only complete jobs assigned to them

## Request

### Path Parameters

- `id` (string, required): UUID of the job to complete

### Request Body

```json
{
  "signature_url": "https://storage.supabase.co/...",
  "checklist": [
    {
      "item": "Check refrigerant levels",
      "completed": true,
      "notes": "Levels normal"
    },
    {
      "item": "Inspect electrical connections",
      "completed": true
    }
  ],
  "parts_used": [
    {
      "name": "Refrigerant R-404A",
      "quantity": 2,
      "cost": 500.00
    }
  ],
  "engineer_notes": "All systems functioning normally. Recommended next service in 3 months."
}
```

### Field Descriptions

- `signature_url` (string, required): URL of the uploaded client signature image from Supabase Storage
- `checklist` (array, optional): Service checklist items with completion status
  - `item` (string): Description of the checklist item
  - `completed` (boolean): Whether the item is completed
  - `notes` (string, optional): Additional notes for the item
- `parts_used` (array, optional): List of parts used during service
  - `name` (string): Name of the part
  - `quantity` (number): Quantity used (must be positive)
  - `cost` (number): Cost per unit (must be non-negative)
- `engineer_notes` (string, optional): General notes from the engineer about the service

## Response

### Success Response (200 OK)

```json
{
  "job": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "job_number": "JOB-2025-1234",
    "status": "completed",
    "completed_at": "2025-01-15T14:30:00Z",
    "client_signature_url": "https://storage.supabase.co/...",
    "service_checklist": [...],
    "parts_used": [...],
    "engineer_notes": "...",
    ...
  },
  "payment": {
    "id": "789e4567-e89b-12d3-a456-426614174000",
    "job_id": "123e4567-e89b-12d3-a456-426614174000",
    "agency_id": "456e4567-e89b-12d3-a456-426614174000",
    "amount": 2500.00,
    "payment_type": "job_payment",
    "status": "pending",
    "created_at": "2025-01-15T14:30:00Z"
  },
  "metadata": {
    "completed_at": "2025-01-15T14:30:00Z",
    "completed_by": "engineer-user-id",
    "signature_uploaded": true,
    "checklist_validated": true,
    "engineer_availability_restored": true,
    "payment_created": true
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
    "timestamp": "2025-01-15T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 400 Bad Request - Validation Error

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "signature_url": ["Invalid signature URL format"],
      "parts_used.0.quantity": ["Expected number, received string"]
    },
    "timestamp": "2025-01-15T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 400 Bad Request - Incomplete Checklist

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cannot complete job: 2 checklist item(s) are incomplete",
    "details": {
      "checklist": ["Cannot complete job: 2 checklist item(s) are incomplete"]
    },
    "timestamp": "2025-01-15T14:30:00Z",
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
    "timestamp": "2025-01-15T14:30:00Z",
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
    "timestamp": "2025-01-15T14:30:00Z",
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
    "timestamp": "2025-01-15T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 409 Conflict - Already Completed

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Job is already completed",
    "timestamp": "2025-01-15T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 409 Conflict - Cancelled Job

```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Cannot complete a cancelled job",
    "timestamp": "2025-01-15T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to complete job",
    "timestamp": "2025-01-15T14:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Workflow

1. **Authentication & Authorization**: Verify user session and permissions
2. **Validation**: Validate request body and job ID format
3. **Job Retrieval**: Fetch current job details
4. **Access Control**: Verify user has access to the job
5. **Status Check**: Ensure job is not already completed or cancelled
6. **Checklist Validation**: Verify all mandatory checklist items are completed (Requirement 8.1)
7. **Signature Upload**: Validate signature URL (Requirement 8.3)
8. **Job Update**: Update job status to 'completed' with timestamp (Requirement 8.4)
9. **Engineer Update**: Restore engineer availability to 'available' (Requirement 8.5)
10. **Payment Creation**: Create automatic payment record if service fee exists (Requirement 11.2)
11. **History Recording**: Record status change in job_status_history
12. **Real-time Broadcast**: Notify subscribers of job completion
13. **Location Tracking**: Stop location tracking for the engineer

## Side Effects

- Job status changes to 'completed'
- Job `completed_at` timestamp is set
- Job `client_signature_url` is set
- Job `service_checklist`, `parts_used`, and `engineer_notes` are updated (if provided)
- Engineer `availability_status` changes to 'available'
- Payment record is created with 'pending' status (if service fee exists)
- Status history entry is created
- Real-time broadcast is sent to job channel
- Location tracking stop signal is sent to engineer channel

## Notes

- All checklist items must be marked as completed before job can be completed
- Signature URL must be a valid Supabase Storage URL
- Payment record is only created if the job has a service_fee > 0
- If engineer update or payment creation fails, the job completion still succeeds (errors are logged)
- Real-time notifications are sent to both job and engineer channels
- Location tracking is automatically stopped for the engineer

## Example Usage

```bash
curl -X POST https://api.cueron.com/api/jobs/123e4567-e89b-12d3-a456-426614174000/complete \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "signature_url": "https://storage.supabase.co/signatures/sig_123.png",
    "checklist": [
      {
        "item": "Check refrigerant levels",
        "completed": true,
        "notes": "Levels normal"
      },
      {
        "item": "Inspect electrical connections",
        "completed": true
      }
    ],
    "parts_used": [
      {
        "name": "Refrigerant R-404A",
        "quantity": 2,
        "cost": 500.00
      }
    ],
    "engineer_notes": "All systems functioning normally."
  }'
```

## Related Endpoints

- `GET /api/jobs/{id}` - Get job details
- `PATCH /api/jobs/{id}/status` - Update job status
- `POST /api/jobs/{id}/assign` - Assign engineer to job
- `GET /api/agencies/{id}/payments` - List agency payments
