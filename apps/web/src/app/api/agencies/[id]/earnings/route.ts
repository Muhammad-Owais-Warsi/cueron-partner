/**
 * Agency Earnings API Route
 * GET /api/agencies/{id}/earnings - Get detailed earnings data
 * 
 * Provides daily, monthly, and year-to-date earnings data for the agency dashboard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { 
  assertPermission, 
  assertAgencyAccess
} from '@cueron/utils/src/authorization';
import { isDemoUser } from '@/lib/demo-data/middleware';
import { generateEarnings } from '@/lib/demo-data/generator';

/**
 * Error response helper
 */
function errorResponse(
  code: string,
  message: string,
  details?: Record<string, string[]>,
  status: number = 400
) {
  return NextResponse.json(
    {
      error: {
        code,
        message,
        details,
        timestamp: new Date().toISOString(),
        request_id: crypto.randomUUID(),
      },
    },
    { status }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any, status: number = 200) {
  return NextResponse.json(data, { status });
}

/**
 * GET /api/agencies/{id}/earnings
 * Retrieve detailed earnings data for the agency
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: agencyId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(agencyId)) {
      return errorResponse(
        'INVALID_ID',
        'Invalid agency ID format',
        undefined,
        400
      );
    }

    // Get authenticated user session
    const session = await getUserSession();
    
    if (!session) {
      return errorResponse(
        'UNAUTHORIZED',
        'Authentication required',
        undefined,
        401
      );
    }

    // Check if user has permission to read agency data
    try {
      assertPermission(session.role, 'agency:read');
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Check data isolation - user can only access their own agency
    try {
      assertAgencyAccess(session.agency_id, agencyId);
    } catch (error: any) {
      return errorResponse(
        'FORBIDDEN',
        error.message,
        undefined,
        403
      );
    }

    // Check if this is a demo user and serve generated data
    if (isDemoUser(session)) {
      try {
        const demoData = generateEarnings(session.user_id);
        
        // Build response matching the exact format of real data
        const response = {
          daily: demoData.daily,
          monthly: demoData.monthly,
          yearly: demoData.yearly,
          generated_at: new Date().toISOString(),
        };

        return successResponse(response);
      } catch (error) {
        console.error('Error generating demo earnings data:', error);
        // Fall through to real data query on error
      }
    }

    // Create Supabase client
    const supabase = await createClient();

    // Get today's date boundaries
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    // const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);

    // Fetch earnings data using the dashboard_realtime view
    const { data: realtimeData, error: realtimeError } = await supabase
      .from('dashboard_realtime')
      .select('*')
      .eq('agency_id', agencyId)
      .single();

    if (realtimeError) {
      console.error('Error fetching realtime dashboard data:', realtimeError);
      // Continue with default values
    }

    // Calculate daily earnings
    const { data: dailyEarningsData, error: dailyError } = await supabase
      .from('jobs')
      .select('service_fee')
      .eq('assigned_agency_id', agencyId)
      .eq('status', 'completed')
      .gte('completed_at', startOfDay.toISOString());

    let dailyEarnings = 0;
    if (!dailyError && dailyEarningsData) {
      dailyEarnings = dailyEarningsData.reduce((sum, job) => sum + (job.service_fee || 0), 0);
    }

    // Calculate year-to-date earnings
    const { data: ytdEarningsData, error: ytdError } = await supabase
      .from('jobs')
      .select('service_fee')
      .eq('assigned_agency_id', agencyId)
      .eq('status', 'completed')
      .gte('completed_at', startOfYear.toISOString());

    let ytdEarnings = 0;
    if (!ytdError && ytdEarningsData) {
      ytdEarnings = ytdEarningsData.reduce((sum, job) => sum + (job.service_fee || 0), 0);
    }

    // Calculate jobs completed today
    const { data: jobsTodayData, error: jobsTodayError } = await supabase
      .from('jobs')
      .select('id')
      .eq('assigned_agency_id', agencyId)
      .eq('status', 'completed')
      .gte('completed_at', startOfDay.toISOString());

    let jobsCompletedToday = 0;
    if (!jobsTodayError && jobsTodayData) {
      jobsCompletedToday = jobsTodayData.length;
    }

    // Build response
    const response = {
      daily: {
        earnings: dailyEarnings,
        jobs_completed: jobsCompletedToday,
      },
      monthly: {
        earnings: realtimeData?.monthly_revenue || 0,
        jobs_completed: realtimeData?.completed_today || 0,
      },
      yearly: {
        earnings: ytdEarnings,
        jobs_completed: 0, // We'll calculate this separately if needed
      },
      generated_at: new Date().toISOString(),
    };

    return successResponse(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/agencies/[id]/earnings:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}