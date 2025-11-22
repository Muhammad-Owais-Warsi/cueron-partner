# Bulk Engineer Upload API

## Endpoint

`POST /api/engineers/bulk-upload`

## Description

Handles bulk engineer creation from CSV file with validation, phone uniqueness check, and comprehensive error reporting.

## Requirements

- **Requirement 2.5**: WHEN bulk engineer data is uploaded THEN the System SHALL process the CSV file and create multiple engineer records

## Request

### Content-Type

`multipart/form-data`

### Form Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | CSV file containing engineer data |
| `agency_id` | string | Yes | UUID of the agency creating the engineers |

### CSV Format

The CSV file must include the following headers (case-insensitive):

**Required Headers:**
- `name` - Engineer's full name
- `phone` - 10-digit Indian phone number (starting with 6-9)
- `skill_level` - Skill level (1-5)
- `employment_type` - One of: `full_time`, `part_time`, `gig`, `apprentice`

**Optional Headers:**
- `email` - Email address
- `photo_url` - URL to profile photo
- `certifications` - Pipe-separated certifications in format: `type:level:cert_number:verified|type:level:cert_number:verified`
  - Example: `PMKVY:2:CERT123:true|ITI:3:CERT456:false`
- `specializations` - Pipe-separated specializations
  - Example: `Cold Storage|Industrial HVAC|Refrigeration`

### Example CSV

```csv
name,phone,email,skill_level,employment_type,certifications,specializations
Rajesh Kumar,9876543210,rajesh@example.com,3,full_time,PMKVY:2:CERT123:true,Cold Storage|Industrial HVAC
Priya Sharma,9876543211,priya@example.com,4,full_time,ITI:3:CERT456:true|NSDC:2:CERT789:true,Refrigeration
Amit Patel,9876543212,,2,part_time,Other:1:CERT999:false,Cold Storage
```

## Response

### Success Response (200 OK)

```json
{
  "success_count": 2,
  "error_count": 1,
  "errors": [
    {
      "row": 3,
      "field": "phone",
      "message": "Phone number 9876543210 already exists"
    }
  ]
}
```

### Error Responses

#### Missing File (400 Bad Request)

```json
{
  "error": {
    "code": "MISSING_FILE",
    "message": "No file provided",
    "details": {
      "file": ["CSV file is required"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Invalid File Type (400 Bad Request)

```json
{
  "error": {
    "code": "INVALID_FILE_TYPE",
    "message": "Invalid file type",
    "details": {
      "file": ["Only CSV files are accepted"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Missing Headers (400 Bad Request)

```json
{
  "error": {
    "code": "MISSING_HEADERS",
    "message": "CSV file is missing required headers",
    "details": {
      "headers": ["Missing headers: name, phone"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Internal Server Error (500)

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Validation Rules

### Engineer Data Validation

- **name**: Required, minimum 1 character
- **phone**: Required, must match pattern `^[6-9]\d{9}$` (10-digit Indian phone number)
- **email**: Optional, must be valid email format
- **skill_level**: Required, must be 1, 2, 3, 4, or 5
- **employment_type**: Required, must be one of: `full_time`, `part_time`, `gig`, `apprentice`
- **certifications**: Optional, array of certification objects
- **specializations**: Optional, array of strings

### Phone Uniqueness

The system checks for phone number uniqueness:
1. Against existing engineers in the database
2. Within the CSV file itself (prevents duplicate entries in the same upload)

### Default Values

When an engineer is created, the following defaults are set:
- `availability_status`: `available`
- `total_jobs_completed`: `0`
- `average_rating`: `0`
- `total_ratings`: `0`
- `success_rate`: `0`

## Error Handling

The endpoint processes all rows and reports errors for individual rows without stopping the entire upload. This allows partial success where valid rows are created even if some rows have errors.

### Error Types

1. **Validation Errors**: Invalid data format or missing required fields
2. **Uniqueness Errors**: Duplicate phone numbers
3. **Database Errors**: Issues inserting records into the database

## Example Usage

### Using cURL

```bash
curl -X POST http://localhost:3000/api/engineers/bulk-upload \
  -F "file=@engineers.csv" \
  -F "agency_id=550e8400-e29b-41d4-a716-446655440000"
```

### Using JavaScript Fetch

```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('agency_id', '550e8400-e29b-41d4-a716-446655440000');

const response = await fetch('/api/engineers/bulk-upload', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(`Created ${result.success_count} engineers`);
console.log(`Failed ${result.error_count} engineers`);
```

## Notes

- The endpoint uses the Supabase admin client to bypass Row Level Security for bulk operations
- All timestamps are automatically set by the database
- The endpoint is designed to handle large CSV files efficiently
- Errors are collected and returned in a structured format for easy debugging
