/**
 * Supabase Client Configuration for React Native
 */

import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from '@cueron/types';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

/**
 * Supabase client for React Native
 * Uses AsyncStorage for session persistence
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

/**
 * Helper function to get the current user
 */
export async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    console.error('Error getting current user:', error);
    return null;
  }

  return user;
}

/**
 * Helper function to get the current session
 */
export async function getCurrentSession() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error getting current session:', error);
    return null;
  }

  return session;
}

/**
 * Helper function to sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    throw error;
  }
}

/**
 * Helper function to send OTP
 */
export async function sendOTP(phone: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone,
  });

  if (error) {
    console.error('Error sending OTP:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to verify OTP
 */
export async function verifyOTP(phone: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone,
    token,
    type: 'sms',
  });

  if (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }

  return data;
}

/**
 * Helper function to refresh session
 */
export async function refreshSession() {
  const { data, error } = await supabase.auth.refreshSession();

  if (error) {
    console.error('Error refreshing session:', error);
    throw error;
  }

  return data.session;
}

/**
 * Check if session is valid
 */
export async function isSessionValid(): Promise<boolean> {
  const session = await getCurrentSession();
  
  if (!session) return false;
  
  const expiresAt = session.expires_at;
  if (!expiresAt) return false;
  
  const now = Math.floor(Date.now() / 1000);
  return expiresAt > now;
}
