# Invoice Generation API

## Endpoint

`POST /api/payments/create-invoice`

## Description

Generates a professional PDF invoice for a payment record with unique invoice numbering, agency branding, and automatic storage in Supabase Storage. Optionally sends the invoice via email.

## Authentication

Requires valid JWT session token with `payment:write` permission.

## Request Body

```json
{
  "payment_id": "uuid-of-payment-record",
  "send_email": false
}
```

### Fields

- `payment_id` (required): UUID of the payment record to generate invoice for
- `send_email` (optional): Boolean flag to send invoice via email (default: false)

## Response

### Success Response (201 Created)

```json
{
  "invoice_number": "INV-2025-000123",
  "invoice_url": "https://storage.supabase.co/v1/object/public/documents/invoices/agency-id/INV-2025-000123.pdf",
  "invoice_date": "2025-01-15T10:30:00Z",
  "payment": {
    "id": "payment-uuid",
    "invoice_number": "INV-2025-000123",
    "invoice_url": "https://...",
    "amount": 5000,
    "status": "pending",
    ...
  },
  "message": "Invoice generated successfully"
}
```

### Error Responses

#### 400 Bad Request - Missing payment_id
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Missing required field: payment_id",
    "details": {
      "payment_id": ["Payment ID is required"]
    },
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req-uuid"
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
    "request_id": "req-uuid"
  }
}
```

#### 403 Forbidden
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Access denied: insufficient permissions",
    "timestamp": "2025-01-15T10:30:00Z",
    "request_id": "req-uuid"
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
    "request_id": "req-uuid"
  }
}
```

## Features

### 1. Unique Invoice Number Generation

**Property 51: Invoice uniqueness**

Generates unique invoice numbers in the format `INV-YYYY-NNNNNN`:
- `INV`: Prefix for all invoices
- `YYYY`: Current year
- `NNNNNN`: 6-digit sequential number (padded with zeros)

Example: `INV-2025-000123`

The system queries existing invoices for the current year and increments the highest number to ensure uniqueness.

### 2. PDF Invoice Generation with Branding

Creates a professional A4-sized PDF invoice with:
- **Cueron branding**: Company logo and tagline
- **Invoice header**: Invoice number and date
- **Bill To section**: Agency name, address, and GSTN
- **Invoice details**: Invoice date, due date, job number
- **Items table**: Description and amount
- **Total amount**: Prominently displayed
- **Footer**: Thank you message and contact information

### 3. Supabase Storage Integration

- Uploads generated PDF to Supabase Storage bucket `documents`
- Organizes invoices by agency: `invoices/{agency_id}/{invoice_number}.pdf`
- Generates public URL for invoice access
- Updates payment record with invoice URL and number

### 4. Data Isolation

Enforces Row Level Security:
- Users can only generate invoices for payments belonging to their agency
- Agency access validation using `assertAgencyAccess`

### 5. Idempotency

If an invoice already exists for a payment:
- Returns existing invoice details
- Does not generate duplicate invoice
- Prevents invoice number conflicts

### 6. Email Delivery (Placeholder)

Includes placeholder for email delivery integration:
- Can be extended to use SendGrid or AWS SES
- Sends invoice PDF as attachment
- Includes invoice number and download link

## Invoice PDF Layout

```
┌─────────────────────────────────────────────────────┐
│ CUERON                              INVOICE         │
│ India's First Preventive...        INV-2025-000123  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ BILL TO:                    Invoice Date: 15/01/25  │
│ Agency Name                 Due Date: 30/01/25      │
│ City, State - Pincode       Job Number: JOB-2025-1  │
│ GSTN: 29XXXXX1234X1Z5                              │
│                                                     │
├─────────────────────────────────────────────────────┤
│ Description                              Amount     │
├─────────────────────────────────────────────────────┤
│ JOB PAYMENT - JOB-2025-1234            ₹5,000.00   │
├─────────────────────────────────────────────────────┤
│                                                     │
│                        Total Amount:   ₹5,000.00   │
│                                                     │
├─────────────────────────────────────────────────────┤
│           Thank you for your business!              │
│   For any queries, please contact support@cueron.com│
└─────────────────────────────────────────────────────┘
```

## Usage Example

```typescript
// Generate invoice for a payment
const response = await fetch('/api/payments/create-invoice', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${sessionToken}`
  },
  body: JSON.stringify({
    payment_id: 'payment-uuid-here',
    send_email: true
  })
});

const data = await response.json();

if (response.ok) {
  console.log('Invoice generated:', data.invoice_number);
  console.log('Download URL:', data.invoice_url);
} else {
  console.error('Error:', data.error.message);
}
```

## Requirements Validation

**Requirement 11.4**: When an invoice is generated THEN the System SHALL create a unique invoice number and store the invoice URL

✅ Unique invoice number generation with sequential numbering
✅ PDF invoice generation with agency branding
✅ Invoice URL storage in payment record
✅ Supabase Storage integration for PDF hosting
✅ Email delivery support (placeholder for integration)

## Testing

See `route.test.ts` for comprehensive unit tests covering:
- Invoice number uniqueness
- PDF generation
- Storage upload
- Data isolation
- Error handling
- Idempotency
