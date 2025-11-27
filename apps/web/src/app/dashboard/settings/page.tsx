'use client';

/**
 * Settings Page
 * 
 * Main settings page with tabs for different settings sections.
 * 
 * Requirements: 1.1, 1.5, 11.1, 14.1
 */

import { useState } from 'react';
import { AgencyProfileSettings } from '@/components/settings/AgencyProfileSettings';
import { UserManagementSettings } from '@/components/settings/UserManagementSettings';
import { NotificationPreferencesSettings } from '@/components/settings/NotificationPreferencesSettings';
import { PaymentSettings } from '@/components/settings/PaymentSettings';
import { IntegrationSettings } from '@/components/settings/IntegrationSettings';
import { DashboardLayout } from '@/components/layout';

type SettingsTab = 'profile' | 'users' | 'notifications' | 'payments' | 'integrations';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile' as const, label: 'Agency Profile', icon: '🏢' },
    { id: 'users' as const, label: 'User Management', icon: '👥' },
    { id: 'notifications' as const, label: 'Notifications', icon: '🔔' },
    { id: 'payments' as const, label: 'Payment Settings', icon: '💳' },
    { id: 'integrations' as const, label: 'Integrations', icon: '🔌' },
  ];

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-1">Manage your agency settings and preferences</p>
        </div>

        <div className="bg-white rounded-lg shadow">
          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-6 py-4 text-sm font-medium border-b-2 transition-colors
                    ${
                      activeTab === tab.id
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                    }
                  `}
                >
                  <span className="mr-2">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {activeTab === 'profile' && <AgencyProfileSettings />}
            {activeTab === 'users' && <UserManagementSettings />}
            {activeTab === 'notifications' && <NotificationPreferencesSettings />}
            {activeTab === 'payments' && <PaymentSettings />}
            {activeTab === 'integrations' && <IntegrationSettings />}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}