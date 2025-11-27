'use client';

/**
 * Agency Profile Settings Component
 * 
 * Form for editing agency profile information including contact details,
 * location, and bank account information.
 * 
 * Requirements: 1.1, 1.5
 */

import { useState, useEffect } from 'react';
import type { Agency, UpdateAgencyInput } from '@cueron/types';
import { useUserProfile } from '@/hooks/useAuth';

export function AgencyProfileSettings() {
  const { profile, loading: profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [agency, setAgency] = useState<Agency | null>(null);

  const [formData, setFormData] = useState<UpdateAgencyInput>({
    name: '',
    contact_person: '',
    phone: '',
    email: '',
    service_areas: [],
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    pan_number: '',
  });

  const [newServiceArea, setNewServiceArea] = useState('');

  // Get agency ID from user profile
  const agencyId = profile?.agency_id || profile?.agency?.id;

  useEffect(() => {
    if (profile && agencyId) {
      loadAgencyData();
    }
  }, [profile, agencyId]);

  const loadAgencyData = async () => {
    if (!agencyId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/agencies/${agencyId}`);
      
      if (!response.ok) {
        throw new Error('Failed to load agency data');
      }

      const data = await response.json();
      setAgency(data);
      
      // Populate form with existing data
      setFormData({
        name: data.name || '',
        contact_person: data.contact_person || '',
        phone: data.phone || '',
        email: data.email || '',
        service_areas: data.service_areas || [],
        bank_account_name: data.bank_account_name || '',
        bank_account_number: '', // Don't populate encrypted fields
        bank_ifsc: data.bank_ifsc || '',
        pan_number: '', // Don't populate encrypted fields
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agency data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!agencyId) {
      setError('Agency ID not found. Please refresh the page and try again.');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      // Only send fields that have values
      const updateData: UpdateAgencyInput = {};
      if (formData.name) updateData.name = formData.name;
      if (formData.contact_person) updateData.contact_person = formData.contact_person;
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.email) updateData.email = formData.email;
      if (formData.service_areas) updateData.service_areas = formData.service_areas;
      if (formData.bank_account_name) updateData.bank_account_name = formData.bank_account_name;
      if (formData.bank_account_number) updateData.bank_account_number = formData.bank_account_number;
      if (formData.bank_ifsc) updateData.bank_ifsc = formData.bank_ifsc;
      if (formData.pan_number) updateData.pan_number = formData.pan_number;

      const response = await fetch(`/api/agencies/${agencyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to update agency');
      }

      setSuccess(true);
      await loadAgencyData(); // Reload to get updated data
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const addServiceArea = () => {
    if (newServiceArea && !formData.service_areas?.includes(newServiceArea)) {
      setFormData(prev => ({
        ...prev,
        service_areas: [...(prev.service_areas || []), newServiceArea],
      }));
      setNewServiceArea('');
    }
  };

  const removeServiceArea = (area: string) => {
    setFormData(prev => ({
      ...prev,
      service_areas: prev.service_areas?.filter(a => a !== area),
    }));
  };

  if (profileLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">Please select an agency to view and edit profile settings.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-green-800 text-sm">Agency profile updated successfully!</p>
        </div>
      )}

      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agency Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contact Person *
            </label>
            <input
              type="text"
              value={formData.contact_person}
              onChange={(e) => setFormData(prev => ({ ...prev, contact_person: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
        </div>
      </div>

      {/* Service Areas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Service Areas</h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={newServiceArea}
              onChange={(e) => setNewServiceArea(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter city name"
            />
            <button
              type="button"
              onClick={addServiceArea}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add
            </button>
          </div>

          {formData.service_areas && formData.service_areas.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {formData.service_areas.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                >
                  {area}
                  <button
                    type="button"
                    onClick={() => removeServiceArea(area)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bank Details */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Account Details</h3>
        <p className="text-sm text-gray-600 mb-4">
          Bank account information is encrypted before storage. Leave fields empty to keep existing values.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder Name
            </label>
            <input
              type="text"
              value={formData.bank_account_name}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_account_name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <input
              type="text"
              value={formData.bank_account_number}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_account_number: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter to update"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code
            </label>
            <input
              type="text"
              value={formData.bank_ifsc}
              onChange={(e) => setFormData(prev => ({ ...prev, bank_ifsc: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              maxLength={11}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              PAN Number
            </label>
            <input
              type="text"
              value={formData.pan_number}
              onChange={(e) => setFormData(prev => ({ ...prev, pan_number: e.target.value.toUpperCase() }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter to update"
              maxLength={10}
            />
          </div>
        </div>
      </div>

      {/* Agency Info (Read-only) */}
      {agency && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Agency Information</h3>
          <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm text-gray-600">Type:</span>
              <p className="font-medium">{agency.type}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">GSTN:</span>
              <p className="font-medium">{agency.gstn}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Partnership Tier:</span>
              <p className="font-medium capitalize">{agency.partnership_tier}</p>
            </div>
            <div>
              <span className="text-sm text-gray-600">Status:</span>
              <p className="font-medium capitalize">{agency.status.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}