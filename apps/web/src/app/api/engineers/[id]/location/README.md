# Engineer Location Update API

## Endpoint

`PATCH /api/engineers/[id]/location`

## Description

Updates an engineer's current location with PostGIS POINT storage and records the timestamp of the update. This endpoint is designed to be called periodically (every 30 seconds) by the mobile application when an engineer is on a job.

## Requirements

- **9.1**: Periodic location updates (30-second intervals)
- **9.2**: PostGIS POINT storage
- **9.4**: Location timestamp recording
- **9.5**: Location persistence on status changes

## Authentication

Requires a valid Supabase Auth session. The authenticated user must be the engineer whose location is being updated.

## Request

### Path Parameters

- `id` (string, required): The UUID of the engineer

### Body Parameters

```json
{
  "latitude": number,  // -90 to 90
  "longitude": number  // -180 to 180
}
```

### Example Request

```bash
curl -X PATCH https://api.cueron.com/api/engineers/123e4567-e89b-12d3-a456-426614174000/location \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": 28.6139,
    "longitude": 77.2090
  }'
```

## Response

### Success Response (200 OK)

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "current_location": "0101000020E6100000...",
    "last_location_update": "2025-01-15T10:30:00.000Z",
    "availability_status": "on_job"
  }
}
```

### Error Responses

#### 400 Bad Request - Invalid Location Data

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid location data",
    "details": {
      "latitude": ["Number must be greater than or equal to -90"],
      "longitude": ["Required"]
    },
    "timestamp": "2025-01-15T10:30:00.000Z",
    "request_id": "req_abc123"
  }
}
```

#### 401 Unauthorized - Missing or Invalid Authentication

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden - Not Authorized to Update This Engineer

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to update this engineer location",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "request_id": "req_abc123"
  }
}
```

#### 404 Not Found - Engineer Not Found

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Engineer not found",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "request_id": "req_abc123"
  }
}
```

#### 500 Internal Server Error

```json
{
  "error": {
    "code": "UPDATE_FAILED",
    "message": "Failed to update location",
    "timestamp": "2025-01-15T10:30:00.000Z",
    "request_id": "req_abc123"
  }
}
```

## Implementation Notes

### PostGIS POINT Format

The location is stored in PostGIS POINT format using the GEOGRAPHY type with SRID 4326 (WGS 84). Note that PostGIS uses (longitude, latitude) order, not (latitude, longitude).

```sql
-- Database storage format
current_location: GEOGRAPHY(POINT, 4326)

-- Example value
POINT(77.2090 28.6139)  -- longitude first, then latitude
```

### Periodic Updates

The mobile application should call this endpoint approximately every 30 seconds when:
- Engineer status is 'travelling' or 'on_job'
- The app is in the foreground or background location tracking is enabled

### Location Persistence

When an engineer's availability status changes (e.g., from 'on_job' to 'available'), the last known location is retained in the database. This allows agencies to see where engineers were last active.

### Offline Handling

If the mobile app is offline, location updates should be queued locally and sent when connectivity is restored. The `last_location_update` timestamp will reflect when the location was actually recorded, not when it was sent to the server.

## Security

- Row Level Security (RLS) policies ensure engineers can only update their own location
- Location data is not encrypted as it's operational data needed for real-time tracking
- Historical location data is retained for operational purposes but not exposed in public APIs

## Performance Considerations

- The endpoint is optimized for high-frequency updates (every 30 seconds)
- A GIST index on `current_location` enables efficient spatial queries
- The `last_location_update` timestamp is indexed for time-based queries

## Related Endpoints

- `GET /api/agencies/[id]/engineers` - View team locations on map
- `PATCH /api/engineers/[id]` - Update other engineer details
- `GET /api/jobs/[id]` - View job location and engineer location together
