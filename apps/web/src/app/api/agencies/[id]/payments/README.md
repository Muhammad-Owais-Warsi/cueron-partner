# Agency Payments API

## Overview

This API provides payment management functionality for agencies, including listing payments, updating payment status, and creating Razorpay payment orders.

## Endpoints

### GET /api/agencies/{id}/payments

List all payments for an agency with filtering and pagination.

**Authentication:** Required (JWT)

**Authorization:** 
- User must have `agency:read` permission
- User can only access payments for their own agency (data isolation)

**Query Parameters:**
- `status` (optional): Comma-separated payment statuses (e.g., "pending,processing")
  - Valid values: `pending`, `processing`, `completed`, `failed`, `refunded`
- `date_from` (optional): ISO 8601 date string for start of date range
- `date_to` (optional): ISO 8601 date string for end of date range
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "payments": [
    {
      "id": "uuid",
      "agency_id": "uuid",
      "job_id": "uuid",
      "amount": 5000.00,
      "payment_type": "job_payment",
      "status": "completed",
      "payment_method": "razorpay",
      "payment_gateway_id": "order_xyz123",
      "invoice_number": "INV-2025-001",
      "invoice_url": "https://...",
      "paid_at": "2025-01-15T10:30:00Z",
      "created_at": "2025-01-15T09:00:00Z",
      "updated_at": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3,
    "has_next": true,
    "has_prev": false
  },
  "filters_applied": {
    "status": ["pending", "processing"],
    "date_from": "2025-01-01T00:00:00Z",
    "date_to": "2025-01-31T23:59:59Z"
  }
}
```

**Correctness Properties:**
- **Property 48: Payment list isolation** - All returned payments belong only to the requesting agency

---

### PATCH /api/agencies/{id}/payments

Update payment status and record timestamps.

**Authentication:** Required (JWT)

**Authorization:** 
- User must have `payment:update` permission
- User can only update payments for their own agency

**Request Body:**
```json
{
  "payment_id": "uuid",
  "status": "completed",
  "payment_gateway_id": "pay_xyz123",
  "invoice_number": "INV-2025-001",
  "invoice_url": "https://storage.example.com/invoices/INV-2025-001.pdf"
}
```

**Fields:**
- `payment_id` (required): UUID of the payment to update
- `status` (optional): New payment status
  - Valid values: `pending`, `processing`, `completed`, `failed`, `refunded`
- `payment_gateway_id` (optional): Payment gateway transaction ID
- `invoice_number` (optional): Invoice number
- `invoice_url` (optional): URL to invoice document

**Response:**
```json
{
  "payment": {
    "id": "uuid",
    "agency_id": "uuid",
    "status": "completed",
    "paid_at": "2025-01-15T10:30:00Z",
    "updated_at": "2025-01-15T10:30:00Z",
    ...
  },
  "message": "Payment updated successfully"
}
```

**Behavior:**
- When status changes to `completed`, the `paid_at` timestamp is automatically set
- The `updated_at` timestamp is always updated

**Correctness Properties:**
- **Property 50: Payment processing update** - When payment is processed, status is updated and paid_at timestamp is recorded

---

### POST /api/agencies/{id}/payments

Create a Razorpay payment order for processing.

**Authentication:** Required (JWT)

**Authorization:** 
- User must have `payment:create` permission
- User can only create payment orders for their own agency

**Request Body:**
```json
{
  "payment_id": "uuid",
  "amount": 5000.00
}
```

**Fields:**
- `payment_id` (required): UUID of the existing payment record
- `amount` (required): Payment amount in INR (must be positive)

**Response:**
```json
{
  "order_id": "order_xyz123",
  "amount": 5000.00,
  "currency": "INR",
  "key_id": "rzp_test_...",
  "payment": {
    "id": "uuid",
    "status": "processing",
    "payment_gateway_id": "order_xyz123",
    "payment_method": "razorpay",
    ...
  },
  "message": "Payment order created successfully"
}
```

**Behavior:**
- Creates a Razorpay order for the specified payment
- Updates payment status to `processing`
- Records the Razorpay order ID in `payment_gateway_id`
- Returns order details for client-side Razorpay checkout integration

**Requirements:**
- Environment variables must be configured:
  - `RAZORPAY_KEY_ID`: Razorpay API key ID
  - `RAZORPAY_KEY_SECRET`: Razorpay API key secret

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {
      "field_name": ["Error description"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "uuid"
  }
}
```

**Common Error Codes:**
- `INVALID_ID`: Invalid agency or payment ID format
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions or data isolation violation
- `VALIDATION_ERROR`: Invalid request data
- `NOT_FOUND`: Payment not found
- `INVALID_STATE`: Payment in invalid state for operation
- `CONFIGURATION_ERROR`: Payment gateway not configured
- `DATABASE_ERROR`: Database operation failed
- `INTERNAL_ERROR`: Unexpected server error

---

## Requirements Validation

### Requirement 11.1
**When an agency views payments THEN the Web Application SHALL display all payment records associated with the agency**

✅ Implemented in GET endpoint with agency_id filtering and data isolation checks

### Requirement 11.3
**When payment is processed THEN the System SHALL update payment status and record the payment timestamp**

✅ Implemented in PATCH endpoint with automatic paid_at timestamp recording when status changes to 'completed'

---

## Razorpay Integration

### Setup

1. Sign up for Razorpay account at https://razorpay.com
2. Get API credentials from Dashboard > Settings > API Keys
3. Set environment variables:
   ```
   RAZORPAY_KEY_ID=rzp_test_...
   RAZORPAY_KEY_SECRET=...
   ```

### Client-Side Integration

After creating a payment order using POST endpoint:

```javascript
const options = {
  key: response.key_id,
  amount: response.amount * 100, // Amount in paise
  currency: response.currency,
  order_id: response.order_id,
  name: 'Cueron',
  description: 'Service Payment',
  handler: function(razorpayResponse) {
    // Payment successful
    // Update payment status using PATCH endpoint
    updatePaymentStatus(paymentId, {
      status: 'completed',
      payment_gateway_id: razorpayResponse.razorpay_payment_id
    });
  },
  prefill: {
    name: agencyName,
    email: agencyEmail,
    contact: agencyPhone
  }
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### Webhook Handling

For production, implement a webhook endpoint to handle Razorpay payment events:
- `payment.captured`: Update payment status to 'completed'
- `payment.failed`: Update payment status to 'failed'
- `refund.created`: Update payment status to 'refunded'

---

## Testing

Run tests with:
```bash
npm test -- apps/web/src/app/api/agencies/[id]/payments/route.test.ts
```

## Security Considerations

1. **Data Isolation**: All endpoints enforce agency-level data isolation
2. **Authentication**: JWT token required for all operations
3. **Authorization**: Role-based permissions checked before operations
4. **Input Validation**: All inputs validated before processing
5. **Sensitive Data**: Payment gateway credentials stored in environment variables
6. **Audit Trail**: All updates record timestamps for audit purposes
