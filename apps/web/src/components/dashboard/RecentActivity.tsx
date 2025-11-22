/**
 * Recent Activity Feed Component
 * Displays real-time activity updates with Supabase Realtime integration
 */

'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Activity {
  id: string;
  type: 'job_assigned' | 'job_completed' | 'engineer_added' | 'payment_received';
  title: string;
  description: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface RecentActivityProps {
  agencyId: string;
  limit?: number;
}

export function RecentActivity({ agencyId, limit = 10 }: RecentActivityProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentActivities();
    subscribeToUpdates();
  }, [agencyId]);

  const loadRecentActivities = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Fetch recent jobs
      const { data: jobs } = await supabase
        .from('jobs')
        .select('id, job_number, status, assigned_at, completed_at, client_name')
        .eq('assigned_agency_id', agencyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (jobs) {
        const jobActivities: Activity[] = jobs.map((job) => {
          if (job.status === 'completed' && job.completed_at) {
            return {
              id: `job-completed-${job.id}`,
              type: 'job_completed',
              title: 'Job Completed',
              description: `${job.job_number} for ${job.client_name}`,
              timestamp: job.completed_at,
            };
          } else if (job.status === 'assigned' && job.assigned_at) {
            return {
              id: `job-assigned-${job.id}`,
              type: 'job_assigned',
              title: 'Job Assigned',
              description: `${job.job_number} assigned`,
              timestamp: job.assigned_at,
            };
          }
          return null;
        }).filter(Boolean) as Activity[];

        setActivities(jobActivities);
      }
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToUpdates = () => {
    const supabase = createClient();

    // Subscribe to job updates
    const channel = supabase
      .channel(`agency-${agencyId}-activity`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `assigned_agency_id=eq.${agencyId}`,
        },
        (payload) => {
          handleJobUpdate(payload);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const handleJobUpdate = (payload: any) => {
    const job = payload.new;
    
    if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
      const newActivity: Activity = {
        id: `job-${payload.eventType.toLowerCase()}-${job.id}-${Date.now()}`,
        type: job.status === 'completed' ? 'job_completed' : 'job_assigned',
        title: job.status === 'completed' ? 'Job Completed' : 'Job Updated',
        description: `${job.job_number} - ${job.status}`,
        timestamp: new Date().toISOString(),
      };

      setActivities((prev) => [newActivity, ...prev].slice(0, limit));
    }
  };

  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'job_assigned':
        return (
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </div>
        );
      case 'job_completed':
        return (
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
      case 'engineer_added':
        return (
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-purple-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
        );
      case 'payment_received':
        return (
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
            <svg
              className="w-5 h-5 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        );
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-start gap-3 animate-pulse">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        <div className="flex items-center gap-1 text-xs text-green-600">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></span>
          <span>Live</span>
        </div>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-8">
          <svg
            className="w-12 h-12 text-gray-300 mx-auto mb-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <p className="text-gray-500 text-sm">No recent activity</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-4 border-b border-gray-100 last:border-0 last:pb-0"
            >
              {getActivityIcon(activity.type)}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-sm text-gray-600 truncate">{activity.description}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {formatTimestamp(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
