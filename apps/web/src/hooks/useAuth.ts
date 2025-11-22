'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for managing authentication state
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        setState({
          user: null,
          session: null,
          loading: false,
          error,
        });
        return;
      }

      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({
        user: session?.user ?? null,
        session,
        loading: false,
        error: null,
      });
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return state;
}

/**
 * Hook for requiring authentication
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
 * Hook for session management
 * Provides session refresh and sign out functions
 */
export function useSession() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const supabase = createClient();

  const refreshSession = async () => {
    const { data, error } = await supabase.auth.refreshSession();
    if (error) {
      console.error('Error refreshing session:', error);
      return null;
    }
    return data.session;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
 * Hook for user profile data
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
        const supabase = createClient();

        // Check if user is an engineer
        const { data: engineer } = await supabase
          .from('engineers')
          .select('*, agency:agencies(name)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (engineer) {
          setProfile({
            type: 'engineer',
            ...engineer,
          });
          setLoading(false);
          return;
        }

        // Check if user is an agency user
        const { data: agencyUser } = await supabase
          .from('agency_users')
          .select('*, agency:agencies(name, type, partnership_tier)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (agencyUser) {
          setProfile({
            type: 'agency_user',
            ...agencyUser,
          });
          setLoading(false);
          return;
        }

        // No profile found
        setProfile(null);
        setLoading(false);
      } catch (err) {
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
