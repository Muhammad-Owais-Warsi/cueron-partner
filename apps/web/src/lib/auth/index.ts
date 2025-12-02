/**
 * Web Application Authentication Module
 * Provides CLIENT-SIDE authentication functions for Next.js App Router
 * For server-side auth, import from './server'
 */

// import { createClient } from '../supabase/client'; // Unused in mock implementation
import type { Session, User } from '@supabase/supabase-js';

// Mock user data for development
const MOCK_USER: User = {
  id: 'mock-user-id',
  app_metadata: {},
  user_metadata: {
    email: 'developer@example.com',
    name: 'Developer User',
  },
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'developer@example.com',
  email_confirmed_at: new Date().toISOString(),
  phone: '',
  role: 'authenticated',
  updated_at: new Date().toISOString(),
};

const MOCK_SESSION: Session = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_in: 3600,
  token_type: 'bearer',
  user: MOCK_USER,
};

/**
 * Send magic link to email (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function sendMagicLink(email: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In a real implementation, this would send an email
  console.log(`[MOCK] Magic link would be sent to: ${email}`);
  
  // Return mock data
  return {
    user: null,
    session: null,
  };
}

/**
 * Sign in with email and password (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function signInWithEmailAndPassword(email: string, password: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate authentication logic
  if (password === 'password123') {
    console.log(`[MOCK] User ${email} signed in successfully`);
    return {
      user: MOCK_USER,
      session: MOCK_SESSION,
    };
  } else {
    throw new Error('Invalid email or password');
  }
}

/**
 * Sign up with email and password (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function signUpWithEmailAndPassword(email: string, password: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Invalid email format');
  }

  if (!password || password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log(`[MOCK] User ${email} signed up successfully`);
  
  // Return mock data
  return {
    user: MOCK_USER,
    session: MOCK_SESSION,
  };
}

/**
 * Get current session (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function getSession(): Promise<Session | null> {
  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, return a mock session
  // In a real implementation, you might check localStorage or cookies
  const hasSession = localStorage.getItem('mock-auth-session') === 'true';
  
  if (hasSession) {
    return MOCK_SESSION;
  }
  
  return null;
}

/**
 * Get current user (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function getCurrentUser(): Promise<User | null> {
  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, return a mock user
  // In a real implementation, you might check localStorage or cookies
  const hasSession = localStorage.getItem('mock-auth-session') === 'true';
  
  if (hasSession) {
    return MOCK_USER;
  }
  
  return null;
}

/**
 * Refresh session (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function refreshSession(): Promise<Session | null> {
  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, return a mock session
  const hasSession = localStorage.getItem('mock-auth-session') === 'true';
  
  if (hasSession) {
    return MOCK_SESSION;
  }
  
  return null;
}

/**
 * Sign out (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function signOut() {
  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clear mock session
  localStorage.removeItem('mock-auth-session');
  
  console.log('[MOCK] User signed out');
}

/**
 * Verify OTP code (MOCK IMPLEMENTATION)
 * Client-side function
 */
export async function verifyOTP(phone: string, otp: string) {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  if (!otp || otp.length !== 6) {
    throw new Error('OTP must be 6 digits');
  }

  // Mock implementation - simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate OTP verification logic
  // For demo, accept any 6-digit code
  if (/^\d{6}$/.test(otp)) {
    console.log(`[MOCK] OTP verified for phone: ${phone}`);
    return {
      user: MOCK_USER,
      session: MOCK_SESSION,
    };
  } else {
    throw new Error('Invalid OTP code');
  }
}