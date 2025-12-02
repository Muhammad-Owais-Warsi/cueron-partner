/**
 * Demo Data Detection Middleware
 * Provides utilities for detecting demo users and routing data requests
 */

import { NextResponse } from 'next/server';
import type { UserSession } from '../auth/server';

/**
 * Check if the current session belongs to a demo user
 * 
 * @param session - User session object from getUserSession()
 * @returns true if user is a demo user, false otherwise
 * 
 * Error Handling:
 * - Returns false if session is null or undefined
 * - Returns false if is_demo_user flag is missing (defaults to non-demo)
 * - Returns false if is_demo_user has invalid value (not boolean)
 */
export function isDemoUser(session: UserSession | null): boolean {
  // Handle null or undefined session
  if (!session) {
    return false;
  }

  // Handle missing demo flag (default to false)
  if (session.is_demo_user === undefined || session.is_demo_user === null) {
    return false;
  }

  // Handle invalid flag value (must be boolean)
  if (typeof session.is_demo_user !== 'boolean') {
    console.warn('Invalid is_demo_user flag value:', session.is_demo_user);
    return false;
  }

  return session.is_demo_user;
}

/**
 * Get demo data or execute real data query based on session
 * 
 * This helper function routes data requests to either the demo data generator
 * or the real database query based on whether the user is a demo user.
 * 
 * @param session - User session object from getUserSession()
 * @param demoDataFn - Function that generates demo data (synchronous)
 * @param realDataFn - Async function that queries real data from database
 * @returns Promise resolving to either demo data or real data
 * 
 * @example
 * ```typescript
 * const earnings = await getDemoOrRealData(
 *   session,
 *   () => generateEarnings(session.user_id),
 *   async () => {
 *     const { data } = await supabase
 *       .from('earnings')
 *       .select('*')
 *       .eq('agency_id', session.agency_id);
 *     return data;
 *   }
 * );
 * ```
 */
export async function getDemoOrRealData<T>(
  session: UserSession | null,
  demoDataFn: () => T,
  realDataFn: () => Promise<T>
): Promise<T> {
  if (isDemoUser(session)) {
    try {
      // Generate demo data synchronously
      return demoDataFn();
    } catch (error) {
      console.error('Error generating demo data:', error);
      // Fall back to real data query on error
      console.warn('Falling back to real data query due to demo data generation error');
      return realDataFn();
    }
  }

  // Execute real data query for non-demo users
  return realDataFn();
}

/**
 * Prevent write operations for demo users
 * 
 * This function checks if the current session belongs to a demo user and
 * returns a 403 Forbidden response if they attempt a write operation.
 * 
 * @param session - User session object from getUserSession()
 * @returns NextResponse with 403 error if demo user, null otherwise
 * 
 * @example
 * ```typescript
 * export async function POST(request: NextRequest) {
 *   const session = await getUserSession();
 *   
 *   // Check if demo user and prevent write
 *   const demoError = preventDemoUserWrites(session);
 *   if (demoError) return demoError;
 *   
 *   // Continue with write operation...
 * }
 * ```
 * 
 * Requirements: 3.5
 */
export function preventDemoUserWrites(session: UserSession | null): NextResponse | null {
  if (isDemoUser(session)) {
    return NextResponse.json(
      {
        error: 'DEMO_USER_WRITE_FORBIDDEN',
        message: 'Demo users cannot perform write operations. This is a read-only demo account.',
      },
      { status: 403 }
    );
  }
  
  return null;
}
