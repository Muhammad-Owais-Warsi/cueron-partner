# Agency Registration API

## Endpoint

`POST /api/agencies/register`

## Description

Handles new agency registration with comprehensive validation, GSTN uniqueness checking, bank detail encryption, and SMS notification.

## Requirements

- **1.1**: Creates agency record with `pending_approval` status
- **1.2**: Validates GSTN uniqueness across all agencies
- **1.3**: Stores NSDC code when provided
- **1.4**: Sends confirmation notification via SMS
- **1.5**: Encrypts bank account details before storage

## Request Body

```json
{
  "name": "Test ITI Center",
  "type": "ITI",
  "registration_number": "REG123456",
  "gstn": "29ABCDE1234F1Z5",
  "nsdc_code": "NSDC123",
  "contact_person": "John Doe",
  "phone": "9876543210",
  "email": "john@testiti.com",
  "primary_location": {
    "address": "123 Main St",
    "city": "Bangalore",
    "state": "Karnataka",
    "pincode": "560001",
    "lat": 12.9716,
    "lng": 77.5946
  },
  "service_areas": ["Bangalore", "Mysore"],
  "partnership_tier": "standard",
  "partnership_model": "job_placement",
  "engineer_capacity": 50,
  "bank_account_name": "Test ITI Center",
  "bank_account_number": "1234567890",
  "bank_ifsc": "SBIN0001234",
  "pan_number": "ABCDE1234F"
}
```

### Required Fields

- `name` (string, min 3 characters)
- `type` (enum: 'ITI' | 'Training' | 'Service' | 'Vendor')
- `registration_number` (string)
- `gstn` (string, format: 15 characters matching GSTN pattern)
- `contact_person` (string)
- `phone` (string, format: 10 digits starting with 6-9)
- `email` (string, valid email format)
- `primary_location` (object with address, city, state, lat, lng)
- `service_areas` (array of strings)
- `partnership_tier` (enum: 'standard' | 'premium' | 'enterprise')
- `partnership_model` (enum: 'job_placement' | 'dedicated_resource' | 'training_placement')
- `engineer_capacity` (number, integer >= 0)

### Optional Fields

- `nsdc_code` (string)
- `bank_account_name` (string)
- `bank_account_number` (string) - Will be encrypted before storage
- `bank_ifsc` (string, format: 11 characters matching IFSC pattern)
- `pan_number` (string, format: 10 characters matching PAN pattern) - Will be encrypted before storage

## Response

### Success Response (201 Created)

```json
{
  "agency_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending_approval",
  "message": "Agency registration submitted successfully. Awaiting approval."
}
```

### Error Responses

#### Validation Error (400 Bad Request)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "phone": ["Invalid phone number"],
      "gstn": ["Invalid GSTN format"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Duplicate GSTN (409 Conflict)

```json
{
  "error": {
    "code": "DUPLICATE_GSTN",
    "message": "An agency with this GSTN is already registered",
    "details": {
      "gstn": ["GSTN already exists"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Database Error (500 Internal Server Error)

```json
{
  "error": {
    "code": "DATABASE_ERROR",
    "message": "Failed to create agency record",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### Encryption Error (500 Internal Server Error)

```json
{
  "error": {
    "code": "ENCRYPTION_ERROR",
    "message": "Failed to encrypt sensitive data",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Security Features

1. **GSTN Uniqueness**: Validates that the GSTN is not already registered
2. **Data Encryption**: Bank account numbers and PAN numbers are encrypted using AES-256-CBC before storage
3. **Input Validation**: All inputs are validated using Zod schemas with strict format requirements
4. **Admin Client**: Uses Supabase admin client to bypass RLS for registration (since user is not yet authenticated)

## SMS Notification

Upon successful registration, an SMS notification is sent to the registered phone number. The SMS service integration will be completed in Task 3 (third-party service integrations).

Currently, the SMS sending is logged to the console:
```
[SMS] Registration confirmation sent to 9876543210 for agency agency-123
```

## Testing

Run tests with:
```bash
npx jest src/app/api/agencies/register/route.test.ts
```

Test coverage includes:
- Successful registration with pending_approval status
- GSTN uniqueness validation
- Required field validation
- GSTN format validation
- Phone number format validation
- Bank account encryption
- PAN number encryption
- NSDC code storage
- Database error handling
- Encryption error handling
- Optional field handling

## Implementation Notes

1. The endpoint uses the Supabase admin client to bypass Row Level Security (RLS) policies since the registering agency doesn't have an authenticated session yet.

2. Bank account numbers and PAN numbers are encrypted before storage using the `encrypt()` function from `@cueron/utils/encryption`.

3. The agency status is automatically set to `pending_approval` and requires manual approval before the agency can access the platform.

4. SMS notification sending is currently a placeholder and will be implemented when Twilio/MSG91 integration is set up in Task 3.

5. All validation errors return detailed field-level error messages to help users correct their input.
