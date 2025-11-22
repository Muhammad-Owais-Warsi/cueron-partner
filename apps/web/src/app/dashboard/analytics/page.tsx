/**
 * Analytics Dashboard Page
 * Displays comprehensive analytics with charts, metrics, and export functionality
 * Requirements: 10.1, 10.3, 10.4, 16.1, 16.4
 */

'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AnalyticsDashboard } from '@/components/analytics/AnalyticsDashboard';
import { EngineerPerformanceComparison } from '@/components/analytics/EngineerPerformanceComparison';
import { ReportExportInterface } from '@/components/analytics/ReportExportInterface';
import { MonthlyReportPreview } from '@/components/analytics/MonthlyReportPreview';
import { useAuth } from '@/hooks/useAuth';

type TabType = 'overview' | 'engineers' | 'reports';

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [period, setPeriod] = useState<string>('6months');

  // Fetch analytics data
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['analytics', user?.agency_id, period],
    queryFn: async () => {
      if (!user?.agency_id) throw new Error('No agency ID');
      
      const response = await fetch(
        `/api/agencies/${user.agency_id}/analytics?period=${period}&includeCharts=true`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      
      return response.json();
    },
    enabled: !!user?.agency_id,
  });

  // Fetch engineer performance data
  const { data: engineersData, isLoading: engineersLoading } = useQuery({
    queryKey: ['engineers', user?.agency_id],
    queryFn: async () => {
      if (!user?.agency_id) throw new Error('No agency ID');
      
      const response = await fetch(
        `/api/agencies/${user.agency_id}/engineers?status=all`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch engineers');
      }
      
      return response.json();
    },
    enabled: !!user?.agency_id && activeTab === 'engineers',
  });

  const tabs = [
    { id: 'overview' as TabType, label: 'Overview', icon: '📊' },
    { id: 'engineers' as TabType, label: 'Engineer Performance', icon: '👷' },
    { id: 'reports' as TabType, label: 'Reports & Export', icon: '📄' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
              <p className="mt-1 text-sm text-gray-500">
                Track performance, analyze trends, and export reports
              </p>
            </div>
            
            {/* Period Selector */}
            {activeTab === 'overview' && (
              <div className="flex items-center gap-2">
                <label htmlFor="period" className="text-sm font-medium text-gray-700">
                  Period:
                </label>
                <select
                  id="period"
                  value={period}
                  onChange={(e) => setPeriod(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm"
                >
                  <option value="1month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="1year">Last Year</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <AnalyticsDashboard
            data={analyticsData}
            loading={analyticsLoading}
            period={period}
          />
        )}

        {activeTab === 'engineers' && (
          <EngineerPerformanceComparison
            engineers={engineersData?.engineers || []}
            loading={engineersLoading}
            agencyId={user?.agency_id}
          />
        )}

        {activeTab === 'reports' && (
          <div className="space-y-8">
            <ReportExportInterface agencyId={user?.agency_id} />
            <MonthlyReportPreview agencyId={user?.agency_id} />
          </div>
        )}
      </div>
    </div>
  );
}
