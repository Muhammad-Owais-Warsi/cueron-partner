/**
 * Jobs Table Component
 * Displays jobs in a sortable table format
 * Requirements: 3.1, 3.3
 */

'use client';

import Link from 'next/link';
import type { Job } from '@cueron/types';
import { formatDate, formatTime } from '@/lib/utils/formatting';
import { useUserProfile } from '@/hooks/useAuth';

interface JobsTableProps {
  jobs: Job[];
  loading?: boolean;
  sortBy: 'urgency' | 'scheduled_time';
  sortOrder: 'asc' | 'desc';
  onSortChange: (field: 'urgency' | 'scheduled_time') => void;
  onJobStatusChange?: (jobId: string, newStatus: 'accepted' | 'cancelled') => void;
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800',
  assigned: 'bg-blue-100 text-blue-800',
  accepted: 'bg-cyan-100 text-cyan-800',
  travelling: 'bg-purple-100 text-purple-800',
  onsite: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const URGENCY_COLORS: Record<string, string> = {
  emergency: 'bg-red-100 text-red-800',
  urgent: 'bg-orange-100 text-orange-800',
  normal: 'bg-blue-100 text-blue-800',
  scheduled: 'bg-gray-100 text-gray-800',
};

export function JobsTable({ jobs, loading, sortBy, sortOrder, onSortChange, onJobStatusChange }: JobsTableProps) {
  const { profile } = useUserProfile();

  const SortIcon = ({ field }: { field: 'urgency' | 'scheduled_time' }) => {
    if (sortBy !== field) {
      return (
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }

    return sortOrder === 'asc' ? (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    );
  };

  const handleAcceptJob = async (jobId: string) => {
    if (onJobStatusChange) {
      onJobStatusChange(jobId, 'accepted');
    }
  };

  const handleRejectJob = async (jobId: string) => {
    if (onJobStatusChange) {
      onJobStatusChange(jobId, 'cancelled');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Job Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSortChange('urgency')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Urgency
                  <SortIcon field="urgency" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <button
                  onClick={() => onSortChange('scheduled_time')}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Scheduled
                  <SortIcon field="scheduled_time" />
                </button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-32"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-28"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded w-16"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-6 bg-gray-200 rounded w-20"></div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="h-8 bg-gray-200 rounded w-16"></div>
                  </td>
                </tr>
              ))
            ) : (
              jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{job.job_number}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.client_name}</div>
                    <div className="text-xs text-gray-500">{job.client_phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{job.job_type}</div>
                    <div className="text-xs text-gray-500">{job.equipment_type}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 max-w-xs truncate">
                      {job.site_location.city}
                    </div>
                    <div className="text-xs text-gray-500">{job.site_location.state}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        URGENCY_COLORS[job.urgency] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {job.scheduled_time ? (
                      <>
                        <div className="text-sm text-gray-900">
                          {formatDate(job.scheduled_time)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(job.scheduled_time)}
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-gray-400">Not scheduled</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        STATUS_COLORS[job.status] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {job.status === 'assigned' && job.assigned_engineer_id === profile?.id ? (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleAcceptJob(job.id)}
                          className="text-green-600 hover:text-green-900 font-medium"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRejectJob(job.id)}
                          className="text-red-600 hover:text-red-900 font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <Link
                        href={`/dashboard/jobs/${job.id}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                      >
                        View
                      </Link>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}