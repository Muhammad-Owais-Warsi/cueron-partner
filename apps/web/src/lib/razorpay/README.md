# Razorpay Payment Gateway Integration

## Overview

This module provides complete integration with Razorpay payment gateway for the Cueron Partner Platform. It handles payment order creation, signature verification, webhook processing, and payment status management.

## Features

- ✅ Payment order creation via Razorpay API
- ✅ Client-side checkout integration
- ✅ Payment signature verification
- ✅ Webhook event handling
- ✅ Secure HMAC SHA256 signature validation
- ✅ Payment failure handling
- ✅ Automatic payment status updates

## Architecture

```
┌─────────────────┐
│  Client (Web)   │
│   Application   │
└────────┬────────┘
         │
         │ 1. Create Order
         ▼
┌─────────────────────────────┐
│ POST /api/agencies/{id}/    │
│      payments               │
└────────┬────────────────────┘
         │
         │ 2. Razorpay Order
         ▼
┌─────────────────┐
│  Razorpay API   │
└────────┬────────┘
         │
         │ 3. Order Details
         ▼
┌─────────────────┐
│  Client (Web)   │
│  Razorpay SDK   │
└────────┬────────┘
         │
         │ 4. Payment Success
         ▼
┌─────────────────────────────┐
│ POST /api/payments/verify   │
└────────┬────────────────────┘
         │
         │ 5. Verify Signature
         ▼
┌─────────────────┐
│  Razorpay API   │
│ (Fetch Details) │
└─────────────────┘

         ┌──────────────────┐
         │  Razorpay        │
         │  Webhooks        │
         └────────┬─────────┘
                  │
                  │ Async Events
                  ▼
         ┌──────────────────────────┐
         │ POST /api/payments/      │
         │      webhook             │
         └──────────────────────────┘
```

## Setup

### 1. Environment Variables

Add the following to your `.env.local` file:

```env
# Razorpay API Credentials
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Razorpay Webhook Secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

### 2. Razorpay Dashboard Configuration

1. **Create Account**: Sign up at https://razorpay.com
2. **Get API Keys**: Dashboard → Settings → API Keys
3. **Configure Webhooks**: Dashboard → Settings → Webhooks
   - URL: `https://your-domain.com/api/payments/webhook`
   - Events: `payment.authorized`, `payment.captured`, `payment.failed`, `order.paid`
   - Copy the webhook secret

### 3. Client-Side Integration

Install Razorpay checkout script in your HTML:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
```

## Usage

### Creating a Payment Order

```typescript
// 1. Create payment order
const response = await fetch(`/api/agencies/${agencyId}/payments`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    payment_id: 'payment-uuid-from-database',
    amount: 500, // Amount in INR
  }),
});

const { order_id, amount, currency, key_id } = await response.json();
```

### Client-Side Checkout

```typescript
// 2. Initialize Razorpay checkout
const options = {
  key: key_id,
  amount: amount * 100, // Amount in paise
  currency: currency,
  name: 'Cueron',
  description: 'Service Payment',
  order_id: order_id,
  handler: async function (response) {
    // 3. Verify payment on success
    await verifyPayment(response);
  },
  prefill: {
    name: 'Agency Name',
    email: 'agency@example.com',
    contact: '9876543210',
  },
  theme: {
    color: '#1a56db',
  },
};

const razorpay = new Razorpay(options);
razorpay.open();
```

### Verifying Payment

```typescript
async function verifyPayment(razorpayResponse) {
  const response = await fetch('/api/payments/verify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      payment_id: 'payment-uuid-from-database',
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature,
    }),
  });

  if (response.ok) {
    const { payment } = await response.json();
    console.log('Payment verified:', payment);
    // Show success message
  } else {
    const { error } = await response.json();
    console.error('Verification failed:', error);
    // Show error message
  }
}
```

### Handling Payment Failures

```typescript
const options = {
  // ... other options
  modal: {
    ondismiss: function() {
      // User closed the payment modal
      console.log('Payment cancelled by user');
    },
  },
};

razorpay.on('payment.failed', function (response) {
  console.error('Payment failed:', response.error);
  // Show error message to user
  alert(`Payment failed: ${response.error.description}`);
});
```

## API Reference

### Client Functions

#### `getRazorpayConfig()`

Gets Razorpay configuration from environment variables.

```typescript
const config = getRazorpayConfig();
// Returns: { keyId: string, keySecret: string }
```

#### `createRazorpayOrder(options, config)`

Creates a payment order via Razorpay API.

```typescript
const order = await createRazorpayOrder(
  {
    amount: 500,
    currency: 'INR',
    receipt: 'payment_uuid',
    notes: { agency_id: 'agency_123' },
  },
  config
);
```

#### `verifyPaymentSignature(data, config)`

Verifies payment signature from Razorpay checkout.

```typescript
const isValid = verifyPaymentSignature(
  {
    razorpay_order_id: 'order_123',
    razorpay_payment_id: 'pay_123',
    razorpay_signature: 'signature_string',
  },
  config
);
```

#### `verifyWebhookSignature(body, signature, secret)`

Verifies webhook signature from Razorpay.

```typescript
const isValid = verifyWebhookSignature(
  webhookBodyString,
  signatureFromHeader,
  webhookSecret
);
```

#### `fetchPaymentDetails(paymentId, config)`

Fetches payment details from Razorpay API.

```typescript
const payment = await fetchPaymentDetails('pay_123', config);
```

## Security

### Signature Verification

All payment verifications use HMAC SHA256 signatures:

```typescript
// Payment signature format
const text = `${order_id}|${payment_id}`;
const signature = crypto
  .createHmac('sha256', keySecret)
  .update(text)
  .digest('hex');
```

### Webhook Security

- All webhooks are verified using HMAC SHA256
- Invalid signatures are rejected with 401 status
- Timing-safe comparison prevents timing attacks

### Best Practices

1. **Never expose key secret**: Keep it server-side only
2. **Verify all payments**: Always verify signatures before updating status
3. **Use HTTPS**: All API calls must use HTTPS
4. **Validate amounts**: Always verify payment amounts match
5. **Handle failures**: Implement proper error handling and user feedback

## Testing

### Test Mode

Use test API keys for development:

```env
RAZORPAY_KEY_ID=rzp_test_your_test_key
RAZORPAY_KEY_SECRET=your_test_secret
```

### Test Cards

Razorpay provides test cards for different scenarios:

- **Success**: 4111 1111 1111 1111
- **Failure**: 4111 1111 1111 1234
- **OTP**: Any 6-digit number

### Running Tests

```bash
# Run unit tests
npm test -- apps/web/src/lib/razorpay/client.test.ts

# Run API tests
npm test -- apps/web/src/app/api/payments
```

## Troubleshooting

### Common Issues

#### "Payment gateway not configured"

**Solution**: Ensure `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set in environment variables.

#### "Webhook signature verification failed"

**Solution**: 
1. Check that `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay dashboard
2. Ensure webhook URL is correct
3. Verify webhook is active in Razorpay dashboard

#### "Payment amount mismatch"

**Solution**: Ensure the amount sent to Razorpay matches the payment record in your database.

#### "Order ID mismatch"

**Solution**: Verify that the order ID from Razorpay matches the `payment_gateway_id` in your payment record.

## Requirements

Validates: Requirements 11.3 (Payment processing)

## Related Documentation

- [Razorpay API Documentation](https://razorpay.com/docs/api/)
- [Razorpay Checkout Documentation](https://razorpay.com/docs/payments/payment-gateway/web-integration/)
- [Razorpay Webhooks Documentation](https://razorpay.com/docs/webhooks/)
