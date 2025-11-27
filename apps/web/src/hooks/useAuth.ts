'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User, Session } from '@supabase/supabase-js';

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

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for managing authentication state (MOCK IMPLEMENTATION)
 * Provides current user, session, and loading state
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Check for mock session in localStorage
    const hasMockSession = localStorage.getItem('mock-auth-session') === 'true';
    
    if (hasMockSession) {
      setState({
        user: MOCK_USER,
        session: MOCK_SESSION,
        loading: false,
        error: null,
      });
    } else {
      setState({
        user: null,
        session: null,
        loading: false,
        error: null,
      });
    }

    // Listen for storage changes (simulating auth state changes)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'mock-auth-session') {
        if (e.newValue === 'true') {
          setState({
            user: MOCK_USER,
            session: MOCK_SESSION,
            loading: false,
            error: null,
          });
        } else {
          setState({
            user: null,
            session: null,
            loading: false,
            error: null,
          });
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return state;
}

/**
 * Hook for requiring authentication (MOCK IMPLEMENTATION)
 * Redirects to login if not authenticated
 */
export function useRequireAuth(redirectTo: string = '/login') {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  return { user, loading };
}

/**
 * Hook for session management (MOCK IMPLEMENTATION)
 * Provides session refresh and sign out functions
 */
export function useSession() {
  const { session, loading } = useAuth();
  const router = useRouter();

  const refreshSession = async () => {
    // Mock implementation - simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For demo purposes, return a mock session
    const hasSession = localStorage.getItem('mock-auth-session') === 'true';
    
    if (hasSession) {
      return MOCK_SESSION;
    }
    
    return null;
  };

  const signOut = async () => {
    // Mock implementation - simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Clear mock session
    localStorage.removeItem('mock-auth-session');
    
    router.push('/login');
    router.refresh();
  };

  return {
    session,
    loading,
    refreshSession,
    signOut,
  };
}

/**
 * Hook for user profile data (MOCK IMPLEMENTATION)
 * Fetches additional user information from database
 */
export function useUserProfile() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        // Mock implementation - simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock profile data
        const mockProfile = {
          type: 'agency_user',
          id: 'mock-profile-id',
          user_id: 'mock-user-id',
          name: 'Developer User',
          email: 'developer@example.com',
          role: 'admin',
          agency: {
            id: 'mock-agency-id',
            name: 'Demo Agency',
            type: 'premium',
            partnership_tier: 'gold',
          },
        };

        setProfile(mockProfile);
        setLoading(false);
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return {
    user,
    profile,
    loading: authLoading || loading,
    error,
  };
}