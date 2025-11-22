# Payment Verification API

## Overview

This endpoint verifies Razorpay payment signatures after successful client-side checkout. It validates the payment authenticity and updates the payment status in our database.

## Endpoint

```
POST /api/payments/verify
```

## Authentication

Requires valid JWT token in Authorization header or session cookie.

## Permissions

- Requires `payment:write` permission
- User must have access to the agency associated with the payment

## Request Body

```typescript
{
  payment_id: string;           // UUID of payment record in our database
  razorpay_order_id: string;    // Order ID from Razorpay
  razorpay_payment_id: string;  // Payment ID from Razorpay
  razorpay_signature: string;   // Signature from Razorpay checkout
}
```

## Response

### Success (200 OK)

```json
{
  "payment": {
    "id": "uuid",
    "status": "completed",
    "amount": 500.00,
    "paid_at": "2025-01-15T10:30:00Z",
    ...
  },
  "razorpay_payment_id": "pay_abc123",
  "message": "Payment verified successfully"
}
```

### Error Responses

#### 400 Bad Request - Validation Error
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: payment_id",
    "details": {
      "payment_id": ["Payment ID is required"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 400 Bad Request - Verification Failed
```json
{
  "error": {
    "code": "VERIFICATION_FAILED",
    "message": "Payment signature verification failed",
    "timestamp": "2025-01-15T10:30:00Z",
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
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied to this agency's data",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

#### 404 Not Found
```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Payment not found",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req_abc123"
  }
}
```

## Verification Process

1. **Signature Verification**: Validates the Razorpay signature using HMAC SHA256
2. **Order ID Matching**: Ensures the order ID matches our payment record
3. **Payment Details Fetch**: Retrieves payment details from Razorpay API
4. **Status Verification**: Confirms payment status is 'captured' or 'authorized'
5. **Amount Verification**: Validates the payment amount matches our record
6. **Database Update**: Updates payment status to 'completed' with timestamp

## Client-Side Integration

After successful Razorpay checkout, call this endpoint:

```javascript
// After Razorpay checkout success
const response = await fetch('/api/payments/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    payment_id: 'your-payment-uuid',
    razorpay_order_id: razorpayResponse.razorpay_order_id,
    razorpay_payment_id: razorpayResponse.razorpay_payment_id,
    razorpay_signature: razorpayResponse.razorpay_signature,
  }),
});

const result = await response.json();

if (response.ok) {
  // Payment verified successfully
  console.log('Payment completed:', result.payment);
} else {
  // Verification failed
  console.error('Verification error:', result.error);
}
```

## Security Features

- HMAC SHA256 signature verification
- Timing-safe signature comparison
- Amount verification against Razorpay API
- Status verification from Razorpay
- Agency data isolation enforcement

## Configuration

Requires the following environment variables:

```env
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

## Requirements

Validates: Requirements 11.3 (Payment processing)
