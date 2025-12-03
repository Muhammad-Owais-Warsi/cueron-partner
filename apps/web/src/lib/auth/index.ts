/**
 * Web Application Authentication Module
 * Provides authentication functions for Next.js App Router
 */

import { createClient } from '../supabase/client';

/**
 * Send OTP to phone number
 * Client-side function
 */
export async function sendOTP(phone: string) {
  if (!validatePhoneNumber(phone)) {
    throw new Error('Invalid phone number format');
  }

  const formattedPhone = formatPhoneNumber(phone);
  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOtp({
    phone: formattedPhone,
    options: {
      channel: 'sms',
    },
  });

  if (error) {
    throw new Error(`Failed to send OTP: ${error.message}`);
  }

  return data;
}

/**
 * Verify OTP and create session
 * Client-side function
 */
export async function signInWithEmailAndPassword(email: string, password: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Sign up with email and password (REAL IMPLEMENTATION)
 * Client-side function
 */
export async function signUpWithEmailAndPassword(email: string, password: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/**
 * Get current session (REAL IMPLEMENTATION)
 * Client-side function
 */
export async function getSession() {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return data.session;
}

/**
 * Get current user (REAL IMPLEMENTATION)
 * Client-side function
 */
export async function getCurrentUser() {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('Error getting user:', error);
    return null;
  }
  
  return data.user;
}

/**
 * Refresh session (REAL IMPLEMENTATION)
 * Client-side function
 */
export async function refreshSession() {
  const supabase = createClient();
  
  const { data, error } = await supabase.auth.refreshSession();
  
  if (error) {
    console.error('Error refreshing session:', error);
    return null;
  }
  
  return data.session;
}

/**
 * Sign out (REAL IMPLEMENTATION)
 * Client-side function
 */
export async function signOut() {
  const supabase = createClient();
  
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    console.error('Error signing out:', error);
    throw new Error(error.message);
  }
}

/**
 * Server-side authentication functions
 */

/**
 * Get current session on server
 * Server-side function (use in Server Components, Server Actions, Route Handlers)
 */
export async function getServerSession(): Promise<Session | null> {
  const supabase = await createServerClient();
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
  const supabase = await createServerClient();
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
  email?: string;
  phone?: string;
}

/**
 * Get user session with role and agency information
 * Server-side function for authorization checks
 */
export async function getUserSession(): Promise<UserSession | null> {
  const supabase = await createServerClient();
  
  // Get authenticated user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError || !user) {
    return null;
  }

  // Get user role and agency from agency_users table
  const { data: agencyUser, error: roleError } = await supabase
    .from('agency_users')
    .select('role, agency_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (roleError) {
    console.error('Error fetching user role:', roleError);
    return null;
  }

  // If no agency_users record, check if user is an engineer
  if (!agencyUser) {
    const { data: engineer, error: engineerError } = await supabase
      .from('engineers')
      .select('id, agency_id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (engineerError) {
      console.error('Error fetching engineer:', engineerError);
      return null;
    }

    if (engineer) {
      return {
        user_id: user.id,
        role: 'engineer',
        agency_id: engineer.agency_id,
        email: user.email,
        phone: user.phone,
      };
    }

    // User exists but has no role assigned
    return null;
  }

  return {
    user_id: user.id,
    role: agencyUser.role,
    agency_id: agencyUser.agency_id,
    email: user.email,
    phone: user.phone,
  };
}
