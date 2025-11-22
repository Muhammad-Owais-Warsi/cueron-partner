/**
 * React Query hooks for job data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Job, JobStatus } from '@cueron/types/src/job';

/**
 * Fetch jobs assigned to the current engineer
 */
export function useEngineerJobs(engineerId: string | null) {
  return useQuery({
    queryKey: ['engineer-jobs', engineerId],
    queryFn: async () => {
      if (!engineerId) {
        throw new Error('Engineer ID is required');
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('assigned_engineer_id', engineerId)
        .in('status', ['assigned', 'accepted', 'travelling', 'onsite'])
        .order('scheduled_time', { ascending: true });

      if (error) {
        console.error('Error fetching engineer jobs:', error);
        throw error;
      }

      return data as Job[];
    },
    enabled: !!engineerId,
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
  });
}

/**
 * Fetch a single job by ID
 */
export function useJob(jobId: string | null) {
  return useQuery({
    queryKey: ['job', jobId],
    queryFn: async () => {
      if (!jobId) {
        throw new Error('Job ID is required');
      }

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Error fetching job:', error);
        throw error;
      }

      return data as Job;
    },
    enabled: !!jobId,
    staleTime: 10000, // 10 seconds
  });
}

/**
 * Update job status (e.g., accept job)
 * Uses the API endpoint for proper status history and real-time updates
 * Requirements: 6.1, 6.2, 6.3
 */
export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation<
    Job,
    Error,
    {
      jobId: string;
      status: JobStatus;
      location?: { lat: number; lng: number };
      notes?: string;
    }
  >({
    mutationFn: async ({
      jobId,
      status,
      location,
      notes,
    }) => {
      // Get the API URL from environment or use default
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the API endpoint
      const response = await fetch(`${apiUrl}/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          status,
          location,
          notes,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update job status');
      }

      const result = await response.json();
      const updatedJob = result.job as Job;
      return updatedJob;
    },
    onSuccess: (job: Job) => {
      // Invalidate and refetch job queries
      queryClient.invalidateQueries({ queryKey: ['job', job.id] });
      queryClient.invalidateQueries({ queryKey: ['engineer-jobs'] });
    },
  });
}

/**
 * Update engineer location
 * Requirements: 9.1, 9.2
 */
export function useUpdateEngineerLocation() {
  return useMutation({
    mutationFn: async ({
      engineerId,
      location,
    }: {
      engineerId: string;
      location: { lat: number; lng: number };
    }) => {
      // Get the API URL from environment or use default
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

      // Get current session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      // Call the API endpoint
      const response = await fetch(`${apiUrl}/api/engineers/${engineerId}/location`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          location,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update location');
      }

      const result = await response.json();
      return result;
    },
  });
}

/**
 * Get engineer ID from current user
 */
export async function getCurrentEngineerId(): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Fetch engineer record linked to this user
  const { data: engineer, error } = await supabase
    .from('engineers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (error || !engineer) {
    console.error('Error fetching engineer ID:', error);
    return null;
  }

  return (engineer as { id: string }).id;
}
