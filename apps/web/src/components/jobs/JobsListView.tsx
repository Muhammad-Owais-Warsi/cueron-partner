/**
 * Jobs List View Component
 * Displays jobs with filtering, sorting, and pagination
 * Requirements: 3.1, 3.3, 18.1, 18.2, 18.3, 18.4
 */

'use client';

import { useState, useEffect } from 'react';
import { useUserProfile } from '@/hooks/useAuth';
import type { Job, JobFilters } from '@cueron/types';
import { JobsTable } from './JobsTable';
import { JobsFilters } from './JobsFilters';
import { JobsPagination } from './JobsPagination';
import { useRealtimeJobs } from '@/hooks/useRealtimeJobs';

interface JobsResponse {
  jobs: Job[];
  total: number;
  page: number;
  limit: number;
}

export function JobsListView() {
  const { profile } = useUserProfile();
  const { jobs, loading: jobsLoading, error: jobsError, refresh } = useRealtimeJobs(profile?.agency?.id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Filter state
  const [filters, setFilters] = useState<JobFilters>({});
  const [sortBy, setSortBy] = useState<'urgency' | 'scheduled_time'>('urgency');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const loadJobs = async () => {
    if (!profile?.agency?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      // Add filters
      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','));
      }
      if (filters.urgency && filters.urgency.length > 0) {
        params.append('urgency', filters.urgency.join(','));
      }
      if (filters.date_from) {
        params.append('date_from', typeof filters.date_from === 'string' ? filters.date_from : filters.date_from.toISOString());
      }
      if (filters.date_to) {
        params.append('date_to', typeof filters.date_to === 'string' ? filters.date_to : filters.date_to.toISOString());
      }
      if (filters.location) {
        params.append('lat', filters.location.lat.toString());
        params.append('lng', filters.location.lng.toString());
        params.append('radius_km', filters.location.radius_km.toString());
      }

      const response = await fetch(
        `/api/agencies/${profile.agency.id}/jobs?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error('Failed to load jobs');
      }

      const data: JobsResponse = await response.json();
      setTotal(data.total);
      // Note: We're using real-time jobs from the hook, but we still need the total count
    } catch (err) {
      console.error('Error loading jobs:', err);
      setError(err instanceof Error ? err.message : 'Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.agency?.id) {
      void loadJobs();
    }
  }, [profile, page, filters, sortBy, sortOrder, loadJobs]);

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(newFilters);
    setPage(1); // Reset to first page when filters change
  };

  const handleSortChange = (field: 'urgency' | 'scheduled_time') => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleJobStatusChange = async (jobId: string, newStatus: 'accepted' | 'cancelled') => {
    try {
      setLoading(true);
      
      const response = await fetch(`/api/jobs/${jobId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update job status');
      }

      // Refresh jobs to reflect the status change
      await refresh();
    } catch (err) {
      console.error('Error updating job status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update job status');
    } finally {
      setLoading(false);
    }
  };

  // Combine loading states
  const isLoading = loading || jobsLoading;
  const hasError = error || jobsError;

  if (isLoading && jobs.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8">
        <div className="flex items-center justify-center">
          <svg
            className="animate-spin h-8 w-8 text-blue-600"
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
          <span className="ml-3 text-gray-600">Loading jobs...</span>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
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
            <h4 className="font-semibold text-red-900 mb-1">Error Loading Jobs</h4>
            <p className="text-sm text-red-800">{hasError}</p>
            <button
              onClick={loadJobs}
              className="mt-3 text-sm font-medium text-red-600 hover:text-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <JobsFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        loading={isLoading}
      />

      {/* Jobs Table */}
      <JobsTable
        jobs={jobs}
        loading={isLoading}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        onJobStatusChange={handleJobStatusChange}
      />

      {/* Pagination */}
      {total > limit && (
        <JobsPagination
          currentPage={page}
          totalPages={Math.ceil(total / limit)}
          totalItems={total}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
        />
      )}

      {/* Empty state */}
      {!isLoading && jobs.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002-2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-600">
            {Object.keys(filters).length > 0
              ? 'Try adjusting your filters to see more results'
              : 'No jobs have been assigned to your agency yet'}
          </p>
        </div>
      )}
    </div>
  );
}