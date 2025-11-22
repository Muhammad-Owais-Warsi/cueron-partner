'use client';

import { useState } from 'react';
import type { Engineer } from '@cueron/types/src/engineer';

interface EngineerWithDistance extends Engineer {
  distance_km: number;
  duration_minutes?: number;
}

interface EngineerSelectorProps {
  engineers: EngineerWithDistance[];
  selectedEngineerId: string | null;
  onSelect: (engineerId: string) => void;
}

export function EngineerSelector({
  engineers,
  selectedEngineerId,
  onSelect,
}: EngineerSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredEngineers = engineers.filter((engineer) =>
    engineer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    engineer.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-3">
      {/* Search Input */}
      <input
        type="text"
        placeholder="Search engineers..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {/* Engineers List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {filteredEngineers.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-4">
            {searchTerm ? 'No engineers found' : 'No available engineers'}
          </p>
        ) : (
          filteredEngineers.map((engineer) => (
            <button
              key={engineer.id}
              onClick={() => onSelect(engineer.id)}
              className={`w-full text-left p-3 rounded-lg border-2 transition-colors ${
                selectedEngineerId === engineer.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{engineer.name}</p>
                  <p className="text-sm text-gray-600">{engineer.phone}</p>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                      Level {engineer.skill_level}
                    </span>
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                      {engineer.availability_status}
                    </span>
                  </div>
                  {engineer.specializations && engineer.specializations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {engineer.specializations.slice(0, 3).map((spec, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm font-semibold text-gray-900">
                    {engineer.distance_km.toFixed(1)} km
                  </p>
                  {engineer.duration_minutes && (
                    <p className="text-xs text-gray-600">
                      ~{engineer.duration_minutes} min
                    </p>
                  )}
                  {engineer.average_rating > 0 && (
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-500 text-sm">★</span>
                      <span className="text-xs text-gray-600 ml-1">
                        {engineer.average_rating.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>

      {/* Summary */}
      {filteredEngineers.length > 0 && (
        <div className="text-xs text-gray-500 pt-2 border-t">
          Showing {filteredEngineers.length} of {engineers.length} available engineers
        </div>
      )}
    </div>
  );
}
