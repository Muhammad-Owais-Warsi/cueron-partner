/**
 * Supabase Client Configuration
 * Browser-side Supabase client for Next.js App Router
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@cueron/types';

// Debug logging
if (typeof window !== 'undefined') {
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/**
 * Create a Supabase client for use in browser/client components
 * This client uses the anon key and respects RLS policies
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }
  
  if (!supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable');
  }
  
  try {
    return createBrowserClient<Database>(
      supabaseUrl,
      supabaseAnonKey
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    throw error;
  }
}

/**
 * Singleton instance for client-side usage
 */
export const supabase = createClient();