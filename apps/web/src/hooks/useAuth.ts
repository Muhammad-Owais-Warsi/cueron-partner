'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  type: 'agency_user' | 'engineer';
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  is_demo_user?: boolean;
  agency?: {
    id: string;
    name: string;
    type: string;
    partnership_tier: string;
  };
}

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
    const supabase = createClient();
    
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          setState(prev => ({
            ...prev,
            error,
            loading: false,
          }));
          return;
        }
        
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Unknown error'),
          loading: false,
        }));
      }
    };
    
    getSession();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));
    });
    
    return () => {
      subscription.unsubscribe();
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
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
      console.warn('Session refresh warning:', error.message);
      return null;
    }
    
    return data.session;
  };

  const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    // Even if there's an error (like no session), still redirect to login
    if (error) {
      console.warn('Sign out warning:', error.message);
    }
    
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
  const [profile, setProfile] = useState<UserProfile | null>(null);
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
        const supabase = createClient();
        
        // Fetch user profile from agency_users table
        const { data: agencyUser, error: agencyUserError } = await supabase
          .from('agency_users')
          .select(`
            id,
            role,
            name,
            email,
            is_demo_user,
            agencies (
              id,
              name,
              type,
              partnership_tier
            )
          `)
          .eq('user_id', user.id)
          .single();
        
        if (agencyUserError) {
          console.error('Error fetching agency user:', agencyUserError);
          throw new Error('Failed to fetch user profile');
        }
        
        if (!agencyUser) {
          // User exists but has no agency association
          const userProfile: UserProfile = {
            type: 'agency_user',
            id: user.id,
            user_id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'User',
            email: user.email || '',
            role: 'user',
            is_demo_user: false,
            agency: undefined,
          };
          
          setProfile(userProfile);
          setLoading(false);
          return;
        }
        
        const userProfile: UserProfile = {
          type: 'agency_user',
          id: agencyUser.id,
          user_id: user.id,
          name: agencyUser.name,
          email: agencyUser.email,
          role: agencyUser.role,
          is_demo_user: agencyUser.is_demo_user ?? false,
          agency: agencyUser.agencies && agencyUser.agencies.length > 0 ? {
            id: agencyUser.agencies[0].id,
            name: agencyUser.agencies[0].name,
            type: agencyUser.agencies[0].type,
            partnership_tier: agencyUser.agencies[0].partnership_tier,
          } : undefined,
        };

        setProfile(userProfile);
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