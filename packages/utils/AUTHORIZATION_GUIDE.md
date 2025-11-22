# Authorization and Role-Based Access Control Guide

## Overview

The Cueron Partner Platform implements a comprehensive role-based access control (RBAC) system with four roles and fine-grained permissions. This guide explains how to use the authorization utilities in your application.

## Roles

### Admin
- **Level**: 3 (highest)
- **Permissions**: Full access to all resources
- **Use Case**: Agency owners, system administrators
- **Capabilities**: All operations including user management, settings, and deletions

### Manager
- **Level**: 2
- **Permissions**: Read all, write to engineers and jobs
- **Use Case**: Agency managers, operations leads
- **Capabilities**: Manage engineers, assign jobs, view analytics

### Viewer
- **Level**: 1
- **Permissions**: Read-only access
- **Use Case**: Accountants, auditors, read-only staff
- **Capabilities**: View all data, no modifications

### Engineer
- **Level**: 0
- **Permissions**: Limited to job operations
- **Use Case**: Field engineers
- **Capabilities**: View and update assigned jobs only

## Permission System

### Permission Format
Permissions follow the pattern: `resource:operation`

**Resources**: agency, engineer, job, payment, user, analytics, settings

**Operations**: read, write, delete

### Examples
- `agency:read` - View agency information
- `engineer:write` - Create/update engineers
- `job:assign` - Assign jobs to engineers
- `user:delete` - Delete users

## Usage in Code

### Basic Permission Checks

```typescript
import { hasPermission, canRead, canWrite } from '@cueron/utils';

// Check specific permission
if (hasPermission(userRole, 'engineer:write')) {
  // User can create/update engineers
}

// Check resource-based permissions
if (canRead(userRole, 'job')) {
  // User can read jobs
}

if (canWrite(userRole, 'agency')) {
  // User can modify agency data
}
```

### Role Identification

```typescript
import { isAdmin, isManagerOrAdmin, isViewer } from '@cueron/utils';

// Check if user is admin
if (isAdmin(userRole)) {
  // Show admin-only features
}

// Check if user can perform write operations
if (isManagerOrAdmin(userRole)) {
  // Allow editing
}

// Check if user is read-only
if (isViewer(userRole)) {
  // Hide edit buttons
}
```

### Multiple Permission Checks

```typescript
import { hasAllPermissions, hasAnyPermission } from '@cueron/utils';

// Require all permissions
if (hasAllPermissions(userRole, ['job:read', 'job:write', 'job:assign'])) {
  // User can fully manage jobs
}

// Require any permission
if (hasAnyPermission(userRole, ['analytics:read', 'payment:read'])) {
  // User can view financial data
}
```

### Data Isolation

```typescript
import { validateDataIsolation, canAccessAgencyData } from '@cueron/utils';

// Validate user can access agency data
if (canAccessAgencyData(userAgencyId, requestedAgencyId)) {
  // Allow access
} else {
  // Deny access - user trying to access another agency's data
}

// Alternative with null handling
const canAccess = validateDataIsolation(userAgencyId, requestedAgencyId);
```

### Error Handling with Assertions

```typescript
import { assertPermission, assertAgencyAccess } from '@cueron/utils';

try {
  // Assert user has permission (throws if not)
  assertPermission(userRole, 'engineer:delete');
  
  // Assert user can access agency data (throws if not)
  assertAgencyAccess(userAgencyId, targetAgencyId);
  
  // Proceed with operation
  await deleteEngineer(engineerId);
} catch (error) {
  if (error instanceof InsufficientPermissionsError) {
    return res.status(403).json({ error: error.message });
  }
  if (error instanceof DataIsolationError) {
    return res.status(403).json({ error: error.message });
  }
}
```

## Usage in API Routes (Next.js)

### Require Authentication

```typescript
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuth(request);
  
  if (response) {
    return response; // Returns 401 if not authenticated
  }
  
  // User is authenticated, proceed
}
```

### Require Specific Role

```typescript
import { requireRole, requireAdmin, requireManager } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  // Require admin role
  const { user, role, response } = await requireAdmin(request);
  
  if (response) {
    return response; // Returns 403 if not admin
  }
  
  // User is admin, proceed
}

export async function PATCH(request: NextRequest) {
  // Require manager or admin role
  const { user, role, response } = await requireManager(request);
  
  if (response) {
    return response; // Returns 403 if not manager/admin
  }
  
  // User is manager or admin, proceed
}
```

### Require Specific Permission

```typescript
import { requirePermission, requireWritePermission } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  // Require specific permission
  const { user, role, response } = await requirePermission(request, 'engineer:write');
  
  if (response) {
    return response; // Returns 403 if permission denied
  }
  
  // User has permission, proceed
}

export async function PUT(request: NextRequest) {
  // Require write permission for resource
  const { user, role, response } = await requireWritePermission(request, 'job');
  
  if (response) {
    return response;
  }
  
  // User can write jobs, proceed
}
```

### Enforce Row Level Security

```typescript
import { enforceRLS } from '@/lib/auth/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  // Enforce RLS - user can only access their own agency's data
  const { user, role, agencyId, response } = await enforceRLS(
    request,
    params.agencyId
  );
  
  if (response) {
    return response; // Returns 403 if trying to access another agency's data
  }
  
  // User can access this agency's data, proceed
  const data = await getAgencyData(params.agencyId);
  return NextResponse.json(data);
}
```

### Validate Not Viewer (Prevent Write Operations)

```typescript
import { validateNotViewer } from '@/lib/auth/middleware';

export async function POST(request: NextRequest) {
  // Ensure user is not a viewer (viewers are read-only)
  const { user, role, response } = await validateNotViewer(request);
  
  if (response) {
    return response; // Returns 403 if user is viewer
  }
  
  // User can perform write operations, proceed
}
```

## Complete API Route Example

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { enforceRLS, requireWritePermission } from '@/lib/auth/middleware';

export async function POST(
  request: NextRequest,
  { params }: { params: { agencyId: string } }
) {
  // Step 1: Enforce RLS - ensure user can access this agency
  const { user, role, agencyId, response: rlsResponse } = await enforceRLS(
    request,
    params.agencyId
  );
  
  if (rlsResponse) {
    return rlsResponse;
  }
  
  // Step 2: Check write permission
  const { response: permResponse } = await requireWritePermission(request, 'engineer');
  
  if (permResponse) {
    return permResponse;
  }
  
  // Step 3: Process request
  const body = await request.json();
  
  try {
    const engineer = await createEngineer({
      ...body,
      agency_id: agencyId,
    });
    
    return NextResponse.json(engineer, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create engineer' },
      { status: 500 }
    );
  }
}
```

## UI Component Examples

### Conditional Rendering Based on Role

```tsx
import { isAdmin, canWrite } from '@cueron/utils';

function EngineerList({ userRole }: { userRole: UserRole }) {
  return (
    <div>
      <h1>Engineers</h1>
      
      {/* Show add button only if user can write */}
      {canWrite(userRole, 'engineer') && (
        <button onClick={handleAddEngineer}>Add Engineer</button>
      )}
      
      {/* Show delete button only for admins */}
      {isAdmin(userRole) && (
        <button onClick={handleDeleteEngineer}>Delete</button>
      )}
      
      {/* Show edit button for managers and admins */}
      {!isViewer(userRole) && (
        <button onClick={handleEditEngineer}>Edit</button>
      )}
    </div>
  );
}
```

### Permission-Based Navigation

```tsx
import { hasPermission } from '@cueron/utils';

function Navigation({ userRole }: { userRole: UserRole }) {
  return (
    <nav>
      {hasPermission(userRole, 'agency:read') && (
        <Link href="/dashboard">Dashboard</Link>
      )}
      
      {hasPermission(userRole, 'engineer:read') && (
        <Link href="/engineers">Engineers</Link>
      )}
      
      {hasPermission(userRole, 'analytics:read') && (
        <Link href="/analytics">Analytics</Link>
      )}
      
      {hasPermission(userRole, 'settings:write') && (
        <Link href="/settings">Settings</Link>
      )}
    </nav>
  );
}
```

## Best Practices

### 1. Always Validate on Server
Never rely solely on client-side permission checks. Always validate permissions on the server in API routes.

```typescript
// ❌ Bad - only client-side check
if (canWrite(userRole, 'job')) {
  await fetch('/api/jobs', { method: 'POST', body: data });
}

// ✅ Good - client-side check + server-side validation
if (canWrite(userRole, 'job')) {
  await fetch('/api/jobs', { method: 'POST', body: data });
}

// In API route:
export async function POST(request: NextRequest) {
  const { response } = await requireWritePermission(request, 'job');
  if (response) return response;
  // ...
}
```

### 2. Use RLS for Data Isolation
Always use `enforceRLS()` when accessing agency-specific data.

```typescript
// ✅ Good - enforces data isolation
export async function GET(request: NextRequest, { params }) {
  const { response } = await enforceRLS(request, params.agencyId);
  if (response) return response;
  // ...
}
```

### 3. Combine Multiple Checks
Use multiple middleware functions for comprehensive security.

```typescript
export async function DELETE(request: NextRequest, { params }) {
  // Check authentication
  const { user, response: authResponse } = await requireAuth(request);
  if (authResponse) return authResponse;
  
  // Check admin role
  const { response: roleResponse } = await requireAdmin(request);
  if (roleResponse) return roleResponse;
  
  // Check data isolation
  const { response: rlsResponse } = await enforceRLS(request, params.agencyId);
  if (rlsResponse) return rlsResponse;
  
  // All checks passed, proceed with deletion
}
```

### 4. Provide Clear Error Messages
Use descriptive error messages for better debugging.

```typescript
if (!hasPermission(userRole, 'engineer:delete')) {
  throw new InsufficientPermissionsError('engineer:delete');
  // Error message: "Insufficient permissions. Required: engineer:delete"
}
```

### 5. Cache Role Information
Cache user role information to avoid repeated database queries.

```typescript
// In session or context
const userRole = await getUserRole(userId);
// Store in session/context for reuse
```

## Testing

### Unit Tests
```typescript
import { hasPermission, isAdmin } from '@cueron/utils';

describe('Authorization', () => {
  it('should grant admin all permissions', () => {
    expect(hasPermission('admin', 'engineer:delete')).toBe(true);
    expect(isAdmin('admin')).toBe(true);
  });
  
  it('should restrict viewer to read-only', () => {
    expect(hasPermission('viewer', 'engineer:write')).toBe(false);
    expect(hasPermission('viewer', 'engineer:read')).toBe(true);
  });
});
```

### Property-Based Tests
See `packages/utils/src/authorization.test.ts` for comprehensive property-based tests using fast-check.

## Troubleshooting

### Common Issues

**Issue**: User can't access their own agency's data
- **Solution**: Ensure `userAgencyId` is correctly retrieved from database
- **Check**: Verify agency_users table has correct user_id and agency_id

**Issue**: Permission check always returns false
- **Solution**: Verify role is correctly retrieved and matches expected format
- **Check**: Role should be one of: 'admin', 'manager', 'viewer', 'engineer'

**Issue**: RLS enforcement fails
- **Solution**: Ensure both userAgencyId and targetAgencyId are non-null
- **Check**: Database queries should return valid UUIDs

## Security Considerations

1. **Never trust client-side checks** - Always validate on server
2. **Use RLS policies** - Database-level security as second layer
3. **Log authorization failures** - Monitor for potential security issues
4. **Rotate JWT secrets** - Regularly update authentication secrets
5. **Audit permission changes** - Track when permissions are modified

## Additional Resources

- [Requirements Document](../../.kiro/specs/cueron-partner-platform/requirements.md) - Requirements 13.1-13.5
- [Design Document](../../.kiro/specs/cueron-partner-platform/design.md) - Properties 57-61
- [Task Implementation Summary](../../.kiro/specs/cueron-partner-platform/TASK_7_IMPLEMENTATION_SUMMARY.md)
- [Supabase RLS Policies](../../supabase/migrations/00002_rls_policies.sql)

## Support

For questions or issues with the authorization system, refer to:
- Property-based tests for expected behavior
- Implementation summary for architecture details
- Design document for correctness properties
