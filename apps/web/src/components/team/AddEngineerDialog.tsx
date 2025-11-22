'use client';

/**
 * Add Engineer Dialog Component
 * 
 * Multi-step form for adding a new engineer with validation.
 * 
 * Requirements: 2.1, 2.2, 2.3, 2.4
 */

import { useState } from 'react';
import type { CreateEngineerInput, Certification, SkillLevel, EmploymentType } from '@cueron/types';

interface AddEngineerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agencyId?: string;
}

export function AddEngineerDialog({ isOpen, onClose, onSuccess, agencyId }: AddEngineerDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<CreateEngineerInput>>({
    name: '',
    phone: '',
    email: '',
    skill_level: 3,
    specializations: [],
    certifications: [],
    employment_type: 'full_time'
  });

  const [certificationInput, setCertificationInput] = useState<Partial<Certification>>({
    type: 'ITI',
    level: 1,
    cert_number: '',
    verified: false
  });

  const effectiveAgencyId = agencyId || 'current-agency-id'; // TODO: Get from auth context

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/agencies/${effectiveAgencyId}/engineers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message || 'Failed to create engineer');
      }

      onSuccess();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      skill_level: 3,
      specializations: [],
      certifications: [],
      employment_type: 'full_time'
    });
    setCertificationInput({
      type: 'ITI',
      level: 1,
      cert_number: '',
      verified: false
    });
    setStep(1);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addCertification = () => {
    if (certificationInput.cert_number) {
      setFormData(prev => ({
        ...prev,
        certifications: [
          ...(prev.certifications || []),
          certificationInput as Certification
        ]
      }));
      setCertificationInput({
        type: 'ITI',
        level: 1,
        cert_number: '',
        verified: false
      });
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications?.filter((_, i) => i !== index)
    }));
  };

  const addSpecialization = (spec: string) => {
    if (spec && !formData.specializations?.includes(spec)) {
      setFormData(prev => ({
        ...prev,
        specializations: [...(prev.specializations || []), spec]
      }));
    }
  };

  const removeSpecialization = (spec: string) => {
    setFormData(prev => ({
      ...prev,
      specializations: prev.specializations?.filter(s => s !== spec)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Add New Engineer</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {/* Progress Steps */}
          <div className="flex items-center mt-4 space-x-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`h-2 flex-1 rounded ${
                    s <= step ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-4">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Step 1: Basic Information */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter engineer's full name"
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
                  placeholder="10-digit phone number"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="engineer@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Employment Type *
                </label>
                <select
                  value={formData.employment_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, employment_type: e.target.value as EmploymentType }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="gig">Gig</option>
                  <option value="apprentice">Apprentice</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Certifications */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Skills & Certifications</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Level *
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, skill_level: level as SkillLevel }))}
                      className={`flex-1 py-2 rounded-lg border-2 transition-colors ${
                        formData.skill_level === level
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      Level {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specializations
                </label>
                <div className="flex gap-2 mb-2">
                  {['Cold Storage', 'Industrial HVAC', 'Commercial AC', 'Refrigeration'].map((spec) => (
                    <button
                      key={spec}
                      type="button"
                      onClick={() => addSpecialization(spec)}
                      className="px-3 py-1 text-sm border border-gray-300 rounded-full hover:bg-gray-50"
                    >
                      + {spec}
                    </button>
                  ))}
                </div>
                {formData.specializations && formData.specializations.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.specializations.map((spec) => (
                      <span
                        key={spec}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                      >
                        {spec}
                        <button
                          type="button"
                          onClick={() => removeSpecialization(spec)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Certifications
                </label>
                <div className="space-y-2 mb-3">
                  <div className="flex gap-2">
                    <select
                      value={certificationInput.type}
                      onChange={(e) => setCertificationInput(prev => ({ ...prev, type: e.target.value as any }))}
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    >
                      <option value="ITI">ITI</option>
                      <option value="PMKVY">PMKVY</option>
                      <option value="NSDC">NSDC</option>
                      <option value="Other">Other</option>
                    </select>
                    <input
                      type="number"
                      value={certificationInput.level}
                      onChange={(e) => setCertificationInput(prev => ({ ...prev, level: parseInt(e.target.value) }))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Level"
                      min="1"
                      max="5"
                    />
                    <input
                      type="text"
                      value={certificationInput.cert_number}
                      onChange={(e) => setCertificationInput(prev => ({ ...prev, cert_number: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                      placeholder="Certificate Number"
                    />
                    <button
                      type="button"
                      onClick={addCertification}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
                {formData.certifications && formData.certifications.length > 0 && (
                  <div className="space-y-2">
                    {formData.certifications.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">{cert.type}</span> - Level {cert.level}
                          <span className="text-gray-600 ml-2">({cert.cert_number})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeCertification(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Review & Confirm</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{formData.name}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <p className="font-medium">{formData.phone}</p>
                </div>
                {formData.email && (
                  <div>
                    <span className="text-sm text-gray-600">Email:</span>
                    <p className="font-medium">{formData.email}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-gray-600">Skill Level:</span>
                  <p className="font-medium">Level {formData.skill_level}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Employment Type:</span>
                  <p className="font-medium capitalize">{formData.employment_type?.replace('_', ' ')}</p>
                </div>
                {formData.specializations && formData.specializations.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Specializations:</span>
                    <p className="font-medium">{formData.specializations.join(', ')}</p>
                  </div>
                )}
                {formData.certifications && formData.certifications.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Certifications:</span>
                    <p className="font-medium">{formData.certifications.length} certification(s)</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between">
          <button
            onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            onClick={() => step < 3 ? setStep(step + 1) : handleSubmit()}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading || !formData.name || !formData.phone}
          >
            {loading ? 'Creating...' : step === 3 ? 'Create Engineer' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
