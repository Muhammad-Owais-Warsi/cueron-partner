/**
 * Authentication Middleware for API Routes
 * Provides JWT validation and role-based access control
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../supabase/server';
import type { UserRole } from '@cueron/utils';
import {
  hasPermission,
  canRead,
  canWrite,
  canDelete,
  isAdmin,
  isManagerOrAdmin,
  isViewer,
  validateDataIsolation,
  type Permission,
} from '@cueron/utils';

/**
 * Authentication error response
 */
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return NextResponse.json(
    {
      error: {
        code: 'UNAUTHORIZED',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 401 }
  );
}

/**
 * Forbidden error response
 */
export function forbiddenResponse(message: string = 'Forbidden') {
  return NextResponse.json(
    {
      error: {
        code: 'FORBIDDEN',
        message,
        timestamp: new Date().toISOString(),
      },
    },
    { status: 403 }
  );
}

/**
 * Validate JWT token and get user
 */
export async function validateAuth(request: NextRequest) {
  const supabase = await createClient();
  
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { user: null, error: 'Invalid or missing authentication token' };
  }

  return { user, error: null };
}

/**
 * Require authentication middleware
 * Use in API routes to ensure user is authenticated
 */
export async function requireAuth(request: NextRequest) {
  const { user, error } = await validateAuth(request);

  if (error || !user) {
    return { user: null, response: unauthorizedResponse(error || undefined) };
  }

  return { user, response: null };
}

/**
 * Get user role from database
 */
export async function getUserRole(userId: string): Promise<UserRole | null> {
  const supabase = await createClient();

  // Check if user is an engineer
  const { data: engineer } = await supabase
    .from('engineers')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (engineer) {
    return 'engineer';
  }

  // Check agency user role
  const { data: agencyUser } = await supabase
    .from('agency_users')
    .select('role')
    .eq('user_id', userId)
    .single();

  if (agencyUser) {
    return agencyUser.role as UserRole;
  }

  return null;
}

/**
 * Require specific role middleware
 */
export async function requireRole(request: NextRequest, requiredRole: UserRole) {
  const { user, response } = await requireAuth(request);

  if (response) {
    return { user: null, role: null, response };
  }

  const role = await getUserRole(user!.id);

  if (!role) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse('User role not found'),
    };
  }

  // Check role hierarchy
  const roleHierarchy: Record<UserRole, number> = {
    admin: 3,
    manager: 2,
    viewer: 1,
    engineer: 0,
  };

  if (roleHierarchy[role] < roleHierarchy[requiredRole]) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse('Insufficient permissions'),
    };
  }

  return { user, role, response: null };
}

/**
 * Require admin role
 */
export async function requireAdmin(request: NextRequest) {
  return requireRole(request, 'admin');
}

/**
 * Require manager or admin role
 */
export async function requireManager(request: NextRequest) {
  return requireRole(request, 'manager');
}

/**
 * Get agency ID for current user
 */
export async function getUserAgencyId(userId: string): Promise<string | null> {
  const supabase = await createClient();

  // Check if user is an engineer
  const { data: engineer } = await supabase
    .from('engineers')
    .select('agency_id')
    .eq('user_id', userId)
    .single();

  if (engineer) {
    return engineer.agency_id;
  }

  // Check agency user
  const { data: agencyUser } = await supabase
    .from('agency_users')
    .select('agency_id')
    .eq('user_id', userId)
    .single();

  if (agencyUser) {
    return agencyUser.agency_id;
  }

  return null;
}

/**
 * Validate agency access
 * Ensures user can only access their own agency's data
 */
export async function validateAgencyAccess(
  userId: string,
  requestedAgencyId: string
): Promise<boolean> {
  const userAgencyId = await getUserAgencyId(userId);

  if (!userAgencyId) {
    return false;
  }

  return userAgencyId === requestedAgencyId;
}

/**
 * Require specific permission middleware
 */
export async function requirePermission(
  request: NextRequest,
  permission: Permission
) {
  const { user, response } = await requireAuth(request);

  if (response) {
    return { user: null, role: null, response };
  }

  const role = await getUserRole(user!.id);

  if (!role) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse('User role not found'),
    };
  }

  if (!hasPermission(role, permission)) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse(
        `Insufficient permissions. Required: ${permission}`
      ),
    };
  }

  return { user, role, response: null };
}

/**
 * Require read permission for a resource
 */
export async function requireReadPermission(
  request: NextRequest,
  resource: string
) {
  const { user, response } = await requireAuth(request);

  if (response) {
    return { user: null, role: null, response };
  }

  const role = await getUserRole(user!.id);

  if (!role) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse('User role not found'),
    };
  }

  if (!canRead(role, resource)) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse(
        `Insufficient permissions to read ${resource}`
      ),
    };
  }

  return { user, role, response: null };
}

/**
 * Require write permission for a resource
 */
export async function requireWritePermission(
  request: NextRequest,
  resource: string
) {
  const { user, response } = await requireAuth(request);

  if (response) {
    return { user: null, role: null, response };
  }

  const role = await getUserRole(user!.id);

  if (!role) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse('User role not found'),
    };
  }

  if (!canWrite(role, resource)) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse(
        `Insufficient permissions to write ${resource}`
      ),
    };
  }

  return { user, role, response: null };
}

/**
 * Require delete permission for a resource
 */
export async function requireDeletePermission(
  request: NextRequest,
  resource: string
) {
  const { user, response } = await requireAuth(request);

  if (response) {
    return { user: null, role: null, response };
  }

  const role = await getUserRole(user!.id);

  if (!role) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse('User role not found'),
    };
  }

  if (!canDelete(role, resource)) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse(
        `Insufficient permissions to delete ${resource}`
      ),
    };
  }

  return { user, role, response: null };
}

/**
 * Enforce Row Level Security by validating agency access
 */
export async function enforceRLS(
  request: NextRequest,
  requestedAgencyId: string
) {
  const { user, response } = await requireAuth(request);

  if (response) {
    return { user: null, role: null, agencyId: null, response };
  }

  const role = await getUserRole(user!.id);
  const userAgencyId = await getUserAgencyId(user!.id);

  if (!role || !userAgencyId) {
    return {
      user: null,
      role: null,
      agencyId: null,
      response: forbiddenResponse('User agency not found'),
    };
  }

  // Validate data isolation
  if (!validateDataIsolation(userAgencyId, requestedAgencyId)) {
    return {
      user: null,
      role: null,
      agencyId: null,
      response: forbiddenResponse(
        'Access denied. You can only access data from your own agency.'
      ),
    };
  }

  return { user, role, agencyId: userAgencyId, response: null };
}

/**
 * Check if user has viewer role (read-only)
 */
export async function isViewerRole(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role ? isViewer(role) : false;
}

/**
 * Check if user has admin role
 */
export async function isAdminRole(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role ? isAdmin(role) : false;
}

/**
 * Check if user has manager or admin role
 */
export async function isManagerOrAdminRole(userId: string): Promise<boolean> {
  const role = await getUserRole(userId);
  return role ? isManagerOrAdmin(role) : false;
}

/**
 * Validate that viewer cannot perform write operations
 */
export async function validateNotViewer(request: NextRequest) {
  const { user, response } = await requireAuth(request);

  if (response) {
    return { user: null, role: null, response };
  }

  const role = await getUserRole(user!.id);

  if (!role) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse('User role not found'),
    };
  }

  if (isViewer(role)) {
    return {
      user: null,
      role: null,
      response: forbiddenResponse(
        'Viewers have read-only access and cannot perform this operation'
      ),
    };
  }

  return { user, role, response: null };
}
