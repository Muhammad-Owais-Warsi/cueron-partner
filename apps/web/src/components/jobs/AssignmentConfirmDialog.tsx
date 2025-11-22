'use client';

import type { Engineer } from '@cueron/types/src/engineer';
import type { Job } from '@cueron/types/src/job';

interface EngineerWithDistance extends Engineer {
  distance_km: number;
  duration_minutes?: number;
}

interface AssignmentConfirmDialogProps {
  engineer: EngineerWithDistance;
  job: Job;
  onConfirm: () => void;
  onCancel: () => void;
  isAssigning: boolean;
}

export function AssignmentConfirmDialog({
  engineer,
  job,
  onConfirm,
  onCancel,
  isAssigning,
}: AssignmentConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Confirm Assignment</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Assigning Engineer</p>
            <p className="font-semibold text-gray-900">{engineer.name}</p>
            <p className="text-sm text-gray-600">{engineer.phone}</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">To Job</p>
            <p className="font-semibold text-gray-900">{job.job_number}</p>
            <p className="text-sm text-gray-600">{job.client_name}</p>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Distance</p>
              <p className="font-medium text-gray-900">
                {engineer.distance_km.toFixed(1)} km
              </p>
            </div>
            {engineer.duration_minutes && (
              <div>
                <p className="text-sm text-gray-600">Est. Travel Time</p>
                <p className="font-medium text-gray-900">
                  ~{engineer.duration_minutes} min
                </p>
              </div>
            )}
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-gray-600">Engineer Details</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded">
                Skill Level {engineer.skill_level}
              </span>
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                {engineer.availability_status}
              </span>
              {engineer.average_rating > 0 && (
                <span className="text-xs px-2 py-1 bg-yellow-50 text-yellow-700 rounded">
                  ★ {engineer.average_rating.toFixed(1)}
                </span>
              )}
            </div>
          </div>

          {/* Warning if skill level doesn't match */}
          {engineer.skill_level < job.required_skill_level && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> Engineer's skill level ({engineer.skill_level}) is below the required level ({job.required_skill_level}) for this job.
              </p>
            </div>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={onCancel}
            disabled={isAssigning}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isAssigning}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isAssigning ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Assigning...
              </>
            ) : (
              'Confirm Assignment'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
