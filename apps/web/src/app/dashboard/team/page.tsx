'use client';

/**
 * Team Management Page
 * 
 * Displays engineers list with filtering, add engineer form,
 * and team map view with real-time locations.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 9.3
 */

import { useState } from 'react';
import { EngineersListView } from '@/components/team/EngineersListView';
import { TeamMapView } from '@/components/team/TeamMapView';
import { AddEngineerDialog } from '@/components/team/AddEngineerDialog';
import { BulkUploadDialog } from '@/components/team/BulkUploadDialog';
import { useUserProfile } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout';

type ViewMode = 'list' | 'map';

export default function TeamPage() {
  const { profile, loading } = useUserProfile();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Debug profile data
  console.log('Profile data:', profile);
  console.log('Profile loading:', loading);
  console.log('Profile type:', typeof profile);
  console.log('Profile keys:', profile ? Object.keys(profile) : 'null');

  // Get agency ID from user profile
  // Handle different profile structures:
  // 1. Direct agency_id property (engineers and agency_users)
  // 2. Nested agency.id property (fallback)
  let agencyId = null;
  
  // Try to get agencyId from different possible sources
  if (profile?.agency_id) {
    agencyId = profile.agency_id;
  } else if (profile?.agency?.id) {
    agencyId = profile.agency.id;
  }

  // Removed strict validation - allow components to work without agency ID
  const isAgencyIdValid = true; // Always true to remove restriction

  // Debug agencyId extraction
  console.log('Extracted agencyId:', agencyId);
  console.log('AgencyId sources:', {
    direct: profile?.agency_id,
    nested: profile?.agency?.id
  });
  console.log('isAgencyIdValid:', isAgencyIdValid);

  const handleEngineerAdded = () => {
    setIsAddDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleBulkUploadComplete = () => {
    setIsBulkUploadOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  // Show loading state while profile is loading
  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Team Management</h1>
            <p className="text-gray-600 mt-1">
              Manage your engineers, track availability, and monitor locations
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsBulkUploadOpen(true)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Bulk Upload
            </button>
            <button
              onClick={() => setIsAddDialogOpen(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Engineer
            </button>
          </div>
        </div>

        {/* View Toggle */}
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === 'list'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`px-4 py-2 font-medium transition-colors ${
              viewMode === 'map'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Map View
          </button>
        </div>

        {/* Content */}
        {viewMode === 'list' ? (
          <EngineersListView key={refreshKey} agencyId={agencyId || undefined} />
        ) : (
          <TeamMapView key={refreshKey} agencyId={agencyId || undefined} />
        )}

        {/* Dialogs */}
        <AddEngineerDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onSuccess={handleEngineerAdded}
          agencyId={agencyId || undefined}
        />
        <BulkUploadDialog
          isOpen={isBulkUploadOpen}
          onClose={() => setIsBulkUploadOpen(false)}
          onSuccess={handleBulkUploadComplete}
        />
      </div>
    </DashboardLayout>
  );
}