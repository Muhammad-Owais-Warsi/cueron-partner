# Service Checklist Management API

## Overview

This API endpoint manages service checklists for jobs, providing functionality for displaying checklist items, tracking completion status, persisting updates, and validating completion requirements.

## Requirements

- **7.1**: Display all required verification items in the service checklist
- **7.2**: Store checklist completion status in the job record
- **7.5**: Enable job completion action when all checklist items are complete
- **8.1**: Validate all mandatory checklist items are completed before allowing job completion

## Endpoints

### GET /api/jobs/{id}/checklist

Retrieve the service checklist for a job with completion statistics.

**Authentication**: Required (JWT token)

**Authorization**: 
- Engineers can view checklists for jobs assigned to them
- Agency users (admin, manager, viewer) can view checklists for jobs assigned to their agency

**Response**:
```json
{
  "job_id": "uuid",
  "status": "onsite",
  "checklist": [
    {
      "item": "Check refrigerant levels",
      "completed": true,
      "notes": "Levels normal"
    },
    {
      "item": "Inspect compressor",
      "completed": false
    }
  ],
  "stats": {
    "total_items": 5,
    "completed_items": 3,
    "pending_items": 2,
    "completion_percentage": 60,
    "all_completed": false
  },
  "completion_enabled": false,
  "can_complete_job": false
}
```

### PATCH /api/jobs/{id}/checklist

Update the service checklist items for a job.

**Authentication**: Required (JWT token)

**Authorization**: Only engineers assigned to the job can update the checklist

**Request Body**:
```json
{
  "checklist": [
    {
      "item": "Check refrigerant levels",
      "completed": true,
      "notes": "Levels normal"
    },
    {
      "item": "Inspect compressor",
      "completed": true,
      "notes": "No issues found"
    }
  ]
}
```

**Validation Rules**:
- Checklist must be an array
- Each item must have:
  - `item` (string, non-empty): Description of the checklist item
  - `completed` (boolean): Completion status
  - `notes` (string, optional): Additional notes
- Job status must be "onsite" to update checklist

**Response**:
```json
{
  "job_id": "uuid",
  "status": "onsite",
  "checklist": [...],
  "stats": {
    "total_items": 5,
    "completed_items": 5,
    "pending_items": 0,
    "completion_percentage": 100,
    "all_completed": true
  },
  "completion_enabled": true,
  "can_complete_job": true,
  "message": "All checklist items completed. Job completion is now enabled."
}
```

## Business Logic

### Checklist Display (Requirement 7.1)

The GET endpoint returns all checklist items with their completion status, allowing the mobile application to display the complete list of verification items.

### Completion Tracking (Requirement 7.2)

The PATCH endpoint persists checklist updates to the `service_checklist` JSONB column in the jobs table. Each update includes:
- Item description
- Completion status (boolean)
- Optional notes

### Completion Enablement (Requirement 7.5)

Job completion is enabled when:
1. Job status is "onsite"
2. All checklist items have `completed: true`

The API returns `completion_enabled` and `can_complete_job` flags to inform the UI.

### Completion Validation (Requirement 8.1)

Before allowing job completion (in the job completion endpoint), the system validates that all mandatory checklist items are completed. The `areAllMandatoryItemsCompleted()` function enforces this requirement.

## Error Handling

### Common Errors

- **400 Bad Request**: Invalid checklist format or job not in "onsite" status
- **401 Unauthorized**: Missing or invalid authentication token
- **403 Forbidden**: User doesn't have permission to access/update the checklist
- **404 Not Found**: Job not found
- **500 Internal Server Error**: Database or unexpected errors

### Error Response Format

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid checklist format",
    "details": {
      "checklist": ["Item at index 0 must have a 'completed' boolean"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Security

### Data Isolation

- Engineers can only access checklists for jobs assigned to them
- Agency users can only access checklists for jobs assigned to their agency
- Row Level Security (RLS) policies enforce data isolation at the database level

### Input Validation

- Checklist structure is validated before persistence
- Job status is verified before allowing updates
- Engineer assignment is verified before allowing updates

## Usage Examples

### Mobile App: Display Checklist

```typescript
// Fetch checklist when engineer opens job details
const response = await fetch(`/api/jobs/${jobId}/checklist`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { checklist, stats, completion_enabled } = await response.json();

// Display checklist items with completion status
checklist.forEach(item => {
  renderChecklistItem(item);
});

// Enable/disable completion button based on completion_enabled
setCompletionButtonEnabled(completion_enabled);
```

### Mobile App: Update Checklist Item

```typescript
// When engineer marks an item as complete
const updatedChecklist = checklist.map(item => 
  item.item === selectedItem.item 
    ? { ...item, completed: true, notes: engineerNotes }
    : item
);

const response = await fetch(`/api/jobs/${jobId}/checklist`, {
  method: 'PATCH',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ checklist: updatedChecklist })
});

const { stats, completion_enabled, message } = await response.json();

// Update UI with new stats and completion status
updateChecklistStats(stats);
setCompletionButtonEnabled(completion_enabled);
showMessage(message);
```

## Database Schema

The checklist is stored in the `service_checklist` JSONB column of the `jobs` table:

```sql
CREATE TABLE jobs (
  ...
  service_checklist JSONB,
  ...
);
```

Example stored value:
```json
[
  {
    "item": "Check refrigerant levels",
    "completed": true,
    "notes": "Levels normal"
  },
  {
    "item": "Inspect compressor",
    "completed": true
  }
]
```

## Testing

### Unit Tests

Test coverage includes:
- Checklist validation logic
- Completion status calculation
- Permission verification
- Error handling

### Property-Based Tests

The following properties should be tested:
- **Property 30**: Checklist display completeness
- **Property 31**: Checklist completion persistence
- **Property 34**: Completion enablement
- **Property 35**: Completion checklist validation

## Related Endpoints

- `POST /api/jobs/{id}/complete` - Complete job (requires checklist validation)
- `PATCH /api/jobs/{id}/status` - Update job status (enables checklist when status is "onsite")
- `GET /api/jobs/{id}` - Get job details (includes checklist in response)
