/**
 * React Query hooks for engineer profile and performance data
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type { Engineer } from '@cueron/types/src/engineer';

/**
 * Engineer performance data interface
 */
export interface EngineerPerformance {
  engineer_id: string;
  engineer_name: string;
  period: string;
  performance_summary: {
    total_jobs_completed: number;
    total_jobs_cancelled: number;
    success_rate: number;
    average_rating: number;
    total_ratings: number;
    revenue_generated: number;
  };
  rating_details: {
    average_rating: number;
    total_ratings: number;
    rating_distribution: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  job_history: Array<{
    job_id: string;
    job_number: string;
    job_type: string;
    client_name: string;
    completed_at: string;
    client_rating: number | null;
    client_feedback: string | null;
    service_fee: number | null;
    site_location: any;
  }>;
  certifications: Array<{
    type: string;
    level: number;
    cert_number: string;
    verified: boolean;
    issued_date?: string;
  }>;
  performance_by_job_type: Array<{
    job_type: string;
    total_jobs: number;
    average_rating: number;
    total_revenue: number;
  }>;
  monthly_trend: Array<{
    month: string;
    jobs_completed: number;
    average_rating: number;
    revenue: number;
  }>;
  engineer_details: {
    skill_level: number;
    specializations: string[];
    employment_type: string;
    availability_status: string;
  };
  generated_at: string;
}

/**
 * Fetch engineer profile data
 * Requirement: 15.1, 15.5
 */
export function useEngineerProfile(engineerId: string | null) {
  return useQuery({
    queryKey: ['engineer-profile', engineerId],
    queryFn: async () => {
      if (!engineerId) {
        throw new Error('Engineer ID is required');
      }

      const { data, error } = await supabase
        .from('engineers')
        .select('*')
        .eq('id', engineerId)
        .single();

      if (error) {
        console.error('Error fetching engineer profile:', error);
        throw error;
      }

      return data as Engineer;
    },
    enabled: !!engineerId,
    staleTime: 60000, // 1 minute
  });
}

/**
 * Fetch engineer performance data
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */
export function useEngineerPerformance(
  engineerId: string | null,
  period: 'week' | 'month' | 'quarter' | 'year' | 'all' = 'month'
) {
  return useQuery({
    queryKey: ['engineer-performance', engineerId, period],
    queryFn: async () => {
      if (!engineerId) {
        throw new Error('Engineer ID is required');
      }

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
      const response = await fetch(
        `${apiUrl}/api/engineers/${engineerId}/performance?period=${period}&include_history=true`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch performance data');
      }

      const result = await response.json();
      return result as EngineerPerformance;
    },
    enabled: !!engineerId,
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Update engineer availability status
 * Requirement: 2.4
 */
export function useUpdateAvailability() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      engineerId,
      availabilityStatus,
    }: {
      engineerId: string;
      availabilityStatus: 'available' | 'offline' | 'on_leave';
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
      const response = await fetch(`${apiUrl}/api/engineers/${engineerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          availability_status: availabilityStatus,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update availability');
      }

      const result = await response.json();
      return result.engineer as Engineer;
    },
    onSuccess: (data) => {
      // Invalidate and refetch engineer profile
      queryClient.invalidateQueries({ queryKey: ['engineer-profile', data.id] });
    },
  });
}

/**
 * Upload engineer profile photo
 */
export function useUploadProfilePhoto() {
  const queryClient = useQueryClient();

  return useMutation<Engineer, Error, { engineerId: string; photoUri: string }>({
    mutationFn: async ({
      engineerId,
      photoUri,
    }) => {
      // Get file extension from URI
      const fileExt = photoUri.split('.').pop();
      const fileName = `${engineerId}-${Date.now()}.${fileExt}`;
      const filePath = `profile-photos/${fileName}`;

      // Convert URI to blob for upload
      const response = await fetch(photoUri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('engineer-photos')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true,
        });

      if (uploadError) {
        console.error('Error uploading photo:', uploadError);
        throw uploadError;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('engineer-photos').getPublicUrl(filePath);

      // Update engineer record with photo URL
      const { data, error: updateError } = await supabase
        .from('engineers')
        // @ts-ignore - Supabase type inference issue with update
        .update({ photo_url: publicUrl })
        .eq('id', engineerId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating engineer photo URL:', updateError);
        throw updateError;
      }

      if (!data) {
        throw new Error('Engineer not found after update');
      }

      const updatedEngineer = data as Engineer;
      return updatedEngineer;
    },
    onSuccess: (engineer: Engineer) => {
      // Invalidate and refetch engineer profile
      queryClient.invalidateQueries({ queryKey: ['engineer-profile', engineer.id] });
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
