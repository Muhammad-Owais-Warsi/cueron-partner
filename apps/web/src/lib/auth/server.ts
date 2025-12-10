/**
 * Server-side Authentication Module
 * Provides SERVER-SIDE authentication functions for Next.js App Router
 * Use these in Server Components, Server Actions, and Route Handlers
 */

import { createClient as createServerClient } from '../supabase/server';
import type { Session, User } from '@supabase/supabase-js';

/**
 * Get current session on server
 * Server-side function (use in Server Components, Server Actions, Route Handlers)
 */
export async function getServerSession(): Promise<Session | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting server session:', error);
    return null;
  }

  return data.session;
}

/**
 * Get current user on server
 * Server-side function
 */
export async function getServerUser(): Promise<User | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting server user:', error);
    return null;
  }

  return data.user;
}

/**
 * Require authentication on server
 * Throws error if not authenticated
 */
export async function requireAuth(): Promise<User> {
  const user = await getServerUser();

  if (!user) {
    throw new Error('Authentication required');
  }

  return user;
}

/**
 * Check if user is authenticated on server
 */
export async function isAuthenticated(): Promise<boolean> {
  const user = await getServerUser();
  return user !== null;
}

/**
 * User session with role and agency information
 */
export interface UserSession {
  user_id: string;
  role: 'admin' | 'manager' | 'viewer' | 'engineer';
  agency_id: string | null;
  is_demo_user?: boolean;
  email?: string;
  phone?: string;
}

/**
 * Get user session with role and agency information
 * Server-side function for authorization checks
 */
export async function getUserSession(): Promise<UserSession | null> {
  const supabase = createServerClient();

  // Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  // console.log('SEVER', user);

  if (userError || !user) {
    return null;
  }

  // Get user role, agency, and demo flag from agency_users table
  const { data: agencyUser, error: roleError } = await supabase
    .from('users')
    .select(
      `role, agencies (
      id
      )`
    )
    .eq('email', user.email)
    .single();

  // console.log('AGENCY_USER', agencyUser);

  if (roleError) {
    console.error('Error fetching user role:', roleError);
    return null;
  }

  // // If no agency_users record, check if user is an engineer
  // if (!agencyUser) {
  //   const { data: engineer, error: engineerError } = await supabase
  //     .from('engineers')
  //     .select('id, agency_id')
  //     .eq('user_id', user.id)
  //     .maybeSingle();

  //   if (engineerError) {
  //     console.error('Error fetching engineer:', engineerError);
  //     return null;
  //   }

  //   if (engineer) {
  //     return {
  //       user_id: user.id,
  //       role: 'engineer',
  //       agency_id: engineer.agency_id,
  //       is_demo_user: false, // Engineers default to non-demo
  //       email: user.email,
  //       phone: user.phone,
  //     };
  //   }

  //   // User exists but has no role assigned
  //   return null;
  // }

  if (!agencyUser) {
    return null;
  }

  return {
    user_id: user.id,
    role: agencyUser.role,
    agency_id: agencyUser.agencies[0].id,
    is_demo_user: false, // Default to false if missing
    email: user.email,
    phone: user.phone,
  };
}
