# Encryption and Security Utilities Guide

## Overview

This package provides encryption and security utilities for the Cueron Partner Platform, implementing AES-256-CBC encryption for sensitive data and various security helpers.

## Setup

### Environment Variables

Before using encryption functions, you must set the `ENCRYPTION_KEY` environment variable:

```bash
# Generate a new encryption key (run once)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Set in your environment
export ENCRYPTION_KEY="your-64-character-hex-key"
```

**Important**: 
- The encryption key must be exactly 64 hexadecimal characters (32 bytes)
- Store this key securely (e.g., AWS Secrets Manager, environment variables)
- Never commit the key to version control
- Use different keys for different environments (dev, staging, production)

## Encryption Functions

### Basic Encryption/Decryption

```typescript
import { encrypt, decrypt } from '@cueron/utils';

// Encrypt sensitive data
const plaintext = "1234567890";
const encrypted = encrypt(plaintext);
// Returns: "a1b2c3d4....:e5f6g7h8...." (iv:ciphertext format)

// Decrypt data
const decrypted = decrypt(encrypted);
// Returns: "1234567890"
```

### Bank Account Encryption

```typescript
import { encryptBankAccount, decryptBankAccount } from '@cueron/utils';

// Encrypt bank account number
const accountNumber = "1234567890123456";
const encrypted = encryptBankAccount(accountNumber);

// Decrypt bank account number
const decrypted = decryptBankAccount(encrypted);
```

### PAN Number Encryption

```typescript
import { encryptPAN, decryptPAN } from '@cueron/utils';

// Encrypt PAN (automatically converts to uppercase)
const pan = "ABCDE1234F";
const encrypted = encryptPAN(pan);

// Decrypt PAN
const decrypted = decryptPAN(encrypted);
// Returns: "ABCDE1234F" (uppercase)
```

### Check if Data is Encrypted

```typescript
import { isEncrypted } from '@cueron/utils';

const plaintext = "hello";
const encrypted = encrypt(plaintext);

console.log(isEncrypted(plaintext));  // false
console.log(isEncrypted(encrypted));  // true
```

## Hashing Functions

### SHA-256 Hashing

```typescript
import { hashData } from '@cueron/utils';

const data = "sensitive-data";
const hash = hashData(data);
// Returns: 64-character hex string
```

### PBKDF2 Hashing with Salt

```typescript
import { hashWithSalt, verifyHash } from '@cueron/utils';

// Hash data with automatic salt generation
const { salt, hash } = hashWithSalt("password123");

// Verify hashed data
const isValid = verifyHash("password123", salt, hash);
// Returns: true

const isInvalid = verifyHash("wrongpassword", salt, hash);
// Returns: false
```

## Security Utilities

### JWT Validation

```typescript
import { validateJWTStructure, extractBearerToken } from '@cueron/utils';

// Validate JWT structure
const result = validateJWTStructure(token);
if (result.valid) {
  console.log("Token payload:", result.payload);
} else {
  console.log("Error:", result.error);
}

// Extract token from Authorization header
const token = extractBearerToken("Bearer eyJhbGc...");
```

### HTTPS Enforcement

```typescript
import { enforceHTTPS, isHTTPS } from '@cueron/utils';

// Check if request is HTTPS
const secure = isHTTPS(req.protocol, req.headers);

// Enforce HTTPS in production
const result = enforceHTTPS(req.protocol, req.headers, 'production');
if (result.shouldRedirect) {
  res.redirect(301, result.redirectUrl);
}
```

### Input Sanitization

```typescript
import { sanitizeInput, validateSQLInput } from '@cueron/utils';

// Sanitize user input (XSS prevention)
const clean = sanitizeInput("<script>alert('xss')</script>");
// Returns: "scriptalert('xss')/script"

// Validate SQL input
const isSafe = validateSQLInput("SELECT * FROM users");
// Returns: false (SQL keywords detected)
```

### Rate Limiting

```typescript
import { RateLimiter } from '@cueron/utils';

// Create rate limiter (100 requests per minute)
const limiter = new RateLimiter(100, 60000);

// Check if request is allowed
if (limiter.isAllowed(userId)) {
  // Process request
} else {
  // Return 429 Too Many Requests
}

// Get remaining requests
const remaining = limiter.getRemaining(userId);
```

### CORS Configuration

```typescript
import { getCORSHeaders } from '@cueron/utils';

const config = {
  origin: ['https://app.cueron.com', 'https://admin.cueron.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400,
};

const headers = getCORSHeaders(config, req.headers.origin);
// Returns CORS headers object
```

## Database Integration

### Encrypting Before Storage

```typescript
import { encryptBankAccount, encryptPAN } from '@cueron/utils';

// When creating/updating agency
const agency = {
  name: "ABC Training Center",
  bank_account_number: encryptBankAccount("1234567890123456"),
  pan_number: encryptPAN("ABCDE1234F"),
  // ... other fields
};

await supabase.from('agencies').insert(agency);
```

### Decrypting After Retrieval

```typescript
import { decryptBankAccount, decryptPAN } from '@cueron/utils';

// When fetching agency
const { data: agency } = await supabase
  .from('agencies')
  .select('*')
  .eq('id', agencyId)
  .single();

// Decrypt sensitive fields
const decryptedAgency = {
  ...agency,
  bank_account_number: decryptBankAccount(agency.bank_account_number),
  pan_number: decryptPAN(agency.pan_number),
};
```

## Testing

The encryption utilities include comprehensive property-based tests using fast-check:

```bash
# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with UI
pnpm test:ui
```

### Property Tests Included

- **Property 5**: Bank detail encryption - Ensures bank account numbers are encrypted
- **Property 77**: Sensitive data encryption - Ensures all sensitive data is encrypted
- Round-trip encryption/decryption
- Hash consistency and uniqueness
- Error handling for invalid inputs

## Security Best Practices

1. **Key Management**
   - Never hardcode encryption keys
   - Use environment variables or secret management services
   - Rotate keys periodically
   - Use different keys per environment

2. **Data Handling**
   - Always encrypt sensitive data before storage
   - Decrypt only when necessary
   - Never log decrypted sensitive data
   - Use HTTPS for all API communications

3. **Error Handling**
   - Don't expose encryption errors to users
   - Log encryption failures securely
   - Implement proper error recovery

4. **Performance**
   - Cache decrypted data when appropriate
   - Consider encrypting at the application layer vs database layer
   - Monitor encryption/decryption performance

## Compliance

These utilities help meet the following compliance requirements:

- **PCI DSS**: Encryption of payment card data
- **GDPR**: Protection of personal data
- **Indian IT Act**: Data security requirements
- **Fortune 500 Standards**: Enterprise-grade security

## Troubleshooting

### "ENCRYPTION_KEY environment variable is not set"

Set the `ENCRYPTION_KEY` environment variable with a 64-character hex string.

### "Encryption key must be 32 bytes"

Ensure your encryption key is exactly 64 hexadecimal characters (32 bytes).

### "Invalid ciphertext format"

The encrypted data may be corrupted or not in the expected format (iv:data).

### "Cannot decrypt empty string"

Ensure you're passing a valid encrypted string to decrypt functions.

## Support

For questions or issues, contact the Cueron development team or refer to the main project documentation.
