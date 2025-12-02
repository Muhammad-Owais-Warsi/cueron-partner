/**
 * Analytics Dashboard Component
 * Displays comprehensive analytics with charts and metrics
 * Requirements: 10.1, 10.3, 10.4
 */

'use client';

import React from 'react';
import { PerformanceCharts } from '@/components/dashboard/PerformanceCharts';

interface AnalyticsSummary {
  total_jobs_completed: number;
  total_revenue: number;
  avg_rating: number;
  total_engineers: number;
  active_engineers: number;
}

interface Trends {
  jobs_growth: number;
  revenue_growth: number;
  rating_change: number;
}

interface JobsTrendData {
  month: string;
  completed: number;
  cancelled: number;
  total: number;
}

interface RevenueTrendData {
  month: string;
  revenue: number;
  avg_job_value: number;
}

interface RatingDistributionData {
  rating: number;
  count: number;
}

interface JobTypeDistributionData {
  type: string;
  count: number;
  percentage: number;
  [key: string]: string | number;
}

interface EngineerPerformanceData {
  engineer_id: string;
  engineer_name: string;
  jobs_completed: number;
  avg_rating: number;
  success_rate: number;
}

interface AnalyticsData {
  agency_id: string;
  period: string;
  summary: AnalyticsSummary;
  charts?: {
    jobs_trend: JobsTrendData[];
    revenue_trend: RevenueTrendData[];
    rating_distribution: RatingDistributionData[];
    job_type_distribution: JobTypeDistributionData[];
    engineer_performance: EngineerPerformanceData[];
  };
  trends: Trends;
  generated_at: string;
}

interface AnalyticsDashboardProps {
  data?: AnalyticsData;
  loading?: boolean;
  period: string;
}

export function AnalyticsDashboard({
  data,
  loading = false,
  period,
}: AnalyticsDashboardProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* Loading skeleton for summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>

        {/* Loading skeleton for charts */}
        <div className="bg-white rounded-lg shadow-sm p-6 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    );
  }

  const { summary, charts, trends } = data;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Jobs Completed */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Jobs Completed</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {summary.total_jobs_completed.toLocaleString()}
              </p>
              {trends.jobs_growth !== 0 && (
                <p className={`mt-2 text-sm ${trends.jobs_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trends.jobs_growth > 0 ? '↑' : '↓'} {Math.abs(trends.jobs_growth)}% from last period
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">✓</span>
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                ₹{summary.total_revenue.toLocaleString()}
              </p>
              {trends.revenue_growth !== 0 && (
                <p className={`mt-2 text-sm ${trends.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trends.revenue_growth > 0 ? '↑' : '↓'} {Math.abs(trends.revenue_growth)}% from last period
                </p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">₹</span>
            </div>
          </div>
        </div>

        {/* Average Rating */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Rating</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {summary.avg_rating.toFixed(2)} ⭐
              </p>
              {trends.rating_change !== 0 && (
                <p className={`mt-2 text-sm ${trends.rating_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {trends.rating_change > 0 ? '↑' : '↓'} {Math.abs(trends.rating_change).toFixed(2)} from last period
                </p>
              )}
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">⭐</span>
            </div>
          </div>
        </div>

        {/* Active Engineers */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Engineers</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">
                {summary.active_engineers} / {summary.total_engineers}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {summary.total_engineers > 0 
                  ? Math.round((summary.active_engineers / summary.total_engineers) * 100)
                  : 0}% utilization
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">👷</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {charts && (
        <PerformanceCharts
          jobsTrend={charts.jobs_trend}
          revenueTrend={charts.revenue_trend}
          ratingDistribution={charts.rating_distribution}
          jobTypeDistribution={charts.job_type_distribution}
          loading={false}
        />
      )}

      {/* Top Engineers */}
      {charts?.engineer_performance && charts.engineer_performance.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Top Performing Engineers
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Engineer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Jobs Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Success Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {charts.engineer_performance.map((engineer) => (
                  <tr key={engineer.engineer_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {engineer.engineer_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {engineer.jobs_completed}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {engineer.avg_rating.toFixed(2)} ⭐
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-green-500 h-2 rounded-full"
                            style={{ width: `${engineer.success_rate}%` }}
                          ></div>
                        </div>
                        <span>{engineer.success_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Period Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Period:</strong> {getPeriodLabel(period)} • 
          <strong className="ml-2">Generated:</strong> {new Date(data.generated_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function getPeriodLabel(period: string): string {
  const labels: Record<string, string> = {
    '1month': 'Last Month',
    '3months': 'Last 3 Months',
    '6months': 'Last 6 Months',
    '1year': 'Last Year',
    'all': 'All Time',
  };
  return labels[period] || period;
}
