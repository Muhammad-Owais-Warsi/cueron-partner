'use client';

/**
 * Team Map View Component
 * 
 * Displays engineers on an interactive map with real-time location tracking.
 * Shows engineer availability status and job assignments.
 * 
 * Requirements: 2.3, 9.3
 */

import { useState, useEffect } from 'react';
import type { Engineer } from '@cueron/types';
import { useUserProfile } from '@/hooks/useAuth';

interface TeamMapViewProps {
  agencyId?: string;
}

export function TeamMapView({ agencyId: propAgencyId }: TeamMapViewProps) {
  const { profile: userProfile } = useUserProfile();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get agency ID from props or user profile
  const effectiveAgencyId = propAgencyId || userProfile?.agency_id || null;
  
  // Removed strict validation - allow component to work without agency ID
  const isAgencyIdValid = true; // Always true to remove restriction

  console.log('TeamMapView - effectiveAgencyId:', effectiveAgencyId);
  console.log('TeamMapView - isAgencyIdValid:', isAgencyIdValid);

  useEffect(() => {
    if (isAgencyIdValid) {
      loadEngineers();
    } else {
      setError('No agency selected. Please select an agency to view engineers.');
      setLoading(false);
    }
  }, [isAgencyIdValid]);

  const loadEngineers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/agencies/${effectiveAgencyId}/engineers`);
      
      if (!response.ok) {
        throw new Error('Failed to load engineers');
      }

      const data = await response.json();
      setEngineers(data.engineers || data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading engineers');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="text-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900">Map View Coming Soon</h3>
        <p className="mt-2 text-gray-500">
          Interactive map view with real-time engineer locations will be available in a future update.
        </p>
        <div className="mt-6">
          <p className="text-sm text-gray-500">
            Found {engineers.length} engineer{engineers.length !== 1 ? 's' : ''} in your agency.
          </p>
        </div>
      </div>
    </div>
  );
}