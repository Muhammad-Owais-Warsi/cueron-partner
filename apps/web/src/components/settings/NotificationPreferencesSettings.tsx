'use client';

/**
 * Notification Preferences Settings Component
 * 
 * Interface for managing notification preferences including channels
 * (push, email, SMS) and notification types.
 * 
 * Requirements: 14.1
 */

import { useState, useEffect } from 'react';
import type { NotificationPreferences, NotificationType } from '@/lib/notifications/types';

export function NotificationPreferencesSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [preferences, setPreferences] = useState<NotificationPreferences>({
    userId: '',
    enablePush: true,
    enableEmail: true,
    enableSms: false,
    notificationTypes: {
      job_assigned: true,
      job_accepted: true,
      job_status_update: true,
      job_completed: true,
      payment_received: true,
      payment_pending: true,
      engineer_added: false,
      agency_approved: true,
      system_alert: true,
    },
  });

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications/preferences');
      
      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      }
    } catch (err) {
      setError('Failed to load notification preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const notificationTypeLabels: Record<NotificationType, { label: string; description: string }> = {
    job_assigned: {
      label: 'Job Assigned',
      description: 'When a new job is assigned to your agency',
    },
    job_accepted: {
      label: 'Job Accepted',
      description: 'When an engineer accepts a job assignment',
    },
    job_status_update: {
      label: 'Job Status Updates',
      description: 'When job status changes (travelling, onsite, etc.)',
    },
    job_completed: {
      label: 'Job Completed',
      description: 'When an engineer completes a job',
    },
    payment_received: {
      label: 'Payment Received',
      description: 'When a payment is successfully processed',
    },
    payment_pending: {
      label: 'Payment Pending',
      description: 'When a payment is due or pending',
    },
    engineer_added: {
      label: 'Engineer Added',
      description: 'When a new engineer is added to your team',
    },
    agency_approved: {
      label: 'Agency Approved',
      description: 'When your agency status changes',
    },
    system_alert: {
      label: 'System Alerts',
      description: 'Important system notifications and updates',
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">Notification preferences updated successfully!</p>
        </div>
      )}

      {/* Notification Channels */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Channels</h3>
        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <div className="font-medium text-gray-900">Push Notifications</div>
              <div className="text-sm text-gray-600">Receive notifications in the web dashboard</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.enablePush}
              onChange={(e) => setPreferences(prev => ({ ...prev, enablePush: e.target.checked }))}
              className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <div className="font-medium text-gray-900">Email Notifications</div>
              <div className="text-sm text-gray-600">Receive notifications via email</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.enableEmail}
              onChange={(e) => setPreferences(prev => ({ ...prev, enableEmail: e.target.checked }))}
              className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <div>
              <div className="font-medium text-gray-900">SMS Notifications</div>
              <div className="text-sm text-gray-600">Receive critical notifications via SMS</div>
            </div>
            <input
              type="checkbox"
              checked={preferences.enableSms}
              onChange={(e) => setPreferences(prev => ({ ...prev, enableSms: e.target.checked }))}
              className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Notification Types */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Notification Types</h3>
        <p className="text-sm text-gray-600 mb-4">
          Choose which types of notifications you want to receive
        </p>
        <div className="space-y-2">
          {(Object.keys(notificationTypeLabels) as NotificationType[]).map((type) => (
            <label
              key={type}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              <div>
                <div className="font-medium text-gray-900 text-sm">
                  {notificationTypeLabels[type].label}
                </div>
                <div className="text-xs text-gray-600">
                  {notificationTypeLabels[type].description}
                </div>
              </div>
              <input
                type="checkbox"
                checked={preferences.notificationTypes[type] ?? false}
                onChange={(e) => setPreferences(prev => ({
                  ...prev,
                  notificationTypes: {
                    ...prev.notificationTypes,
                    [type]: e.target.checked,
                  },
                }))}
                className="h-4 w-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
