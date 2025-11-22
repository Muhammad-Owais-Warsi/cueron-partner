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

type ViewMode = 'list' | 'map';

export default function TeamPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEngineerAdded = () => {
    setIsAddDialogOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleBulkUploadComplete = () => {
    setIsBulkUploadOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  return (
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
        <EngineersListView key={refreshKey} />
      ) : (
        <TeamMapView key={refreshKey} />
      )}

      {/* Dialogs */}
      <AddEngineerDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleEngineerAdded}
      />
      <BulkUploadDialog
        isOpen={isBulkUploadOpen}
        onClose={() => setIsBulkUploadOpen(false)}
        onSuccess={handleBulkUploadComplete}
      />
    </div>
  );
}
