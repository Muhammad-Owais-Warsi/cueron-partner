/**
 * Custom hook for real-time job updates
 * Handles Supabase Realtime subscriptions for job data
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Job } from '@cueron/types';

export function useRealtimeJobs(agencyId: string | undefined) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadJobs = useCallback(async () => {
    if (!agencyId) return;

    try {
      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('assigned_agency_id', agencyId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  useEffect(() => {
    if (!agencyId) return;

    const supabase = createClient();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('jobs-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `assigned_agency_id=eq.${agencyId}`,
        },
        (_payload) => {
          // Handle real-time updates
          loadJobs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, loadJobs]);

  return {
    jobs,
    loading,
    error,
    refresh: loadJobs,
  };
}