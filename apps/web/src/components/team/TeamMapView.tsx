'use client';

/**
 * Team Map View Component
 * 
 * Displays real-time locations of all active engineers on a map.
 * 
 * Requirements: 9.3
 */

import { useState, useEffect } from 'react';
import type { Engineer } from '@cueron/types';

interface TeamMapViewProps {
  agencyId?: string;
}

export function TeamMapView({ agencyId }: TeamMapViewProps) {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEngineer, setSelectedEngineer] = useState<Engineer | null>(null);

  const effectiveAgencyId = agencyId || 'current-agency-id'; // TODO: Get from auth context

  useEffect(() => {
    fetchActiveEngineers();
    
    // Set up real-time updates (polling for now, can be replaced with Supabase Realtime)
    const interval = setInterval(fetchActiveEngineers, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const fetchActiveEngineers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch engineers with on_job or travelling status
      const response = await fetch(
        `/api/agencies/${effectiveAgencyId}/engineers?status=on_job`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch engineers');
      }

      const data = await response.json();
      setEngineers(data.engineers.filter((e: Engineer) => e.current_location));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'on_job':
        return 'bg-blue-500';
      case 'offline':
        return 'bg-gray-500';
      case 'on_leave':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading && engineers.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">{error}</p>
        <button
          onClick={fetchActiveEngineers}
          className="mt-2 text-red-600 hover:text-red-800 font-medium"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Map Placeholder */}
      <div className="bg-gray-100 rounded-lg h-[600px] relative overflow-hidden">
        {/* This is a placeholder for the actual map implementation */}
        {/* In production, integrate with Google Maps or Mapbox */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <svg
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            <p className="text-gray-600 font-medium">Map View</p>
            <p className="text-gray-500 text-sm mt-1">
              Showing {engineers.length} active engineer(s)
            </p>
            <p className="text-gray-400 text-xs mt-2">
              Google Maps integration required for production
            </p>
          </div>
        </div>

        {/* Engineer Markers (Simulated) */}
        {engineers.map((engineer, index) => (
          <div
            key={engineer.id}
            className="absolute cursor-pointer"
            style={{
              left: `${20 + (index * 15) % 60}%`,
              top: `${30 + (index * 20) % 40}%`
            }}
            onClick={() => setSelectedEngineer(engineer)}
          >
            <div className="relative">
              <div className={`h-8 w-8 rounded-full ${getStatusColor(engineer.availability_status)} border-2 border-white shadow-lg flex items-center justify-center`}>
                <span className="text-white text-xs font-bold">
                  {engineer.name.charAt(0)}
                </span>
              </div>
              {/* Pulse animation for active engineers */}
              {engineer.availability_status === 'on_job' && (
                <div className={`absolute inset-0 h-8 w-8 rounded-full ${getStatusColor(engineer.availability_status)} animate-ping opacity-75`}></div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Engineer List Sidebar */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3">Active Engineers ({engineers.length})</h3>
        {engineers.length === 0 ? (
          <p className="text-gray-500 text-sm">No active engineers with location data</p>
        ) : (
          <div className="space-y-2">
            {engineers.map((engineer) => (
              <div
                key={engineer.id}
                className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  selectedEngineer?.id === engineer.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedEngineer(engineer)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${getStatusColor(engineer.availability_status)}`}></div>
                    <div>
                      <p className="font-medium text-sm">{engineer.name}</p>
                      <p className="text-xs text-gray-500">
                        {engineer.phone}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      {engineer.last_location_update
                        ? new Date(engineer.last_location_update).toLocaleTimeString()
                        : 'No update'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Selected Engineer Details */}
      {selectedEngineer && (
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Engineer Details</h3>
            <button
              onClick={() => setSelectedEngineer(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Name:</span>
              <p className="font-medium">{selectedEngineer.name}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Phone:</span>
              <p className="font-medium">{selectedEngineer.phone}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="font-medium capitalize">
                {selectedEngineer.availability_status.replace('_', ' ')}
              </p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Performance:</span>
              <p className="font-medium">
                {selectedEngineer.total_jobs_completed} jobs completed
                {' • '}
                ⭐ {selectedEngineer.average_rating.toFixed(1)}
              </p>
            </div>
            {selectedEngineer.last_location_update && (
              <div>
                <span className="text-sm text-gray-600">Last Update:</span>
                <p className="font-medium">
                  {new Date(selectedEngineer.last_location_update).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
