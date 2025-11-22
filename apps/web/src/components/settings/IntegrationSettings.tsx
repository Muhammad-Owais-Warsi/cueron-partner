'use client';

/**
 * Integration Settings Component
 * 
 * Interface for managing third-party integrations and API configurations.
 * 
 * Requirements: 1.1
 */

import { useState } from 'react';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export function IntegrationSettings() {
  const [integrations] = useState<Integration[]>([
    {
      id: 'google-maps',
      name: 'Google Maps',
      description: 'Location services, distance calculation, and navigation',
      icon: '🗺️',
      status: 'connected',
      lastSync: new Date().toISOString(),
    },
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Payment processing and invoice generation',
      icon: '💳',
      status: 'connected',
      lastSync: new Date().toISOString(),
    },
    {
      id: 'fcm',
      name: 'Firebase Cloud Messaging',
      description: 'Push notifications for mobile and web',
      icon: '🔔',
      status: 'connected',
      lastSync: new Date().toISOString(),
    },
    {
      id: 'sms',
      name: 'SMS Gateway',
      description: 'SMS notifications via Twilio/MSG91',
      icon: '📱',
      status: 'disconnected',
    },
    {
      id: 'sentry',
      name: 'Sentry',
      description: 'Error tracking and monitoring',
      icon: '🐛',
      status: 'connected',
      lastSync: new Date().toISOString(),
    },
  ]);

  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Connected
          </span>
        );
      case 'disconnected':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Disconnected
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Error
          </span>
        );
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleConfigure = (integration: Integration) => {
    setSelectedIntegration(integration);
    setShowApiKeyDialog(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium text-gray-900">Third-Party Integrations</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage connections to external services and APIs
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-800">
              Integration settings are managed by system administrators. Contact support if you need to update API keys or connection settings.
            </p>
          </div>
        </div>
      </div>

      {/* Integrations List */}
      <div className="space-y-3">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="text-3xl">{integration.icon}</div>
                <div>
                  <h4 className="font-medium text-gray-900">{integration.name}</h4>
                  <p className="text-sm text-gray-600 mt-1">{integration.description}</p>
                  {integration.lastSync && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last synced: {formatDate(integration.lastSync)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(integration.status)}
                <button
                  onClick={() => handleConfigure(integration)}
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Webhook Configuration */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Webhook Configuration</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value="https://api.cueron.com/webhooks/payments"
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('https://api.cueron.com/webhooks/payments');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Use this URL for payment gateway webhook configuration
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Secret
              </label>
              <div className="flex gap-2">
                <input
                  type="password"
                  value="whsec_••••••••••••••••"
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
                  Regenerate
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Keep this secret secure and never share it publicly
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Documentation</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-700 mb-3">
            Access our API documentation to integrate with your own systems:
          </p>
          <a
            href="https://docs.cueron.com/api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View API Documentation
            <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* Configure Integration Dialog */}
      {showApiKeyDialog && selectedIntegration && (
        <ConfigureIntegrationDialog
          integration={selectedIntegration}
          onClose={() => {
            setShowApiKeyDialog(false);
            setSelectedIntegration(null);
          }}
        />
      )}
    </div>
  );
}

interface ConfigureIntegrationDialogProps {
  integration: Integration;
  onClose: () => void;
}

function ConfigureIntegrationDialog({ integration, onClose }: ConfigureIntegrationDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Configure {integration.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              Integration settings are managed at the system level. Please contact your administrator or support team to update these settings.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key / Secret
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter API key"
              disabled
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <div className="flex items-center space-x-2">
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                integration.status === 'connected' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {integration.status}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Close
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !apiKey}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  );
}
