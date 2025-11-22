# Razorpay Webhook Handler

## Overview

This endpoint handles webhook events from Razorpay payment gateway. It processes payment status updates and synchronizes them with our payment records.

## Endpoint

```
POST /api/payments/webhook
```

## Authentication

This endpoint uses webhook signature verification instead of user authentication. The signature is validated using the Razorpay webhook secret.

## Headers

- `X-Razorpay-Signature`: Webhook signature from Razorpay (required)

## Webhook Events Handled

### payment.authorized
Triggered when a payment is authorized by the customer.

**Action**: Updates payment status to 'completed' and records paid_at timestamp.

### payment.captured
Triggered when a payment is captured successfully.

**Action**: Updates payment status to 'completed' and records paid_at timestamp.

### payment.failed
Triggered when a payment fails.

**Action**: Updates payment status to 'failed'.

### order.paid
Triggered when an order is fully paid.

**Action**: Updates payment status to 'completed' if not already completed.

## Configuration

Set the following environment variables:

```env
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_from_razorpay_dashboard
```

## Webhook Setup in Razorpay Dashboard

1. Go to Razorpay Dashboard → Settings → Webhooks
2. Add a new webhook with URL: `https://your-domain.com/api/payments/webhook`
3. Select the following events:
   - payment.authorized
   - payment.captured
   - payment.failed
   - order.paid
4. Copy the webhook secret and add it to your environment variables

## Security

- All webhook requests are verified using HMAC SHA256 signature
- Invalid signatures are rejected with 401 status
- Webhook processing uses admin Supabase client (bypasses RLS)

## Error Handling

- Invalid signature: 401 Unauthorized
- Missing signature: 400 Bad Request
- Invalid payload: 400 Bad Request
- Processing errors: 500 Internal Server Error

## Example Webhook Payload

```json
{
  "event": "payment.captured",
  "payload": {
    "payment": {
      "entity": {
        "id": "pay_abc123",
        "amount": 50000,
        "currency": "INR",
        "status": "captured",
        "method": "card",
        "order_id": "order_xyz789"
      }
    },
    "order": {
      "id": "order_xyz789",
      "amount": 50000,
      "currency": "INR",
      "receipt": "payment_uuid_from_our_db"
    }
  }
}
```

## Testing

Use Razorpay's webhook testing tool in the dashboard to send test events to your endpoint.

## Requirements

Validates: Requirements 11.3 (Payment processing)
