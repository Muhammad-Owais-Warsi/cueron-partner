'use client';

import { formatDate } from '@/lib/utils/formatting';
import type { Job } from '@cueron/types/src/job';

interface JobStatusTimelineProps {
  job: Job;
}

export function JobStatusTimeline({ job }: JobStatusTimelineProps) {
  const statusSteps = [
    {
      status: 'pending',
      label: 'Job Created',
      timestamp: job.created_at,
      icon: '📋',
      completed: true,
    },
    {
      status: 'assigned',
      label: 'Engineer Assigned',
      timestamp: job.assigned_at,
      icon: '👤',
      completed: !!job.assigned_at,
    },
    {
      status: 'accepted',
      label: 'Job Accepted',
      timestamp: job.accepted_at,
      icon: '✓',
      completed: !!job.accepted_at,
    },
    {
      status: 'travelling',
      label: 'Engineer Travelling',
      timestamp: job.status === 'travelling' ? new Date().toISOString() : undefined,
      icon: '🚗',
      completed: ['travelling', 'onsite', 'completed'].includes(job.status),
    },
    {
      status: 'onsite',
      label: 'Engineer On-site',
      timestamp: job.started_at,
      icon: '🔧',
      completed: !!job.started_at,
    },
    {
      status: 'completed',
      label: 'Job Completed',
      timestamp: job.completed_at,
      icon: '✅',
      completed: !!job.completed_at,
    },
  ];

  const currentStepIndex = statusSteps.findIndex((step) => step.status === job.status);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-6">Job Timeline</h2>
      
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

        {/* Timeline steps */}
        <div className="space-y-6">
          {statusSteps.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = step.completed;
            const isFuture = !isCompleted && !isActive;

            return (
              <div key={step.status} className="relative flex items-start">
                {/* Icon */}
                <div
                  className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full text-sm ${
                    isActive
                      ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                      : isCompleted
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step.icon}
                </div>

                {/* Content */}
                <div className="ml-4 flex-1">
                  <div className="flex items-center justify-between">
                    <p
                      className={`font-medium ${
                        isActive
                          ? 'text-blue-900'
                          : isCompleted
                          ? 'text-gray-900'
                          : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </p>
                    {isActive && (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        Current
                      </span>
                    )}
                  </div>
                  {step.timestamp && (
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(step.timestamp)}
                    </p>
                  )}
                  {isFuture && (
                    <p className="text-sm text-gray-400 mt-1">Pending</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cancelled status */}
      {job.status === 'cancelled' && (
        <div className="mt-6 p-4 bg-red-50 border-l-4 border-red-400 rounded">
          <p className="text-sm font-medium text-red-800">Job Cancelled</p>
          <p className="text-sm text-red-700 mt-1">
            This job was cancelled and will not be completed.
          </p>
        </div>
      )}

      {/* Additional info */}
      {job.status === 'completed' && (
        <div className="mt-6 p-4 bg-green-50 border-l-4 border-green-400 rounded">
          <p className="text-sm font-medium text-green-800">Job Completed Successfully</p>
          {job.client_rating && (
            <div className="flex items-center mt-2">
              <span className="text-sm text-green-700">Client Rating:</span>
              <div className="ml-2 flex items-center">
                {[...Array(5)].map((_, i) => (
                  <span
                    key={i}
                    className={`text-lg ${
                      i < job.client_rating! ? 'text-yellow-500' : 'text-gray-300'
                    }`}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
          )}
          {job.client_feedback && (
            <p className="text-sm text-green-700 mt-2">
              Feedback: "{job.client_feedback}"
            </p>
          )}
        </div>
      )}
    </div>
  );
}
