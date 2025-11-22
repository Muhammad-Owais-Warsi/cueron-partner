'use client';

/**
 * Engineer Profile Page
 * 
 * Displays detailed engineer information including performance metrics,
 * certifications, and job history.
 * 
 * Requirements: 2.1, 2.2, 2.3, 15.1, 15.2, 15.3, 15.4, 15.5
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Engineer, EngineerPerformance } from '@cueron/types';

export default function EngineerProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [engineer, setEngineer] = useState<Engineer | null>(null);
  const [performance, setPerformance] = useState<EngineerPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchEngineerData();
  }, [params.id]);

  const fetchEngineerData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch engineer details
      const engineerResponse = await fetch(`/api/engineers/${params.id}`);
      if (!engineerResponse.ok) {
        throw new Error('Failed to fetch engineer details');
      }
      const engineerData = await engineerResponse.json();
      setEngineer(engineerData.engineer);

      // Fetch performance data
      const performanceResponse = await fetch(`/api/engineers/${params.id}/performance`);
      if (performanceResponse.ok) {
        const performanceData = await performanceResponse.json();
        setPerformance(performanceData.performance);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityToggle = async () => {
    if (!engineer) return;

    try {
      const newStatus = engineer.availability_status === 'available' ? 'offline' : 'available';
      
      const response = await fetch(`/api/engineers/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability_status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update availability');
      }

      fetchEngineerData();
    } catch (err) {
      console.error('Error updating availability:', err);
      alert('Failed to update availability status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !engineer) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error || 'Engineer not found'}</p>
        <button
          onClick={() => router.push('/dashboard/team')}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Back to Team
        </button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
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
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/dashboard/team')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Team
        </button>
        <button
          onClick={handleAvailabilityToggle}
          disabled={engineer.availability_status === 'on_job'}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {engineer.availability_status === 'on_job' 
            ? 'Currently On Job' 
            : engineer.availability_status === 'available' 
            ? 'Set Offline' 
            : 'Set Available'}
        </button>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start gap-6">
          <div className="h-24 w-24 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-bold text-3xl">
              {engineer.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{engineer.name}</h1>
              {getStatusBadge(engineer.availability_status)}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Phone:</span>
                <p className="font-medium">{engineer.phone}</p>
              </div>
              {engineer.email && (
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{engineer.email}</p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Employment Type:</span>
                <p className="font-medium capitalize">{engineer.employment_type.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="text-gray-600">Skill Level:</span>
                <div className="flex items-center gap-1 mt-1">
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
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Jobs Completed</p>
          <p className="text-2xl font-bold mt-1">{engineer.total_jobs_completed}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Average Rating</p>
          <p className="text-2xl font-bold mt-1">
            ⭐ {engineer.average_rating.toFixed(1)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {engineer.total_ratings} rating(s)
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600 text-sm">Success Rate</p>
          <p className="text-2xl font-bold mt-1">{engineer.success_rate.toFixed(1)}%</p>
        </div>
        {performance && (
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-600 text-sm">This Month</p>
            <p className="text-2xl font-bold mt-1">{performance.jobs_this_month}</p>
            <p className="text-xs text-gray-500 mt-1">jobs</p>
          </div>
        )}
      </div>

      {/* Specializations */}
      {engineer.specializations.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Specializations</h2>
          <div className="flex flex-wrap gap-2">
            {engineer.specializations.map((spec: string) => (
              <span
                key={spec}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
              >
                {spec}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Certifications */}
      {engineer.certifications.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Certifications</h2>
          <div className="space-y-3">
            {engineer.certifications.map((cert: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{cert.type} - Level {cert.level}</p>
                  <p className="text-sm text-gray-600">Certificate: {cert.cert_number}</p>
                  {cert.issued_date && (
                    <p className="text-xs text-gray-500 mt-1">
                      Issued: {new Date(cert.issued_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div>
                  {cert.verified ? (
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                      Verified
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                      Pending
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Location Info */}
      {engineer.current_location && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-3">Location</h2>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Last Known Location:</span>
              <p className="font-medium">
                Lat: {engineer.current_location.coordinates[1].toFixed(6)}, 
                Lng: {engineer.current_location.coordinates[0].toFixed(6)}
              </p>
            </div>
            {engineer.last_location_update && (
              <div>
                <span className="text-sm text-gray-600">Last Update:</span>
                <p className="font-medium">
                  {new Date(engineer.last_location_update).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
