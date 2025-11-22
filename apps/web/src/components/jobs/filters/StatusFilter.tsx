/**
 * Status Filter Component
 * Multi-select dropdown for job status filtering
 * Requirement: 18.2
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import type { JobStatus } from '@cueron/types';

interface StatusFilterProps {
  selectedStatuses: JobStatus[];
  onChange: (statuses: JobStatus[]) => void;
  disabled?: boolean;
}

const STATUS_OPTIONS: { value: JobStatus; label: string; color: string }[] = [
  { value: 'pending', label: 'Pending', color: 'bg-gray-100 text-gray-800' },
  { value: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-800' },
  { value: 'accepted', label: 'Accepted', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'travelling', label: 'Travelling', color: 'bg-purple-100 text-purple-800' },
  { value: 'onsite', label: 'On Site', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' },
];

export function StatusFilter({ selectedStatuses, onChange, disabled }: StatusFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = (status: JobStatus) => {
    if (selectedStatuses.includes(status)) {
      onChange(selectedStatuses.filter((s) => s !== status));
    } else {
      onChange([...selectedStatuses, status]);
    }
  };

  const getStatusLabel = (status: JobStatus) => {
    return STATUS_OPTIONS.find((opt) => opt.value === status)?.label || status;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        <span className="truncate">
          {selectedStatuses.length === 0
            ? 'All statuses'
            : selectedStatuses.length === 1
            ? getStatusLabel(selectedStatuses[0])
            : `${selectedStatuses.length} selected`}
        </span>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
          {STATUS_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedStatuses.includes(option.value)}
                onChange={() => handleToggle(option.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-3 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${option.color}`}>
                  {option.label}
                </span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
