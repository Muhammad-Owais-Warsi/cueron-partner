/**
 * Custom hook for real-time earnings updates
 * Handles Supabase Realtime subscriptions for earnings data
 */

'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { EarningsData } from '@/types/dashboard';

export function useRealtimeEarnings(agencyId: string | undefined) {
  const [earnings, setEarnings] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEarnings = useCallback(async () => {
    if (!agencyId) return;

    try {
      setLoading(true);
      
      const response = await fetch(`/api/agencies/${agencyId}/earnings`);
      
      if (!response.ok) {
        throw new Error('Failed to load earnings data');
      }

      const data = await response.json();
      setEarnings(data);
    } catch (err) {
      console.error('Error loading earnings:', err);
      setError(err instanceof Error ? err.message : 'Failed to load earnings');
    } finally {
      setLoading(false);
    }
  }, [agencyId]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  useEffect(() => {
    if (!agencyId) return;

    const supabase = createClient();
    
    // Subscribe to real-time job updates that affect earnings
    const channel = supabase
      .channel('earnings-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'jobs',
          filter: `assigned_agency_id=eq.${agencyId}`,
        },
        (_payload) => {
          // Refresh earnings when job status changes (especially when completed)
          if (_payload.new.status === 'completed' || _payload.old.status === 'completed') {
            loadEarnings();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'jobs',
          filter: `assigned_agency_id=eq.${agencyId}`,
        },
        () => {
          // Refresh earnings when new job is added
          loadEarnings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agencyId, loadEarnings]);

  return {
    earnings,
    loading,
    error,
    refresh: loadEarnings,
  };
}