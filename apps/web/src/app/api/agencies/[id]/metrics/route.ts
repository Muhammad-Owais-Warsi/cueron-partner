/**
 * Agency Metrics and Analytics API Route
 * GET /api/agencies/{id}/metrics - Get agency performance metrics
 * 
 * Provides comprehensive analytics including monthly metrics, performance trends,
 * revenue aggregation, and engineer utilization statistics.
 * 
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getUserSession } from '@/lib/auth/server';
import { 
  assertPermission, 
  assertAgencyAccess
} from '@cueron/utils/src/authorization';

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
 * GET /api/agencies/{id}/metrics
 * Retrieve agency performance metrics and analytics
 * 
 * Query Parameters:
 * - period: 'monthly' | 'quarterly' | 'yearly' (default: 'monthly')
 * - months: number of months to include (default: 6)
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
    const period = searchParams.get('period') || 'monthly';
    const months = parseInt(searchParams.get('months') || '6', 10);

    // Validate parameters
    if (!['monthly', 'quarterly', 'yearly'].includes(period)) {
      return errorResponse(
        'INVALID_PARAMETER',
        'Invalid period parameter. Must be monthly, quarterly, or yearly',
        undefined,
        400
      );
    }

    if (months < 1 || months > 24) {
      return errorResponse(
        'INVALID_PARAMETER',
        'Months parameter must be between 1 and 24',
        undefined,
        400
      );
    }

    // Create Supabase client
    const supabase = await createClient();

    // Refresh materialized views to get latest data
    try {
      await supabase.rpc('refresh_agency_monthly_metrics');
    } catch (refreshError) {
      console.warn('Failed to refresh materialized view:', refreshError);
      // Continue anyway - we'll use existing data
    }

    // Fetch monthly metrics from materialized view
    const monthsAgo = new Date();
    monthsAgo.setMonth(monthsAgo.getMonth() - months);

    const { data: monthlyMetrics, error: metricsError } = await supabase
      .from('agency_monthly_metrics')
      .select('*')
      .eq('agency_id', agencyId)
      .gte('month', monthsAgo.toISOString())
      .order('month', { ascending: true });

    if (metricsError) {
      console.error('Error fetching monthly metrics:', metricsError);
      return errorResponse(
        'DATABASE_ERROR',
        'Failed to fetch metrics data',
        undefined,
        500
      );
    }

    // Fetch current month real-time metrics
    const { data: currentMetrics, error: currentError } = await supabase
      .from('dashboard_realtime')
      .select('*')
      .eq('agency_id', agencyId)
      .single();

    if (currentError && currentError.code !== 'PGRST116') {
      console.error('Error fetching current metrics:', currentError);
      // Don't fail - just continue without current metrics
    }

    // Calculate performance trends
    const trends = calculateTrends(monthlyMetrics || []);

    // Aggregate revenue data
    const revenueData = aggregateRevenue(monthlyMetrics || [], period);

    // Calculate engineer utilization
    const engineerUtilization = calculateEngineerUtilization(monthlyMetrics || []);

    // Fetch top performing engineers
    const { data: topEngineers, error: engineersError } = await supabase
      .from('engineer_performance_metrics')
      .select('engineer_id, engineer_name, avg_rating, completed_jobs, success_rate')
      .eq('agency_id', agencyId)
      .order('avg_rating', { ascending: false })
      .limit(5);

    if (engineersError) {
      console.error('Error fetching top engineers:', engineersError);
      // Continue without top engineers data
    }

    // Build response
    const response = {
      agency_id: agencyId,
      period,
      months_included: months,
      
      // Current month snapshot
      current_month: currentMetrics ? {
        jobs_today: currentMetrics.jobs_today || 0,
        active_engineers: currentMetrics.active_engineers || 0,
        available_engineers: currentMetrics.available_engineers || 0,
        pending_jobs: currentMetrics.pending_jobs || 0,
        in_progress_jobs: currentMetrics.in_progress_jobs || 0,
        completed_today: currentMetrics.completed_today || 0,
        pending_payments: currentMetrics.pending_payments || 0,
        monthly_revenue: currentMetrics.monthly_revenue || 0,
        monthly_avg_rating: currentMetrics.monthly_avg_rating || 0,
      } : null,
      
      // Historical monthly metrics
      monthly_metrics: monthlyMetrics || [],
      
      // Performance trends
      trends: {
        jobs_completed: trends.jobsTrend,
        revenue: trends.revenueTrend,
        avg_rating: trends.ratingTrend,
        engineer_utilization: trends.utilizationTrend,
      },
      
      // Revenue aggregation
      revenue_summary: revenueData,
      
      // Engineer utilization
      engineer_utilization: engineerUtilization,
      
      // Top performers
      top_engineers: topEngineers || [],
      
      // Metadata
      last_refreshed: monthlyMetrics?.[0]?.last_refreshed || new Date().toISOString(),
      generated_at: new Date().toISOString(),
    };

    return successResponse(response);
  } catch (error) {
    console.error('Unexpected error in GET /api/agencies/[id]/metrics:', error);
    return errorResponse(
      'INTERNAL_ERROR',
      'An unexpected error occurred',
      undefined,
      500
    );
  }
}

/**
 * Calculate performance trends from monthly metrics
 */
function calculateTrends(metrics: any[]) {
  if (metrics.length < 2) {
    return {
      jobsTrend: 0,
      revenueTrend: 0,
      ratingTrend: 0,
      utilizationTrend: 0,
    };
  }

  // Compare most recent month to previous month
  const current = metrics[metrics.length - 1];
  const previous = metrics[metrics.length - 2];

  const jobsTrend = calculatePercentageChange(
    previous.jobs_completed,
    current.jobs_completed
  );

  const revenueTrend = calculatePercentageChange(
    previous.total_revenue,
    current.total_revenue
  );

  const ratingTrend = calculatePercentageChange(
    previous.avg_rating,
    current.avg_rating
  );

  const utilizationTrend = calculatePercentageChange(
    previous.engineers_utilized,
    current.engineers_utilized
  );

  return {
    jobsTrend,
    revenueTrend,
    ratingTrend,
    utilizationTrend,
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
 * Aggregate revenue data by period
 */
function aggregateRevenue(metrics: any[], _period: string) {
  if (metrics.length === 0) {
    return {
      total_revenue: 0,
      avg_monthly_revenue: 0,
      highest_month: null,
      lowest_month: null,
    };
  }

  const totalRevenue = metrics.reduce((sum, m) => sum + (m.total_revenue || 0), 0);
  const avgMonthlyRevenue = totalRevenue / metrics.length;

  const sortedByRevenue = [...metrics].sort((a, b) => 
    (b.total_revenue || 0) - (a.total_revenue || 0)
  );

  return {
    total_revenue: totalRevenue,
    avg_monthly_revenue: avgMonthlyRevenue,
    highest_month: sortedByRevenue[0] ? {
      month: sortedByRevenue[0].month,
      revenue: sortedByRevenue[0].total_revenue,
    } : null,
    lowest_month: sortedByRevenue[sortedByRevenue.length - 1] ? {
      month: sortedByRevenue[sortedByRevenue.length - 1].month,
      revenue: sortedByRevenue[sortedByRevenue.length - 1].total_revenue,
    } : null,
  };
}

/**
 * Calculate engineer utilization statistics
 */
function calculateEngineerUtilization(metrics: any[]) {
  if (metrics.length === 0) {
    return {
      avg_utilization: 0,
      total_engineers_utilized: 0,
      utilization_trend: [],
    };
  }

  const totalUtilized = metrics.reduce((sum, m) => sum + (m.engineers_utilized || 0), 0);
  const avgUtilization = totalUtilized / metrics.length;

  const utilizationTrend = metrics.map(m => ({
    month: m.month,
    engineers_utilized: m.engineers_utilized || 0,
    jobs_completed: m.jobs_completed || 0,
    jobs_per_engineer: m.engineers_utilized > 0 
      ? (m.jobs_completed / m.engineers_utilized).toFixed(2)
      : 0,
  }));

  return {
    avg_utilization: avgUtilization,
    total_engineers_utilized: totalUtilized,
    utilization_trend: utilizationTrend,
  };
}
