/**
 * Engineer Performance Tracking API Route
 * GET /api/engineers/{id}/performance - Get engineer performance metrics
 * 
 * Provides comprehensive performance data including success rate calculation,
 * job completion tracking, rating aggregation, and performance history.
 * 
 * Requirements: 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { hasPermission } from '@cueron/utils/src/authorization';

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
 * GET /api/engineers/{id}/performance
 * Retrieve engineer performance metrics and history
 * 
 * Query Parameters:
 * - period: 'week' | 'month' | 'quarter' | 'year' | 'all' (default: 'month')
 * - include_history: 'true' | 'false' (default: 'true')
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: engineerId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(engineerId)) {
      return errorResponse(
        'INVALID_ID',
        'Invalid engineer ID format',
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

    // Check if user has permission to read engineer data
    if (!hasPermission(session.role, 'engineer:read')) {
      return errorResponse(
        'FORBIDDEN',
        `Insufficient permissions: engineer:read required`,
        undefined,
        403
      );
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const includeHistory = searchParams.get('include_history') !== 'false';

    // Validate parameters
    if (!['week', 'month', 'quarter', 'year', 'all'].includes(period)) {
      return errorResponse(
        'INVALID_PARAMETER',
        'Invalid period parameter. Must be week, month, quarter, year, or all',
        undefined,
        400
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Fetch engineer details
    const { data: engineer, error: engineerError } = await supabase
      .from('engineers')
      .select('*')
      .eq('id', engineerId)
      .single();

    if (engineerError || !engineer) {
      return errorResponse(
        'NOT_FOUND',
        'Engineer not found',
        undefined,
        404
      );
    }

    // Check data isolation - user can only access engineers from their agency
    if (session.agency_id !== engineer.agency_id) {
      return errorResponse(
        'FORBIDDEN',
        'Access denied: You can only view engineers from your agency',
        undefined,
        403
      );
    }

    // Calculate date range based on period
    const dateRange = calculateDateRange(period);

    // Fetch job history for the engineer
    let jobHistoryQuery = supabase
      .from('jobs')
      .select('*')
      .eq('assigned_engineer_id', engineerId)
      .in('status', ['completed', 'cancelled']);

    if (dateRange.from) {
      jobHistoryQuery = jobHistoryQuery.gte('completed_at', dateRange.from);
    }

    if (dateRange.to) {
      jobHistoryQuery = jobHistoryQuery.lte('completed_at', dateRange.to);
    }

    const { data: jobs, error: jobsError } = await jobHistoryQuery.order('completed_at', { ascending: false });

    if (jobsError) {
      console.error('Error fetching job history:', jobsError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to fetch job history',
        undefined,
        500
      );
    }

    // Calculate success rate
    const completedJobs = jobs?.filter(j => j.status === 'completed') || [];
    const cancelledJobs = jobs?.filter(j => j.status === 'cancelled') || [];
    const totalJobs = completedJobs.length + cancelledJobs.length;
    const successRate = totalJobs > 0 
      ? (completedJobs.length / totalJobs) * 100 
      : 0;

    // Calculate rating aggregation
    const jobsWithRatings = completedJobs.filter(j => j.client_rating !== null && j.client_rating !== undefined);
    const totalRatings = jobsWithRatings.length;
    const averageRating = totalRatings > 0
      ? jobsWithRatings.reduce((sum, j) => sum + (j.client_rating || 0), 0) / totalRatings
      : 0;

    // Calculate rating distribution
    const ratingDistribution = {
      5: jobsWithRatings.filter(j => j.client_rating === 5).length,
      4: jobsWithRatings.filter(j => j.client_rating === 4).length,
      3: jobsWithRatings.filter(j => j.client_rating === 3).length,
      2: jobsWithRatings.filter(j => j.client_rating === 2).length,
      1: jobsWithRatings.filter(j => j.client_rating === 1).length,
    };

    // Calculate revenue generated (if service fees are available)
    const revenueGenerated = completedJobs.reduce((sum, j) => sum + (j.service_fee || 0), 0);

    // Prepare job history with ratings and feedback
    const jobHistory = includeHistory ? completedJobs.map(job => ({
      job_id: job.id,
      job_number: job.job_number,
      job_type: job.job_type,
      client_name: job.client_name,
      completed_at: job.completed_at,
      client_rating: job.client_rating,
      client_feedback: job.client_feedback,
      service_fee: job.service_fee,
      site_location: job.site_location,
    })) : [];

    // Calculate performance metrics by job type
    const performanceByJobType = calculatePerformanceByJobType(completedJobs);

    // Calculate monthly performance trend
    const monthlyTrend = calculateMonthlyTrend(completedJobs);

    // Build response
    const response = {
      engineer_id: engineerId,
      engineer_name: engineer.name,
      period,
      
      // Core performance metrics (Requirement 15.1)
      performance_summary: {
        total_jobs_completed: completedJobs.length,
        total_jobs_cancelled: cancelledJobs.length,
        success_rate: parseFloat(successRate.toFixed(2)), // Requirement 15.2
        average_rating: parseFloat(averageRating.toFixed(2)),
        total_ratings: totalRatings,
        revenue_generated: revenueGenerated,
      },
      
      // Rating details
      rating_details: {
        average_rating: parseFloat(averageRating.toFixed(2)),
        total_ratings: totalRatings,
        rating_distribution: ratingDistribution,
      },
      
      // Job history (Requirement 15.3, 15.4)
      job_history: jobHistory,
      
      // Certifications (Requirement 15.5)
      certifications: engineer.certifications || [],
      
      // Additional insights
      performance_by_job_type: performanceByJobType,
      monthly_trend: monthlyTrend,
      
      // Engineer details
      engineer_details: {
        skill_level: engineer.skill_level,
        specializations: engineer.specializations || [],
        employment_type: engineer.employment_type,
        availability_status: engineer.availability_status,
      },
      
      // Metadata
      generated_at: new Date().toISOString(),
    };

    return successResponse(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/engineers/[id]/performance:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}

/**
 * Calculate date range based on period
 */
function calculateDateRange(period: string): { from: string | null; to: string | null } {
  const now = new Date();
  const to = now.toISOString();
  let from: string | null = null;

  switch (period) {
    case 'week':
      from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'month':
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'quarter':
      from = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'year':
      from = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
      break;
    case 'all':
      from = null; // No date filter
      break;
  }

  return { from, to };
}

/**
 * Calculate performance metrics by job type
 */
function calculatePerformanceByJobType(jobs: any[]) {
  const jobTypes = ['AMC', 'Repair', 'Installation', 'Emergency'];
  
  return jobTypes.map(type => {
    const typeJobs = jobs.filter(j => j.job_type === type);
    const jobsWithRatings = typeJobs.filter(j => j.client_rating !== null);
    
    return {
      job_type: type,
      total_jobs: typeJobs.length,
      average_rating: jobsWithRatings.length > 0
        ? parseFloat((jobsWithRatings.reduce((sum, j) => sum + (j.client_rating || 0), 0) / jobsWithRatings.length).toFixed(2))
        : 0,
      total_revenue: typeJobs.reduce((sum, j) => sum + (j.service_fee || 0), 0),
    };
  }).filter(metric => metric.total_jobs > 0);
}

/**
 * Calculate monthly performance trend
 */
function calculateMonthlyTrend(jobs: any[]) {
  const monthlyData: Record<string, { jobs: number; ratings: number[]; revenue: number }> = {};
  
  jobs.forEach(job => {
    if (!job.completed_at) return;
    
    const date = new Date(job.completed_at);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { jobs: 0, ratings: [], revenue: 0 };
    }
    
    monthlyData[monthKey].jobs += 1;
    if (job.client_rating) {
      monthlyData[monthKey].ratings.push(job.client_rating);
    }
    monthlyData[monthKey].revenue += job.service_fee || 0;
  });
  
  return Object.entries(monthlyData)
    .map(([month, data]) => ({
      month,
      jobs_completed: data.jobs,
      average_rating: data.ratings.length > 0
        ? parseFloat((data.ratings.reduce((sum, r) => sum + r, 0) / data.ratings.length).toFixed(2))
        : 0,
      revenue: data.revenue,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
