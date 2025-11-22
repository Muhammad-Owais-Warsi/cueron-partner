'use client';

/**
 * Engineers List View Component
 * 
 * Displays engineers in a table format with filtering,
 * sorting, and pagination capabilities.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Engineer, AvailabilityStatus } from '@cueron/types';

interface EngineersListViewProps {
  agencyId?: string;
}

export function EngineersListView({ agencyId }: EngineersListViewProps) {
  const router = useRouter();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<AvailabilityStatus | 'all'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Get agency ID from user context or props
  const effectiveAgencyId = agencyId || 'current-agency-id'; // TODO: Get from auth context

  useEffect(() => {
    fetchEngineers();
  }, [statusFilter, page]);

  const fetchEngineers = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      const response = await fetch(
        `/api/agencies/${effectiveAgencyId}/engineers?${params}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch engineers');
      }

      const data = await response.json();
      setEngineers(data.engineers);
      setTotalPages(data.total_pages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async (engineerId: string, currentStatus: AvailabilityStatus) => {
    try {
      const newStatus: AvailabilityStatus = 
        currentStatus === 'available' ? 'offline' : 'available';

      const response = await fetch(`/api/engineers/${engineerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability_status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      // Refresh the list
      fetchEngineers();
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Failed to update availability status');
    }
  };

  const getStatusBadge = (status: AvailabilityStatus) => {
    const styles = {
      available: 'bg-green-100 text-green-800',
      on_job: 'bg-blue-100 text-blue-800',
      offline: 'bg-gray-100 text-gray-800',
      on_leave: 'bg-yellow-100 text-yellow-800'
    };

    const labels = {
      available: 'Available',
      on_job: 'On Job',
      offline: 'Offline',
      on_leave: 'On Leave'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchEngineers}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex gap-4">
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as AvailabilityStatus | 'all');
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="available">Available</option>
          <option value="on_job">On Job</option>
          <option value="offline">Offline</option>
          <option value="on_leave">On Leave</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Engineer
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skill Level
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {engineers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No engineers found. Add your first engineer to get started.
                </td>
              </tr>
            ) : (
              engineers.map((engineer) => (
                <tr
                  key={engineer.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => router.push(`/dashboard/team/${engineer.id}`)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {engineer.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {engineer.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {engineer.specializations.join(', ') || 'General'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{engineer.phone}</div>
                    {engineer.email && (
                      <div className="text-sm text-gray-500">{engineer.email}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`h-4 w-4 ${
                            i < engineer.skill_level ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(engineer.availability_status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {engineer.total_jobs_completed} jobs
                    </div>
                    <div className="text-sm text-gray-500">
                      ⭐ {engineer.average_rating.toFixed(1)} ({engineer.total_ratings})
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAvailabilityToggle(engineer.id, engineer.availability_status);
                      }}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                      disabled={engineer.availability_status === 'on_job'}
                    >
                      {engineer.availability_status === 'on_job' 
                        ? 'On Job' 
                        : engineer.availability_status === 'available' 
                        ? 'Set Offline' 
                        : 'Set Available'}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
