/**
 * Supabase Client Configuration
 * Browser-side Supabase client for Next.js App Router
 */

import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@cueron/types';

/**
 * Create a Supabase client for use in browser/client components
 * This client uses the anon key and respects RLS policies
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/**
 * Singleton instance for client-side usage
 */
export const supabase = createClient();
