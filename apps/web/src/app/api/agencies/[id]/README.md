# Agency Profile Management API

This API provides endpoints for retrieving and updating agency profile information.

## Endpoints

### GET /api/agencies/{id}

Retrieve detailed information about a specific agency.

**Authentication:** Required  
**Authorization:** User must have `agency:read` permission and can only access their own agency data

**Path Parameters:**
- `id` (string, UUID): The agency ID

**Response (200 OK):**
```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "name": "ABC Training Institute",
  "type": "ITI",
  "registration_number": "REG123456",
  "gstn": "29ABCDE1234F1Z5",
  "nsdc_code": "NSDC123",
  "contact_person": "John Doe",
  "phone": "9876543210",
  "email": "contact@abc.com",
  "primary_location": {
    "address": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001",
    "lat": 19.0760,
    "lng": 72.8777
  },
  "service_areas": ["Mumbai", "Pune", "Thane"],
  "partnership_tier": "premium",
  "partnership_model": "job_placement",
  "engineer_capacity": 50,
  "bank_account_name": "ABC Training Institute",
  "bank_account_number": "1234567890",
  "bank_ifsc": "HDFC0001234",
  "pan_number": "ABCDE1234F",
  "status": "active",
  "onboarded_at": "2025-01-01T00:00:00Z",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-15T10:30:00Z"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid agency ID format
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions or data isolation violation
- `404 Not Found`: Agency not found
- `500 Internal Server Error`: Database or server error

**Notes:**
- Sensitive bank details (bank_account_number, pan_number) are automatically decrypted before being returned
- If decryption fails, these fields will be omitted from the response
- Row Level Security (RLS) policies ensure users can only access their own agency data

---

### PATCH /api/agencies/{id}

Update agency profile information.

**Authentication:** Required  
**Authorization:** User must have `agency:write` permission and can only update their own agency data

**Path Parameters:**
- `id` (string, UUID): The agency ID

**Request Body:**
All fields are optional. Only include fields you want to update.

```json
{
  "name": "Updated Agency Name",
  "contact_person": "Jane Smith",
  "phone": "9876543210",
  "email": "newemail@agency.com",
  "primary_location": {
    "address": "456 New St",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "lat": 18.5204,
    "lng": 73.8567
  },
  "service_areas": ["Mumbai", "Pune", "Bangalore"],
  "bank_account_name": "Updated Bank Name",
  "bank_account_number": "9876543210",
  "bank_ifsc": "ICIC0001234",
  "pan_number": "XYZAB5678C"
}
```

**Validation Rules:**
- `name`: Minimum 3 characters
- `phone`: Must be a valid 10-digit Indian phone number (starting with 6-9)
- `email`: Must be a valid email address
- `primary_location.pincode`: Must be a valid 6-digit Indian pincode
- `bank_ifsc`: Must match IFSC code format (e.g., HDFC0001234)
- `pan_number`: Must match PAN format (e.g., ABCDE1234F)

**Response (200 OK):**
```json
{
  "agency": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "name": "Updated Agency Name",
    "contact_person": "Jane Smith",
    "phone": "9876543210",
    "email": "newemail@agency.com",
    "updated_at": "2025-01-15T10:30:00Z",
    ...
  },
  "message": "Agency profile updated successfully"
}
```

**Error Responses:**
- `400 Bad Request`: Invalid agency ID format or validation errors
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions or data isolation violation
- `404 Not Found`: Agency not found
- `500 Internal Server Error`: Database, encryption, or server error

**Notes:**
- Sensitive bank details are automatically encrypted before storage
- The `updated_at` timestamp is automatically set to the current time
- Only admin and manager roles have write permissions
- Viewers and engineers cannot update agency profiles

---

## Security Features

### Data Encryption
- Bank account numbers and PAN numbers are encrypted using AES-256-CBC before storage
- Encrypted data is automatically decrypted when retrieved
- Decryption errors are handled gracefully without exposing sensitive information

### Authorization
- Role-based access control (RBAC) enforces permission checks
- Data isolation ensures agencies can only access their own data
- Row Level Security (RLS) policies provide database-level protection

### Validation
- All input data is validated using Zod schemas
- Field-specific error messages help identify validation issues
- Phone numbers, emails, IFSC codes, and PAN numbers are validated against Indian formats

---

## Usage Examples

### Retrieve Agency Profile

```typescript
const response = await fetch('/api/agencies/123e4567-e89b-12d3-a456-426614174000', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include', // Include cookies for authentication
});

const agency = await response.json();
console.log(agency.name);
```

### Update Agency Contact Information

```typescript
const response = await fetch('/api/agencies/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    contact_person: 'New Contact Person',
    phone: '9876543210',
    email: 'newcontact@agency.com',
  }),
});

const result = await response.json();
console.log(result.message);
```

### Update Service Areas

```typescript
const response = await fetch('/api/agencies/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    service_areas: ['Mumbai', 'Pune', 'Bangalore', 'Hyderabad'],
  }),
});

const result = await response.json();
console.log(result.agency.service_areas);
```

### Update Bank Details (Encrypted)

```typescript
const response = await fetch('/api/agencies/123e4567-e89b-12d3-a456-426614174000', {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
  },
  credentials: 'include',
  body: JSON.stringify({
    bank_account_name: 'My Agency Pvt Ltd',
    bank_account_number: '1234567890',
    bank_ifsc: 'HDFC0001234',
    pan_number: 'ABCDE1234F',
  }),
});

const result = await response.json();
// Bank details are encrypted in database but returned decrypted
console.log(result.agency.bank_account_number); // "1234567890"
```

---

## Related Requirements

This API implements the following requirements from the specification:

- **Requirement 1.1**: Agency profile management and data storage
- **Requirement 1.2**: GSTN validation and uniqueness (enforced at registration)
- **Requirement 1.3**: NSDC code storage and retrieval

---

## Testing

Comprehensive unit tests are available in `route.test.ts` covering:

- Authentication and authorization checks
- Input validation
- Data encryption/decryption
- Service area management
- Error handling
- Data isolation enforcement

Run tests with:
```bash
npm test -- --testPathPattern="agencies"
```
