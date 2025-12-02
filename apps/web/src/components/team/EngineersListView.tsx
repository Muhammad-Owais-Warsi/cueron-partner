'use client';

/**
 * Engineers List View Component
 * 
 * Displays paginated list of engineers with search and filtering capabilities.
 * Shows engineer details, certifications, ratings, and availability status.
 * 
 * Requirements: 2.1, 2.2, 2.5
 */

import { useState, useEffect } from 'react';
import type { Engineer } from '@cueron/types';
import { useUserProfile } from '@/hooks/useAuth';

interface EngineersListViewProps {
  agencyId?: string;
}

export function EngineersListView({ agencyId: propAgencyId }: EngineersListViewProps) {
  const { profile: userProfile } = useUserProfile();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    skillLevel: '',
    availability: '',
    specialization: '',
  });

  // Get agency ID from props or user profile
  const effectiveAgencyId = propAgencyId || userProfile?.agency?.id || null;
  
  // Removed strict validation - allow component to work without agency ID
  const isAgencyIdValid = true; // Always true to remove restriction

  console.log('EngineersListView - effectiveAgencyId:', effectiveAgencyId);
  console.log('EngineersListView - isAgencyIdValid:', isAgencyIdValid);

  useEffect(() => {
    if (isAgencyIdValid) {
      loadEngineers();
    } else {
      setError('No agency selected. Please select an agency to view engineers.');
      setLoading(false);
    }
  }, [isAgencyIdValid, currentPage, searchTerm, filters]);

  const loadEngineers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        search: searchTerm,
        skill_level: filters.skillLevel,
        availability: filters.availability,
        specialization: filters.specialization,
      });

      const response = await fetch(`/api/agencies/${effectiveAgencyId}/engineers?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to load engineers');
      }

      const data = await response.json();
      setEngineers(data.engineers || data);
      setTotalPages(data.pagination?.total_pages || 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while loading engineers');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value,
    }));
    setCurrentPage(1);
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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Search and Filters */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search engineers by name or specialization..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filters */}
          <div className="flex gap-2">
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <select
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={filters.skillLevel}
                onChange={(e) => handleFilterChange('skillLevel', e.target.value)}
              >
                <option value="">All Levels</option>
                <option value="1">Level 1</option>
                <option value="2">Level 2</option>
                <option value="3">Level 3</option>
                <option value="4">Level 4</option>
                <option value="5">Level 5</option>
              </select>
            </div>

            <div className="relative">
              <select
                className="pl-4 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                value={filters.availability}
                onChange={(e) => handleFilterChange('availability', e.target.value)}
              >
                <option value="">All Status</option>
                <option value="available">Available</option>
                <option value="on_job">On Job</option>
                <option value="offline">Offline</option>
                <option value="on_leave">On Leave</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Engineers List */}
      <div className="divide-y divide-gray-200">
        {engineers.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No engineers found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || Object.values(filters).some(Boolean)
                ? 'No engineers match your search criteria.'
                : 'Get started by adding a new engineer.'}
            </p>
          </div>
        ) : (
          engineers.map((engineer) => (
            <div key={engineer.id} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
                    <span className="text-gray-500 font-medium">
                      {engineer.name.charAt(0).toUpperCase()}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-medium text-gray-900 truncate">
                        {engineer.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        engineer.availability_status === 'available' 
                          ? 'bg-green-100 text-green-800'
                          : engineer.availability_status === 'on_job'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {engineer.availability_status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{engineer.phone}</span>
                      {engineer.email && <span>{engineer.email}</span>}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {/* Skill Level */}
                      <div className="flex items-center space-x-1">
                        <div className="h-4 w-4 text-yellow-400">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        </div>
                        <span className="text-sm text-gray-600">
                          Level {engineer.skill_level}
                        </span>
                      </div>

                      {/* Location */}
                      {engineer.current_location && (
                        <div className="flex items-center space-x-1">
                          <div className="h-4 w-4 text-gray-400">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <span className="text-sm text-gray-600">
                            Located
                          </span>
                        </div>
                      )}

                      {/* Specializations */}
                      {engineer.specializations && engineer.specializations.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {engineer.specializations.slice(0, 2).map((spec) => (
                            <span
                              key={spec}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {spec}
                            </span>
                          ))}
                          {engineer.specializations.length > 2 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{engineer.specializations.length - 2}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Certifications */}
                    {engineer.certifications && engineer.certifications.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {engineer.certifications.slice(0, 3).map((cert, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800"
                          >
                            {cert.type} L{cert.level}
                          </span>
                        ))}
                        {engineer.certifications.length > 3 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            +{engineer.certifications.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col items-end space-y-2">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {engineer.total_jobs_completed}
                    </p>
                    <p className="text-xs text-gray-500">Jobs</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {engineer.average_rating.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {engineers.length > 0 && totalPages > 1 && (
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded-md text-sm font-medium bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}