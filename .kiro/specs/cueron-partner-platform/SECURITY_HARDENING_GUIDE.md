# Security Hardening Guide

This document describes the security hardening measures implemented in the Cueron Partner Platform.

## Overview

The platform implements multiple layers of security to protect against common vulnerabilities and ensure data privacy compliance at Fortune 500 standards.

## Security Measures Implemented

### 1. Rate Limiting

**Implementation**: `apps/web/src/middleware.ts`

- **Limit**: 100 requests per minute per IP address
- **Scope**: All API routes (`/api/*`)
- **Response**: 429 Too Many Requests with Retry-After header
- **Headers Added**:
  - `X-RateLimit-Limit`: Maximum requests allowed
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: When the rate limit resets

**Usage**:
```typescript
// Rate limiting is automatically applied to all API routes
// No additional code needed in route handlers
```

### 2. HTTPS Enforcement

**Implementation**: `apps/web/src/middleware.ts`, `packages/utils/src/security.ts`

- **Environment**: Production only
- **Behavior**: Automatically redirects HTTP requests to HTTPS
- **Headers Checked**: 
  - `x-forwarded-proto` (for load balancers)
  - Direct protocol check

**Configuration**:
```typescript
// Enforced automatically in production
// Set NODE_ENV=production to enable
```

### 3. CORS Configuration

**Implementation**: `apps/web/src/middleware.ts`

- **Allowed Origins**: Configurable via `ALLOWED_ORIGINS` environment variable
- **Allowed Methods**: GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Credentials**: Enabled for authenticated requests
- **Preflight**: Handles OPTIONS requests automatically

**Configuration**:
```env
# .env.local or .env.production
ALLOWED_ORIGINS=https://cueron.com,https://app.cueron.com
```

### 4. Security Headers

**Implementation**: `apps/web/src/middleware.ts`

All responses include the following security headers:

- **X-Content-Type-Options**: `nosniff` - Prevents MIME type sniffing
- **X-Frame-Options**: `DENY` - Prevents clickjacking
- **X-XSS-Protection**: `1; mode=block` - Enables XSS filter
- **Referrer-Policy**: `strict-origin-when-cross-origin` - Controls referrer information
- **Strict-Transport-Security**: `max-age=31536000; includeSubDomains` - Forces HTTPS
- **Content-Security-Policy**: Restricts resource loading to trusted sources

### 5. Input Sanitization

**Implementation**: `packages/utils/src/security.ts`, `apps/web/src/lib/api/security-helpers.ts`

#### Available Functions:

**sanitizeInput(input: string)**
- Removes HTML tags, JavaScript protocols, and event handlers
- Use for: User-generated text content

**sanitizeHTML(html: string)**
- More aggressive HTML sanitization
- Removes script tags, iframes, objects, embeds
- Use for: Rich text content

**sanitizeFilename(filename: string)**
- Prevents path traversal attacks
- Removes special characters
- Use for: File uploads

**validateEmail(email: string)**
- Validates email format
- Use for: Email inputs

**validateURL(url: string, allowedProtocols?: string[])**
- Validates URL format and protocol
- Use for: URL inputs

**Example Usage**:
```typescript
import { sanitizeInput, validateEmail } from '@cueron/utils';

// In API route
const name = sanitizeInput(body.name);
const email = body.email;

if (!validateEmail(email)) {
  return NextResponse.json({ error: 'Invalid email' }, { status: 400 });
}
```

### 6. File Upload Validation

**Implementation**: `packages/utils/src/security.ts`, `apps/web/src/lib/api/security-helpers.ts`

#### Presets Available:

- **images**: Max 5MB, JPEG/PNG/GIF/WebP
- **documents**: Max 10MB, PDF/DOC/DOCX
- **csv**: Max 2MB, CSV files

**Example Usage**:
```typescript
import { validateFileFromRequest } from '@/lib/api/security-helpers';

// In API route
const validation = validateFileFromRequest(file, 'images');

if (!validation.valid) {
  return validation.error; // Returns formatted error response
}
```

### 7. SQL Injection Prevention

**Implementation**: `packages/utils/src/security.ts`

- **Primary Defense**: Supabase uses parameterized queries automatically
- **Additional Validation**: `validateSQLInput()` function checks for common SQL injection patterns
- **Usage**: Applied automatically in `validateQueryParams()` helper

**Patterns Detected**:
- SQL keywords (SELECT, INSERT, UPDATE, DELETE, etc.)
- SQL comments (--, /*, */)
- OR 1=1 patterns
- UNION SELECT patterns

### 8. JWT Token Validation

**Implementation**: `packages/utils/src/auth.ts`, `apps/web/src/lib/auth/middleware.ts`

- **Validation**: Automatic via Supabase Auth
- **Expiration Check**: `isTokenExpired()` function
- **Session Validation**: `isSessionValid()` function
- **Middleware**: `requireAuth()` enforces authentication on API routes

**Example Usage**:
```typescript
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request);
  
  if (response) {
    return response; // Returns 401 if not authenticated
  }
  
  // User is authenticated, proceed with logic
}
```

### 9. Row Level Security (RLS)

**Implementation**: Supabase RLS policies, `apps/web/src/lib/auth/middleware.ts`

- **Database Level**: RLS policies ensure data isolation
- **Application Level**: `enforceRLS()` middleware validates agency access
- **Validation**: `validateAgencyAccess()` checks user permissions

**Example Usage**:
```typescript
import { enforceRLS } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { user, response } = await enforceRLS(request, params.id);
  
  if (response) {
    return response; // Returns 403 if accessing another agency's data
  }
  
  // User has access to this agency's data
}
```

### 10. Session Expiration Handling

**Implementation**: `packages/utils/src/auth.ts`

- **Check**: `isSessionValid()` validates session expiration
- **Refresh**: `shouldRefreshSession()` determines if refresh is needed
- **Threshold**: Sessions are refreshed 10 minutes before expiration

**Example Usage**:
```typescript
import { isSessionValid, shouldRefreshSession } from '@cueron/utils';

if (!isSessionValid(session)) {
  // Redirect to login
}

if (shouldRefreshSession(session)) {
  // Trigger session refresh
  await supabase.auth.refreshSession();
}
```

## API Route Security Checklist

When creating new API routes, follow this checklist:

- [ ] Use `requireAuth()` middleware for authenticated routes
- [ ] Use `requireRole()` or `requirePermission()` for role-based access
- [ ] Use `enforceRLS()` for agency-specific data access
- [ ] Sanitize all user inputs with `sanitizeInput()` or `sanitizeRequestBody()`
- [ ] Validate file uploads with `validateFileFromRequest()`
- [ ] Validate UUIDs with `validateUUIDInput()`
- [ ] Validate emails with `validateEmailInput()`
- [ ] Use `createSecureErrorResponse()` for error handling
- [ ] Never expose sensitive data in error messages (production)

## Example Secure API Route

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, enforceRLS } from '@/lib/auth/middleware';
import { sanitizeRequestBody, validateUUIDInput } from '@/lib/api/security-helpers';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Validate UUID format
  const uuidValidation = validateUUIDInput(params.id, 'agency_id');
  if (!uuidValidation.valid) {
    return uuidValidation.error;
  }

  // 2. Enforce authentication and RLS
  const { user, response } = await enforceRLS(request, params.id);
  if (response) {
    return response;
  }

  try {
    // 3. Parse and sanitize request body
    const body = await request.json();
    const sanitized = sanitizeRequestBody(body, ['name', 'description']);

    // 4. Perform database operation
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('engineers')
      .insert({
        agency_id: params.id,
        name: sanitized.name,
        // ... other fields
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });
  } catch (error) {
    // 5. Return secure error response
    return createSecureErrorResponse(error as Error);
  }
}
```

## Environment Variables

Required environment variables for security features:

```env
# Production environment
NODE_ENV=production

# Allowed CORS origins (comma-separated)
ALLOWED_ORIGINS=https://cueron.com,https://app.cueron.com

# Supabase (for authentication and RLS)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Sentry (for error monitoring)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

## Testing Security

### Manual Testing

1. **Rate Limiting**: Send 101 requests in 1 minute to any API endpoint
2. **HTTPS Enforcement**: Access the site via HTTP in production
3. **CORS**: Make requests from unauthorized origins
4. **Authentication**: Access protected routes without token
5. **Authorization**: Try to access another agency's data
6. **Input Validation**: Submit malicious inputs (XSS, SQL injection)
7. **File Upload**: Upload files exceeding size limits or wrong types

### Automated Testing

Property-based tests are implemented for:
- JWT validation (Property 78)
- RLS enforcement (Property 79)
- Session expiration (Property 81)

Run tests:
```bash
pnpm test
```

## Security Monitoring

- **Error Tracking**: Sentry captures all security-related errors
- **Rate Limit Violations**: Logged with IP address and timestamp
- **Authentication Failures**: Logged with user context
- **Authorization Violations**: Logged with attempted resource access

## Incident Response

If a security vulnerability is discovered:

1. **Immediate**: Disable affected endpoint if critical
2. **Assess**: Determine scope and impact
3. **Fix**: Implement and test fix
4. **Deploy**: Emergency deployment to production
5. **Notify**: Inform affected users if data breach occurred
6. **Review**: Post-mortem and update security measures

## Compliance

The implemented security measures help meet:

- **OWASP Top 10**: Protection against common vulnerabilities
- **Fortune 500 Standards**: Enterprise-grade security
- **Data Privacy**: Encryption at rest and in transit
- **Access Control**: Role-based and data isolation

## Future Enhancements

Planned security improvements:

- [ ] Implement Web Application Firewall (WAF)
- [ ] Add anomaly detection for unusual access patterns
- [ ] Implement API key rotation
- [ ] Add two-factor authentication (2FA)
- [ ] Implement audit logging for all data changes
- [ ] Add automated security scanning in CI/CD
- [ ] Implement DDoS protection
- [ ] Add honeypot endpoints for threat detection

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/security-headers)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
