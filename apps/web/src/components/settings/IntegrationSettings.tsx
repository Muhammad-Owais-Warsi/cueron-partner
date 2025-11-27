'use client';

/**
 * Integration Settings Component
 * 
 * Interface for managing third-party integrations and API configurations.
 * 
 * Requirements: 1.1
 */

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
}

export function IntegrationSettings() {
  const { user } = useAuth();
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

  if (!user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please log in to view integration settings.</p>
      </div>
    );
  }

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
                  type="text"
                  value="••••••••••••••••••••••••••••••••"
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('whsec_1234567890abcdef1234567890abcdef');
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Copy
                </button>
              </div>
              <p className="text-xs text-gray-600 mt-1">
                Secret key for webhook signature verification
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* API Documentation */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">API Documentation</h3>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600 mb-3">
            Access our comprehensive API documentation for integration guides and endpoints.
          </p>
          <a
            href="https://docs.cueron.com/api"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            View Documentation
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {/* API Key Dialog */}
      {showApiKeyDialog && selectedIntegration && (
        <ApiKeyDialog
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

interface ApiKeyDialogProps {
  integration: Integration;
  onClose: () => void;
}

function ApiKeyDialog({ integration, onClose }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement API key update logic
    console.log('Updating API key for', integration.name, apiKey);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Configure {integration.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key
            </label>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                placeholder="Enter your API key"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showApiKey ? (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Enter your {integration.name} API key for integration
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}