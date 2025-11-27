/**
 * Test utility for verifying real-time functionality
 * This file helps test and debug Supabase Realtime subscriptions
 */

import { createClient } from '@/lib/supabase/client';

export async function testRealtimeConnection(agencyId: string) {
  const supabase = createClient();
  
  console.log('Testing real-time connection for agency:', agencyId);
  
  // Subscribe to job updates
  const channel = supabase
    .channel('test-job-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'jobs',
        filter: `assigned_agency_id=eq.${agencyId}`,
      },
      (payload) => {
        console.log('Real-time job update received:', payload);
      }
    )
    .subscribe((status) => {
      console.log('Subscription status:', status);
    });
  
  // Test broadcast
  setTimeout(async () => {
    try {
      const result = await supabase
        .from('jobs')
        .select('id, job_number, status')
        .eq('assigned_agency_id', agencyId)
        .limit(1);
        
      if (result.data && result.data.length > 0) {
        console.log('Test job data:', result.data[0]);
      }
    } catch (error) {
      console.error('Error fetching test data:', error);
    }
  }, 2000);
  
  return channel;
}