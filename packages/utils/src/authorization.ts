/**
 * Authorization and Role-Based Access Control Utilities
 * Provides helpers for permission checking, role verification, and data isolation
 */

import type { UserRole } from './auth';

/**
 * Permission definitions for different operations
 */
export type Permission =
  | 'agency:read'
  | 'agency:write'
  | 'agency:delete'
  | 'engineer:read'
  | 'engineer:write'
  | 'engineer:delete'
  | 'job:read'
  | 'job:write'
  | 'job:assign'
  | 'job:delete'
  | 'payment:read'
  | 'payment:write'
  | 'user:read'
  | 'user:write'
  | 'user:delete'
  | 'analytics:read'
  | 'settings:read'
  | 'settings:write';

/**
 * Role permission matrix
 * Defines which permissions each role has
 */
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    'agency:read',
    'agency:write',
    'agency:delete',
    'engineer:read',
    'engineer:write',
    'engineer:delete',
    'job:read',
    'job:write',
    'job:assign',
    'job:delete',
    'payment:read',
    'payment:write',
    'user:read',
    'user:write',
    'user:delete',
    'analytics:read',
    'settings:read',
    'settings:write',
  ],
  manager: [
    'agency:read',
    'engineer:read',
    'engineer:write',
    'job:read',
    'job:write',
    // 'job:assign',
    'payment:read',
    'analytics:read',
    'settings:read',
  ],
  viewer: ['agency:read', 'engineer:read', 'job:read', 'payment:read', 'analytics:read'],
  engineer: ['job:read', 'job:write'],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions.includes(permission);
}

/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every((permission) => hasPermission(role, permission));
}

/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((permission) => hasPermission(role, permission));
}

/**
 * Check if a role can read a resource
 */
export function canRead(role: UserRole, resource: string): boolean {
  const permission = `${resource}:read` as Permission;
  return hasPermission(role, permission);
}

/**
 * Check if a role can write to a resource
 */
export function canWrite(role: UserRole, resource: string): boolean {
  const permission = `${resource}:write` as Permission;
  return hasPermission(role, permission);
}

/**
 * Check if a role can delete a resource
 */
export function canDelete(role: UserRole, resource: string): boolean {
  const permission = `${resource}:delete` as Permission;
  return hasPermission(role, permission);
}

/**
 * Check if user is admin
 */
export function isAdmin(role: UserRole): boolean {
  return role === 'admin';
}

/**
 * Check if user is manager or admin
 */
export function isManagerOrAdmin(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if user is viewer (read-only)
 */
export function isViewer(role: UserRole): boolean {
  return role === 'viewer';
}

/**
 * Check if user is engineer
 */
export function isEngineer(role: UserRole): boolean {
  return role === 'engineer';
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: UserRole): Permission[] {
  return [...ROLE_PERMISSIONS[role]];
}

/**
 * Check if a role can perform write operations
 * (admin and manager only)
 */
export function canPerformWriteOperations(role: UserRole): boolean {
  return role === 'admin' || role === 'manager';
}

/**
 * Check if a role has read-only access
 * (viewer and engineer have limited write access)
 */
export function isReadOnly(role: UserRole): boolean {
  return role === 'viewer';
}

/**
 * Validate agency data isolation
 * Ensures user can only access data from their own agency
 */
export function validateDataIsolation(
  userAgencyId: string | null,
  resourceAgencyId: string | null
): boolean {
  // If either is null, deny access
  if (!userAgencyId || !resourceAgencyId) {
    return false;
  }

  // User can only access resources from their own agency
  return userAgencyId === resourceAgencyId;
}

/**
 * Check if user can access a specific agency's data
 */
export function canAccessAgencyData(userAgencyId: string | null, targetAgencyId: string): boolean {
  return validateDataIsolation(userAgencyId, targetAgencyId);
}

/**
 * Authorization error types
 */
export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTHORIZATION_ERROR'
  ) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class InsufficientPermissionsError extends AuthorizationError {
  constructor(requiredPermission: Permission) {
    super(`Insufficient permissions. Required: ${requiredPermission}`, 'INSUFFICIENT_PERMISSIONS');
  }
}

export class DataIsolationError extends AuthorizationError {
  constructor() {
    super(
      'Access denied. You can only access data from your own agency.',
      'DATA_ISOLATION_VIOLATION'
    );
  }
}

/**
 * Assert that user has required permission
 * Throws error if permission is not granted
 */
export function assertPermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new InsufficientPermissionsError(permission);
  }
}

/**
 * Assert that user can access agency data
 * Throws error if data isolation is violated
 */
export function assertAgencyAccess(userAgencyId: string | null, targetAgencyId: string): void {
  if (!canAccessAgencyData(userAgencyId, targetAgencyId)) {
    throw new DataIsolationError();
  }
}

/**
 * Role hierarchy for comparison
 * Higher number = more permissions
 */
const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  viewer: 1,
  engineer: 0,
};

/**
 * Check if a role has equal or higher privileges than another role
 */
export function hasEqualOrHigherRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Get role hierarchy level
 */
export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role];
}
