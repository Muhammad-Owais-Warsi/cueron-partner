/**
 * Location Filter Component
 * Geographic filtering with map integration
 * Requirement: 18.4
 */

'use client';

import { useState } from 'react';

interface LocationFilterProps {
  location?: {
    lat: number;
    lng: number;
    radius_km: number;
  };
  onChange: (location?: { lat: number; lng: number; radius_km: number }) => void;
  disabled?: boolean;
}

export function LocationFilter({ location, onChange, disabled }: LocationFilterProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempLat, setTempLat] = useState(location?.lat.toString() || '');
  const [tempLng, setTempLng] = useState(location?.lng.toString() || '');
  const [tempRadius, setTempRadius] = useState(location?.radius_km.toString() || '10');

  const handleApply = () => {
    const lat = parseFloat(tempLat);
    const lng = parseFloat(tempLng);
    const radius = parseFloat(tempRadius);

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(radius)) {
      onChange({ lat, lng, radius_km: radius });
      setIsModalOpen(false);
    }
  };

  const handleClear = () => {
    onChange(undefined);
    setTempLat('');
    setTempLng('');
    setTempRadius('10');
    setIsModalOpen(false);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
      <button
        type="button"
        onClick={() => !disabled && setIsModalOpen(true)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className="truncate">
          {location
            ? `Within ${location.radius_km}km`
            : 'All locations'}
        </span>
        <svg
          className="w-5 h-5 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Location Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Filter by Location
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLat}
                    onChange={(e) => setTempLat(e.target.value)}
                    placeholder="e.g., 28.6139"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={tempLng}
                    onChange={(e) => setTempLng(e.target.value)}
                    placeholder="e.g., 77.2090"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Radius (km)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={tempRadius}
                    onChange={(e) => setTempRadius(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-xs text-blue-800">
                    <strong>Tip:</strong> Enter coordinates to filter jobs within a specific radius.
                    You can get coordinates from Google Maps.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClear}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Clear
                </button>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApply}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
