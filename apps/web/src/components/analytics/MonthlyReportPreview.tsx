/**
 * Monthly Report Preview Component
 * Displays a preview of the monthly report content
 * Requirements: 16.4
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

interface MonthlyReportPreviewProps {
  agencyId?: string;
}

export function MonthlyReportPreview({ agencyId }: MonthlyReportPreviewProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Fetch monthly report data
  const { data: reportData, isLoading } = useQuery({
    queryKey: ['monthly-report-preview', agencyId, selectedMonth],
    queryFn: async () => {
      if (!agencyId) throw new Error('No agency ID');

      // Calculate date range for the selected month
      // const [year, month] = selectedMonth.split('-');
      // const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      // const endDate = new Date(parseInt(year), parseInt(month), 0);

      // Fetch analytics for the month
      const response = await fetch(
        `/api/agencies/${agencyId}/analytics?period=1month&includeCharts=false`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch report data');
      }

      return response.json();
    },
    enabled: !!agencyId,
  });

  // Generate month options for the last 12 months
  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    return { value, label };
  });

  if (!agencyId) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-12 text-center">
        <p className="text-gray-500">Agency information not available</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Monthly Report Preview</h2>
          <p className="text-sm text-gray-500 mt-1">
            Preview report content before exporting
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="month-select" className="text-sm font-medium text-gray-700">
            Month:
          </label>
          <select
            id="month-select"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
          >
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      ) : reportData ? (
        <div className="space-y-6">
          {/* Report Header */}
          <div className="border-b border-gray-200 pb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Monthly Performance Report
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {monthOptions.find((m) => m.value === selectedMonth)?.label}
            </p>
          </div>

          {/* Executive Summary */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Executive Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Jobs Completed</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {reportData.summary?.total_jobs_completed || 0}
                </p>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Revenue</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  ₹{(reportData.summary?.total_revenue || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-yellow-600 mt-1">
                  {(reportData.summary?.avg_rating || 0).toFixed(2)} ⭐
                </p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-gray-600">Engineer Utilization</p>
                <p className="text-2xl font-bold text-purple-600 mt-1">
                  {reportData.summary?.total_engineers > 0
                    ? Math.round(
                        (reportData.summary.active_engineers / reportData.summary.total_engineers) * 100
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Performance Trends */}
          {reportData.trends && (
            <div>
              <h4 className="text-md font-semibold text-gray-900 mb-3">Performance Trends</h4>
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Jobs Growth</span>
                  <span
                    className={`text-sm font-medium ${
                      reportData.trends.jobs_growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {reportData.trends.jobs_growth > 0 ? '↑' : '↓'}{' '}
                    {Math.abs(reportData.trends.jobs_growth).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Revenue Growth</span>
                  <span
                    className={`text-sm font-medium ${
                      reportData.trends.revenue_growth > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {reportData.trends.revenue_growth > 0 ? '↑' : '↓'}{' '}
                    {Math.abs(reportData.trends.revenue_growth).toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Rating Change</span>
                  <span
                    className={`text-sm font-medium ${
                      reportData.trends.rating_change > 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {reportData.trends.rating_change > 0 ? '↑' : '↓'}{' '}
                    {Math.abs(reportData.trends.rating_change).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Report Contents Checklist */}
          <div>
            <h4 className="text-md font-semibold text-gray-900 mb-3">Report Contents</h4>
            <div className="space-y-2">
              {[
                'Jobs completed and revenue summary',
                'Engineer utilization metrics',
                'Average ratings and customer feedback',
                'Performance trends and growth analysis',
                'Job type distribution',
                'Top performing engineers',
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm text-gray-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Note */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The full report will include detailed charts, engineer performance
              breakdowns, and agency branding when exported as PDF.
            </p>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No data available for the selected month</p>
        </div>
      )}
    </div>
  );
}
