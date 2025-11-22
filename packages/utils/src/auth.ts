/**
 * Authentication Utilities
 * Provides authentication helpers for OTP, session management, and JWT handling
 */

import type { Session, User } from '@supabase/supabase-js';

/**
 * Phone number validation
 */
export function validatePhoneNumber(phone: string): boolean {
  // Indian phone number: 10 digits
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.trim());
}

/**
 * Format phone number for Supabase Auth
 * Adds +91 country code if not present
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.trim().replace(/\D/g, '');
  
  if (cleaned.startsWith('91') && cleaned.length === 12) {
    return `+${cleaned}`;
  }
  
  if (cleaned.length === 10) {
    return `+91${cleaned}`;
  }
  
  throw new Error('Invalid phone number format');
}

/**
 * OTP validation
 */
export function validateOTP(otp: string): boolean {
  // OTP should be 6 digits
  const otpRegex = /^\d{6}$/;
  return otpRegex.test(otp.trim());
}

/**
 * Session validation
 */
export function isSessionValid(session: Session | null): boolean {
  if (!session) return false;
  
  const expiresAt = session.expires_at;
  if (!expiresAt) return false;
  
  // Check if session is expired
  const now = Math.floor(Date.now() / 1000);
  
  return expiresAt > now;
}

/**
 * Check if session needs refresh
 * Returns true if session expires in less than 10 minutes
 */
export function shouldRefreshSession(session: Session | null): boolean {
  if (!session) return false;
  
  const expiresAt = session.expires_at;
  if (!expiresAt) return false;
  
  const now = Math.floor(Date.now() / 1000);
  const refreshThreshold = 10 * 60; // 10 minutes
  
  return expiresAt <= (now + refreshThreshold);
}

/**
 * Extract user ID from JWT token
 */
export function extractUserIdFromToken(token: string): string | null {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Decode payload (base64url)
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );
    
    return payload.sub || null;
  } catch {
    return null;
  }
}

/**
 * Check if JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return true;
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );
    
    const exp = payload.exp;
    if (!exp) return true;
    
    const now = Math.floor(Date.now() / 1000);
    return exp < now;
  } catch {
    return true;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf-8')
    );
    
    return payload.exp || null;
  } catch {
    return null;
  }
}

/**
 * Session storage keys
 */
export const SESSION_STORAGE_KEY = 'cueron-auth-session';
export const REFRESH_TOKEN_KEY = 'cueron-refresh-token';

/**
 * Session persistence helpers for client-side storage
 */
export interface StoredSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

/**
 * Serialize session for storage
 */
export function serializeSession(session: Session): string {
  const stored: StoredSession = {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_at: session.expires_at || 0,
    user: session.user,
  };
  
  return JSON.stringify(stored);
}

/**
 * Deserialize session from storage
 */
export function deserializeSession(data: string): Session | null {
  try {
    const stored: StoredSession = JSON.parse(data);
    
    return {
      access_token: stored.access_token,
      refresh_token: stored.refresh_token,
      expires_at: stored.expires_at,
      expires_in: stored.expires_at - Math.floor(Date.now() / 1000),
      user: stored.user,
      token_type: 'bearer',
    };
  } catch {
    return null;
  }
}

/**
 * Role-based access control helpers
 * NOTE: These are deprecated - use functions from authorization.ts instead
 */
export type UserRole = 'admin' | 'manager' | 'viewer' | 'engineer';
