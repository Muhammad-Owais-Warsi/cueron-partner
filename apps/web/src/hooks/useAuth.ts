'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface UserProfile {
  // type: 'manager' | 'engineer';
  // id: string;
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
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          setState((prev) => ({
            ...prev,
            error,
            loading: false,
          }));
          return;
        }

        setState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          error: error instanceof Error ? error : new Error('Unknown error'),
          loading: false,
        }));
      }
    };

    getSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState((prev) => ({
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

        // fetch the role of the signed-in user
        const { data, error } = await supabase
          .from('users')
          .select(`email, role`)
          .eq('id', user.id)
          .single();

        if (error || !data) {
          setProfile(null);
          setLoading(false);
          return;
        }

        console.log('SIGNED IN USER', data);

        switch (data.role) {
          case 'admin':
            setProfile({
              user_id: user.id,
              name:
                user?.raw_user_metadata?.firstName + user?.raw_user_metadata?.lastName ||
                user?.user_metadata?.firstName + user?.user_metadata?.lastName ||
                'ADMIN',
              email: user?.email,
              role: 'admin',
              is_demo_user: false,
              agency: undefined,
            });
            setLoading(false);
            break;
          case 'manager':
            const agencyProfile = await getAgencyManagerProfile(user);
            if (agencyProfile) {
              setProfile(agencyProfile);
              setLoading(false);
            }
            break;
          case 'engineer':
            const engineerProfile = await getEngineerProfile(user);
            if (engineerProfile) {
              setProfile(engineerProfile);
              setLoading(false);
            }
            break;
        }
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

async function getEngineerProfile(user: any) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('engineers')
    .select(
      `
      name,
      email,
      agencies (
        id,
        name,
        type,
        partnership_tier
      )
    `
    )
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    return;
  }

  const agency = data.agencies
    ? {
        id: data.agencies.id,
        name: data.agencies.name,
        type: data.agencies.type,
        partnership_tier: data.agencies.partnership_tier,
      }
    : null;

  const profile: UserProfile = {
    user_id: user.id,
    name: data.name,
    email: data.email,
    role: 'engineer',
    is_demo_user: false,
    agency, // ⭐ Now safely nullable
  };

  return profile;
}

async function getAgencyManagerProfile(user: any) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('agencies')
    .select(`id, name, contact_person, email, type, partnership_tier`)
    .eq('email', user.email)
    .single();

  if (error || !data) {
    return;
  }

  const profile: UserProfile = {
    user_id: user.id,
    name: data?.contact_person,
    email: data?.email,
    role: 'manager',
    is_demo_user: false,
    agency: {
      id: data?.id,
      name: data?.name,
      type: data?.type,
      partnership_tier: data?.partnership_tier,
    },
  };

  return profile;
}
