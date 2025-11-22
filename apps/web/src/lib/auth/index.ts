/**
 * Web Application Authentication Module
 * Provides CLIENT-SIDE authentication functions for Next.js App Router
 * For server-side auth, import from './server'
 */

import { createClient } from '../supabase/client';
import { formatPhoneNumber, validatePhoneNumber, validateOTP } from '@cueron/utils';
import type { Session, User } from '@supabase/supabase-js';

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
 * Send magic link to email
 * Client-side function
 */
export async function sendMagicLink(email: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  const supabase = createClient();

  const { data, error } = await supabase.auth.signInWithOtp({
    email: email.toLowerCase().trim(),
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(`Failed to send magic link: ${error.message}`);
  }

  return data;
}

/**
 * Verify OTP and create session
 * Client-side function
 */
export async function verifyOTP(phone: string, token: string) {
  if (!validatePhoneNumber(phone)) {
    throw new Error('Invalid phone number format');
  }

  if (!validateOTP(token)) {
    throw new Error('Invalid OTP format');
  }

  const formattedPhone = formatPhoneNumber(phone);
  const supabase = createClient();

  const { data, error } = await supabase.auth.verifyOtp({
    phone: formattedPhone,
    token,
    type: 'sms',
  });

  if (error) {
    throw new Error(`Failed to verify OTP: ${error.message}`);
  }

  return data;
}

/**
 * Get current session
 * Client-side function
 */
export async function getSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting session:', error);
    return null;
  }

  return data.session;
}

/**
 * Get current user
 * Client-side function
 */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting user:', error);
    return null;
  }

  return data.user;
}

/**
 * Refresh session
 * Client-side function
 */
export async function refreshSession(): Promise<Session | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    console.error('Error refreshing session:', error);
    return null;
  }

  return data.session;
}

/**
 * Sign out
 * Client-side function
 */
export async function signOut() {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw new Error(`Failed to sign out: ${error.message}`);
  }
}
