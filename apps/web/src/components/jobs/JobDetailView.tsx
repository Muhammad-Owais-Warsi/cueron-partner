'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useJobUpdates } from '@/lib/realtime/hooks';
import { JobMap } from './JobMap';
import { EngineerSelector } from './EngineerSelector';
import { AssignmentConfirmDialog } from './AssignmentConfirmDialog';
import { JobStatusTimeline } from './JobStatusTimeline';
import { formatDate, formatCurrency } from '@/lib/utils/formatting';
import type { Job } from '@cueron/types/src/job';
import type { Engineer } from '@cueron/types/src/engineer';

interface JobDetailData {
  job: Job & {
    skill_requirement_highlighted: boolean;
    skill_requirement: {
      level: number;
      description: string;
    };
  };
  completeness: {
    is_complete: boolean;
    missing_fields: string[];
  };
  engineer_distances: Array<{
    engineer_id: string;
    distance_km: number;
    duration_minutes?: number;
  }>;
  metadata: {
    distance_calculation_method: string;
    available_engineers_count: number;
  };
}

interface EngineerWithDistance extends Engineer {
  distance_km: number;
  duration_minutes?: number;
}

export function JobDetailView({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [jobData, setJobData] = useState<JobDetailData | null>(null);
  const [engineers, setEngineers] = useState<EngineerWithDistance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEngineerId, setSelectedEngineerId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Real-time updates for job status
  const { status: realtimeStatus, location: realtimeLocation, lastUpdate } = useJobUpdates(jobId);

  // Fetch job details
  useEffect(() => {
    fetchJobDetails();
  }, [jobId]);

  // Update job status from real-time updates
  useEffect(() => {
    if (realtimeStatus && jobData) {
      setJobData({
        ...jobData,
        job: {
          ...jobData.job,
          status: realtimeStatus as any,
        },
      });
    }
  }, [realtimeStatus]);

  async function fetchJobDetails() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/jobs/${jobId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch job details');
      }

      const data: JobDetailData = await response.json();
      setJobData(data);

      // Fetch engineer details for those with distances
      if (data.engineer_distances.length > 0) {
        await fetchEngineers(data.engineer_distances);
      }
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEngineers(distances: Array<{ engineer_id: string; distance_km: number; duration_minutes?: number }>) {
    try {
      const supabase = createClient();
      const engineerIds = distances.map(d => d.engineer_id);

      const { data, error } = await supabase
        .from('engineers')
        .select('*')
        .in('id', engineerIds);

      if (error) throw error;

      // Merge engineer data with distance information
      const engineersWithDistance: EngineerWithDistance[] = (data || []).map(engineer => {
        const distanceInfo = distances.find(d => d.engineer_id === engineer.id);
        return {
          ...engineer,
          distance_km: distanceInfo?.distance_km || 0,
          duration_minutes: distanceInfo?.duration_minutes,
        };
      });

      // Sort by distance
      engineersWithDistance.sort((a, b) => a.distance_km - b.distance_km);
      setEngineers(engineersWithDistance);
    } catch (err) {
      console.error('Error fetching engineers:', err);
    }
  }

  async function handleAssignEngineer() {
    if (!selectedEngineerId) return;

    try {
      setAssigning(true);
      const response = await fetch(`/api/jobs/${jobId}/assign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          engineer_id: selectedEngineerId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to assign engineer');
      }

      // Refresh job details
      await fetchJobDetails();
      setShowConfirmDialog(false);
      setSelectedEngineerId(null);
    } catch (err: any) {
      console.error('Error assigning engineer:', err);
      alert(`Failed to assign engineer: ${err.message}`);
    } finally {
      setAssigning(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !jobData) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="text-red-600 mb-4">{error || 'Job not found'}</div>
        <button
          onClick={() => router.push('/dashboard/jobs')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Back to Jobs
        </button>
      </div>
    );
  }

  const { job } = jobData;
  const canAssign = !job.assigned_engineer_id && (job.status === 'pending' || job.status === 'assigned');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => router.push('/dashboard/jobs')}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center"
          >
            ← Back to Jobs
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{job.job_number}</h1>
          <p className="text-gray-600 mt-1">
            {job.client_name} • {job.job_type}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              job.status === 'completed'
                ? 'bg-green-100 text-green-800'
                : job.status === 'onsite' || job.status === 'travelling'
                ? 'bg-blue-100 text-blue-800'
                : job.status === 'assigned' || job.status === 'accepted'
                ? 'bg-yellow-100 text-yellow-800'
                : job.status === 'cancelled'
                ? 'bg-red-100 text-red-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-sm font-medium ${
              job.urgency === 'emergency'
                ? 'bg-red-100 text-red-800'
                : job.urgency === 'urgent'
                ? 'bg-orange-100 text-orange-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {job.urgency.charAt(0).toUpperCase() + job.urgency.slice(1)}
          </span>
        </div>
      </div>

      {/* Real-time update indicator */}
      {lastUpdate && (
        <div className="bg-blue-50 border border-blue-200 rounded-md p-3 flex items-center">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse mr-2"></div>
          <span className="text-sm text-blue-800">
            Last updated: {new Date(lastUpdate).toLocaleTimeString()}
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Job Details Card */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Client Name</p>
                <p className="font-medium">{job.client_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Client Phone</p>
                <p className="font-medium">{job.client_phone}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Job Type</p>
                <p className="font-medium">{job.job_type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Equipment Type</p>
                <p className="font-medium">{job.equipment_type}</p>
              </div>
              {job.scheduled_time && (
                <div>
                  <p className="text-sm text-gray-600">Scheduled Time</p>
                  <p className="font-medium">{formatDate(job.scheduled_time)}</p>
                </div>
              )}
              {job.service_fee && (
                <div>
                  <p className="text-sm text-gray-600">Service Fee</p>
                  <p className="font-medium">{formatCurrency(job.service_fee)}</p>
                </div>
              )}
            </div>

            {/* Skill Requirement - Highlighted */}
            <div className="mt-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <p className="text-sm font-semibold text-yellow-800">Required Skill Level</p>
              <p className="text-lg font-bold text-yellow-900">
                Level {job.skill_requirement.level}
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {job.skill_requirement.description}
              </p>
            </div>

            {job.issue_description && (
              <div className="mt-4">
                <p className="text-sm text-gray-600">Issue Description</p>
                <p className="mt-1 text-gray-900">{job.issue_description}</p>
              </div>
            )}

            {job.equipment_details && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Equipment Details</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {job.equipment_details.brand && (
                    <div>
                      <span className="text-gray-600">Brand:</span>{' '}
                      <span className="font-medium">{job.equipment_details.brand}</span>
                    </div>
                  )}
                  {job.equipment_details.model && (
                    <div>
                      <span className="text-gray-600">Model:</span>{' '}
                      <span className="font-medium">{job.equipment_details.model}</span>
                    </div>
                  )}
                  {job.equipment_details.serial_number && (
                    <div>
                      <span className="text-gray-600">Serial:</span>{' '}
                      <span className="font-medium">{job.equipment_details.serial_number}</span>
                    </div>
                  )}
                  {job.equipment_details.capacity && (
                    <div>
                      <span className="text-gray-600">Capacity:</span>{' '}
                      <span className="font-medium">{job.equipment_details.capacity}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Location Card with Map */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Location</h2>
            <div className="mb-4">
              <p className="text-gray-900">{job.site_location.address}</p>
              <p className="text-gray-600">
                {job.site_location.city}, {job.site_location.state}
              </p>
            </div>
            <JobMap
              jobLocation={{
                lat: job.site_location.lat,
                lng: job.site_location.lng,
              }}
              engineerLocation={realtimeLocation}
            />
          </div>

          {/* Status Timeline */}
          <JobStatusTimeline job={job} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Engineer Assignment */}
          {canAssign && engineers.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assign Engineer</h2>
              <EngineerSelector
                engineers={engineers}
                selectedEngineerId={selectedEngineerId}
                onSelect={setSelectedEngineerId}
              />
              <button
                onClick={() => setShowConfirmDialog(true)}
                disabled={!selectedEngineerId}
                className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Assign Engineer
              </button>
            </div>
          )}

          {/* Assigned Engineer Info */}
          {job.assigned_engineer_id && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Assigned Engineer</h2>
              {engineers.find(e => e.id === job.assigned_engineer_id) ? (
                <div>
                  <p className="font-medium text-gray-900">
                    {engineers.find(e => e.id === job.assigned_engineer_id)?.name}
                  </p>
                  <p className="text-sm text-gray-600">
                    {engineers.find(e => e.id === job.assigned_engineer_id)?.phone}
                  </p>
                  {job.assigned_at && (
                    <p className="text-sm text-gray-600 mt-2">
                      Assigned: {formatDate(job.assigned_at)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-gray-600">Loading engineer details...</p>
              )}
            </div>
          )}

          {/* Available Engineers */}
          {engineers.length > 0 && !canAssign && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Available Engineers ({engineers.length})
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {engineers.slice(0, 5).map((engineer) => (
                  <div key={engineer.id} className="border-b border-gray-200 pb-3 last:border-0">
                    <p className="font-medium text-gray-900">{engineer.name}</p>
                    <p className="text-sm text-gray-600">
                      {engineer.distance_km.toFixed(1)} km away
                      {engineer.duration_minutes && ` • ${engineer.duration_minutes} min`}
                    </p>
                    <p className="text-xs text-gray-500">
                      Skill Level {engineer.skill_level} • {engineer.availability_status}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Assignment Confirmation Dialog */}
      {showConfirmDialog && selectedEngineerId && (
        <AssignmentConfirmDialog
          engineer={engineers.find(e => e.id === selectedEngineerId)!}
          job={job}
          onConfirm={handleAssignEngineer}
          onCancel={() => {
            setShowConfirmDialog(false);
            setSelectedEngineerId(null);
          }}
          isAssigning={assigning}
        />
      )}
    </div>
  );
}
