'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { DashboardLayout } from '@/components/layout';
import { useUserProfile } from '@/hooks/useAuth';
import {
  OverviewCard,
  QuickActions,
  RecentActivity,
  PerformanceCharts,
  DashboardSkeleton,
} from '@/components/dashboard';
import { useEffect, useState } from 'react';

interface DashboardData {
  summary: {
    total_jobs_completed: number;
    total_revenue: number;
    avg_rating: number;
    total_engineers: number;
    active_engineers: number;
  };
  charts: {
    jobs_trend: any[];
    revenue_trend: any[];
    rating_distribution: any[];
    job_type_distribution: any[];
  };
  trends: {
    jobs_growth: number;
    revenue_growth: number;
    rating_change: number;
  };
}

function DashboardContent() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.agency?.id) {
      loadDashboardData(profile.agency.id);
    }
  }, [profile]);

  const loadDashboardData = async (agencyId: string) => {
    try {
      setDataLoading(true);
      setError(null);

      const response = await fetch(`/api/agencies/${agencyId}/analytics?period=6months`);
      
      if (!response.ok) {
        throw new Error('Failed to load dashboard data');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setDataLoading(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <svg
            className="animate-spin h-12 w-12 text-blue-600 mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    {
      label: 'Assign Job',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ),
      onClick: () => console.log('Assign job'),
      variant: 'primary' as const,
    },
    {
      label: 'Add Engineer',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      onClick: () => console.log('Add engineer'),
      variant: 'secondary' as const,
    },
    {
      label: 'View Analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      onClick: () => console.log('View analytics'),
      variant: 'secondary' as const,
    },
    {
      label: 'Export Report',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      onClick: () => console.log('Export report'),
      variant: 'secondary' as const,
    },
  ];

  return (
    <DashboardLayout>
      {/* Welcome Section */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {profile?.agency?.name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening with your agency today
        </p>
      </div>

      {dataLoading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start gap-3">
            <svg
              className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Error Loading Dashboard</h4>
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => profile?.agency?.id && loadDashboardData(profile.agency.id)}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <OverviewCard
              title="Jobs Completed"
              value={dashboardData?.summary.total_jobs_completed || 0}
              icon={
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              }
              trend={
                dashboardData?.trends.jobs_growth
                  ? {
                      value: dashboardData.trends.jobs_growth,
                      isPositive: dashboardData.trends.jobs_growth >= 0,
                    }
                  : undefined
              }
              subtitle="Last 6 months"
            />

            <OverviewCard
              title="Total Revenue"
              value={`₹${(dashboardData?.summary.total_revenue || 0).toLocaleString()}`}
              icon={
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              }
              trend={
                dashboardData?.trends.revenue_growth
                  ? {
                      value: dashboardData.trends.revenue_growth,
                      isPositive: dashboardData.trends.revenue_growth >= 0,
                    }
                  : undefined
              }
              subtitle="Last 6 months"
            />

            <OverviewCard
              title="Average Rating"
              value={`${(dashboardData?.summary.avg_rating || 0).toFixed(1)} ⭐`}
              icon={
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              }
              trend={
                dashboardData?.trends.rating_change
                  ? {
                      value: Math.abs(dashboardData.trends.rating_change * 20), // Convert to percentage
                      isPositive: dashboardData.trends.rating_change >= 0,
                    }
                  : undefined
              }
            />

            <OverviewCard
              title="Active Engineers"
              value={`${dashboardData?.summary.active_engineers || 0} / ${dashboardData?.summary.total_engineers || 0}`}
              icon={
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              }
              subtitle="Currently available"
            />
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <QuickActions actions={quickActions} />
          </div>

          {/* Charts and Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Performance Charts */}
            <div className="lg:col-span-2">
              <PerformanceCharts
                jobsTrend={dashboardData?.charts.jobs_trend}
                revenueTrend={dashboardData?.charts.revenue_trend}
                ratingDistribution={dashboardData?.charts.rating_distribution}
                jobTypeDistribution={dashboardData?.charts.job_type_distribution}
              />
            </div>

            {/* Recent Activity */}
            <div>
              {profile?.agency?.id && <RecentActivity agencyId={profile.agency.id} />}
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}
