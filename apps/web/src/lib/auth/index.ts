/**
 * Web Application Authentication Module
 * Provides CLIENT-SIDE authentication functions for Next.js App Router
 * For server-side auth, import from './server'
 */

import { createClient } from '../supabase/client';

/**
 * Send magic link to email (REAL IMPLEMENTATION)
 * Client-side function
 */
export async function sendMagicLink(email: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
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
 * Sign in with email and password (REAL IMPLEMENTATION)
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
 * Verify OTP code (REAL IMPLEMENTATION)
 * Client-side function
 */
export async function verifyOTP(email: string, otp: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Email is required');
  }

  if (!otp || otp.length !== 6) {
    throw new Error('OTP must be 6 digits');
  }

  const supabase = createClient();
  
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token: otp,
    type: 'magiclink',
  });

  if (error) {
    throw new Error(error.message);
  }

  return data;
}