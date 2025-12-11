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
  const supabase = await createServerClient();

  // 1. Get authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  console.log('SERVER USER:', user);

  if (userError || !user) return null;

  // 2. Fetch user role from `users` table
  const { data: userRecord, error: roleErr } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (roleErr || !userRecord) {
    console.error('Error fetching user role:', roleErr);
    return null;
  }

  const role = userRecord.role as 'admin' | 'manager' | 'engineer';

  // ----------------------------
  // ⭐ ROLE: ADMIN
  // ----------------------------
  if (role === 'admin') {
    return {
      user_id: user.id,
      email: user.email,
      role: 'admin',
      is_demo_user: false,
      phone: user.phone,
    };
  }

  // ----------------------------
  // ⭐ ROLE: MANAGER → lookup agency
  // ----------------------------
  if (role === 'manager') {
    const { data: agency, error: agencyErr } = await supabase
      .from('agencies')
      .select('id')
      .eq('email', user.email)
      .single();

    if (agencyErr || !agency) {
      console.error("Error fetching manager's agency:", agencyErr);
      return null;
    }

    return {
      user_id: user.id,
      email: user.email,
      role: 'manager',
      agency_id: agency.id,
      is_demo_user: false,
      phone: user.phone,
    };
  }

  // ----------------------------
  // ⭐ ROLE: ENGINEER → lookup engineer record
  // ----------------------------
  if (role === 'engineer') {
    const { data: engineer, error: engErr } = await supabase
      .from('engineers')
      .select('id, agency_id')
      .eq('user_id', user.id)
      .single();

    if (engErr || !engineer) {
      console.error('Error fetching engineer profile:', engErr);
      return null;
    }

    return {
      user_id: user.id,
      email: user.email,
      role: 'engineer',
      engineer_id: engineer.id,
      agency_id: engineer.agency_id,
      is_demo_user: false,
      phone: user.phone,
    };
  }

  // Should never reach here
  return null;
}
