/**
 * Agency Analytics Dashboard API Route
 * GET /api/agencies/{id}/analytics - Get analytics dashboard data
 * 
 * Provides chart-ready analytics data including jobs completed aggregation,
 * revenue calculations, rating aggregations, trend analysis, and visualization data.
 * 
 * Requirements: 10.1, 10.3, 10.4
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { 
  assertPermission, 
  assertAgencyAccess
} from '@cueron/utils/src/authorization';
import { isDemoUser } from '@/lib/demo-data/middleware';
import { generateDashboardData } from '@/lib/demo-data/generator';

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
 * GET /api/agencies/{id}/analytics
 * Retrieve analytics dashboard data with chart-ready structures
 * 
 * Query Parameters:
 * - period: '1month' | '3months' | '6months' | '1year' | 'all' (default: '6months')
 * - includeCharts: boolean (default: true)
 */
export async function GET(
  request: NextRequest,
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

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '6months';
    const includeCharts = searchParams.get('includeCharts') !== 'false';

    // Validate period parameter
    const validPeriods = ['1month', '3months', '6months', '1year', 'all'];
    if (!validPeriods.includes(period)) {
      return errorResponse(
        'INVALID_PARAMETER',
        `Invalid period parameter. Must be one of: ${validPeriods.join(', ')}`,
        undefined,
        400
      );
    }

    // Check if this is a demo user and serve generated data
    if (isDemoUser(session)) {
      try {
        const demoData = generateDashboardData(session.user_id, period);
        
        // Build response matching the exact format of real data
        const response: any = {
          agency_id: agencyId,
          period,
          summary: demoData.summary,
          generated_at: new Date().toISOString(),
        };

        // Include chart data if requested
        if (includeCharts) {
          response.charts = {
            jobs_trend: demoData.charts.jobs_trend,
            revenue_trend: demoData.charts.revenue_trend,
            rating_distribution: demoData.charts.rating_distribution,
            job_type_distribution: demoData.charts.job_type_distribution,
            engineer_performance: [], // Empty array for demo data
          };
        }

        // Include trends
        response.trends = demoData.trends;

        return successResponse(response);
      } catch (error) {
        console.error('Error generating demo data:', error);
        // Fall through to real data query on error
      }
    }

    // Calculate date range based on period
    const dateRange = calculateDateRange(period);

    // Create Supabase client
    const supabase = await createClient();

    // Refresh materialized views to get latest data
    try {
      await supabase.rpc('refresh_agency_monthly_metrics');
      await supabase.rpc('refresh_engineer_performance_metrics');
    } catch (refreshError) {
      console.warn('Failed to refresh materialized views:', refreshError);
      // Continue anyway - we'll use existing data
    }

    // Fetch monthly metrics for the period
    const { data: monthlyMetrics, error: metricsError } = await supabase
      .from('agency_monthly_metrics')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('month', dateRange.startDate.toISOString())
      .order('month', { ascending: true });

    if (metricsError) {
      console.error('Error fetching monthly metrics:', metricsError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to fetch analytics data',
        undefined,
        500
      );
    }

    // Fetch engineer performance data
    const { data: engineerMetrics, error: engineerError } = await supabase
      .from('engineer_performance_metrics')
      .select('*')
      .eq('agency_id', agencyId)
      .order('avg_rating', { ascending: false });

    if (engineerError) {
      console.error('Error fetching engineer metrics:', engineerError);
      // Continue without engineer data
    }

    // Fetch detailed job data for rating distribution and job type analysis
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, job_type, status, client_rating, service_fee, completed_at')
      .eq('assigned_agency_id', agencyId)
      .eq('status', 'completed')
      .gte('completed_at', dateRange.startDate.toISOString());

    if (jobsError) {
      console.error('Error fetching jobs data:', jobsError);
      // Continue without detailed job data
    }

    // Calculate summary statistics
    const summary = calculateSummary(monthlyMetrics || [], engineerMetrics || []);

    // Build response
    const response: any = {
      agency_id: agencyId,
      period,
      summary,
      generated_at: new Date().toISOString(),
    };

    // Include chart data if requested
    if (includeCharts) {
      response.charts = {
        jobs_trend: buildJobsTrendChart(monthlyMetrics || []),
        revenue_trend: buildRevenueTrendChart(monthlyMetrics || []),
        rating_distribution: buildRatingDistributionChart(jobs || []),
        job_type_distribution: buildJobTypeDistributionChart(jobs || []),
        engineer_performance: buildEngineerPerformanceChart(engineerMetrics || []),
      };
    }

    // Calculate trends
    response.trends = calculateTrends(monthlyMetrics || []);

    return successResponse(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/agencies/[id]/analytics:', error);
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
function calculateDateRange(period: string): { startDate: Date; endDate: Date } {
  const endDate = new Date();
  const startDate = new Date();

  switch (period) {
    case '1month':
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case '3months':
      startDate.setMonth(startDate.getMonth() - 3);
      break;
    case '6months':
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case '1year':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    case 'all':
      startDate.setFullYear(2020, 0, 1); // Start from 2020
      break;
  }

  return { startDate, endDate };
}

/**
 * Calculate summary statistics
 */
function calculateSummary(monthlyMetrics: any[], engineerMetrics: any[]) {
  const totalJobsCompleted = monthlyMetrics.reduce(
    (sum, m) => sum + (m.jobs_completed || 0),
    0
  );

  const totalRevenue = monthlyMetrics.reduce(
    (sum, m) => sum + (m.total_revenue || 0),
    0
  );

  // Calculate weighted average rating
  let totalRatings = 0;
  let totalRatingSum = 0;
  monthlyMetrics.forEach(m => {
    const jobCount = m.jobs_completed || 0;
    const avgRating = m.avg_rating || 0;
    totalRatingSum += jobCount * avgRating;
    totalRatings += jobCount;
  });
  const avgRating = totalRatings > 0 ? totalRatingSum / totalRatings : 0;

  const totalEngineers = engineerMetrics.length;
  const activeEngineers = engineerMetrics.filter(
    e => e.availability_status === 'on_job' || e.availability_status === 'available'
  ).length;

  return {
    total_jobs_completed: totalJobsCompleted,
    total_revenue: totalRevenue,
    avg_rating: parseFloat(avgRating.toFixed(2)),
    total_engineers: totalEngineers,
    active_engineers: activeEngineers,
  };
}

/**
 * Build jobs trend chart data
 */
function buildJobsTrendChart(monthlyMetrics: any[]) {
  return monthlyMetrics.map(m => ({
    month: formatMonth(m.month),
    completed: m.successful_jobs || 0,
    cancelled: m.cancelled_jobs || 0,
    total: m.jobs_completed || 0,
  }));
}

/**
 * Build revenue trend chart data
 */
function buildRevenueTrendChart(monthlyMetrics: any[]) {
  return monthlyMetrics.map(m => ({
    month: formatMonth(m.month),
    revenue: m.total_revenue || 0,
    avg_job_value: m.avg_job_value || 0,
  }));
}

/**
 * Build rating distribution chart data
 */
function buildRatingDistributionChart(jobs: any[]) {
  const distribution = [
    { rating: 5, count: 0 },
    { rating: 4, count: 0 },
    { rating: 3, count: 0 },
    { rating: 2, count: 0 },
    { rating: 1, count: 0 },
  ];

  jobs.forEach(job => {
    if (job.client_rating) {
      const ratingIndex = 5 - job.client_rating;
      if (ratingIndex >= 0 && ratingIndex < 5) {
        distribution[ratingIndex].count++;
      }
    }
  });

  return distribution;
}

/**
 * Build job type distribution chart data
 */
function buildJobTypeDistributionChart(jobs: any[]) {
  const typeCounts: Record<string, number> = {
    AMC: 0,
    Repair: 0,
    Installation: 0,
    Emergency: 0,
  };

  jobs.forEach(job => {
    if (job.job_type && Object.prototype.hasOwnProperty.call(typeCounts, job.job_type)) {
      typeCounts[job.job_type]++;
    }
  });

  const total = jobs.length;
  
  return Object.entries(typeCounts).map(([type, count]) => ({
    type,
    count,
    percentage: total > 0 ? parseFloat(((count / total) * 100).toFixed(1)) : 0,
  }));
}

/**
 * Build engineer performance chart data
 */
function buildEngineerPerformanceChart(engineerMetrics: any[]) {
  // Return top 10 engineers by rating
  return engineerMetrics
    .slice(0, 10)
    .map(e => ({
      engineer_id: e.engineer_id,
      engineer_name: e.engineer_name,
      jobs_completed: e.completed_jobs || 0,
      avg_rating: parseFloat((e.avg_rating || 0).toFixed(2)),
      success_rate: parseFloat((e.success_rate || 0).toFixed(1)),
    }));
}

/**
 * Calculate trends from monthly metrics
 */
function calculateTrends(monthlyMetrics: any[]) {
  if (monthlyMetrics.length < 2) {
    return {
      jobs_growth: 0,
      revenue_growth: 0,
      rating_change: 0,
    };
  }

  // Compare most recent month to previous month
  const current = monthlyMetrics[monthlyMetrics.length - 1];
  const previous = monthlyMetrics[monthlyMetrics.length - 2];

  const jobsGrowth = calculatePercentageChange(
    previous.jobs_completed || 0,
    current.jobs_completed || 0
  );

  const revenueGrowth = calculatePercentageChange(
    previous.total_revenue || 0,
    current.total_revenue || 0
  );

  const ratingChange = (current.avg_rating || 0) - (previous.avg_rating || 0);

  return {
    jobs_growth: parseFloat(jobsGrowth.toFixed(1)),
    revenue_growth: parseFloat(revenueGrowth.toFixed(1)),
    rating_change: parseFloat(ratingChange.toFixed(2)),
  };
}

/**
 * Calculate percentage change between two values
 */
function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) {
    return newValue > 0 ? 100 : 0;
  }
  return ((newValue - oldValue) / oldValue) * 100;
}

/**
 * Format month for display
 */
function formatMonth(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
}
