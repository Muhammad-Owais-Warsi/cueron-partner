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
  // Debug agencyId
  console.log('AddEngineerDialog - agencyId received:', agencyId);
  console.log('AddEngineerDialog - agencyId type:', typeof agencyId);
  console.log('AddEngineerDialog - agencyId truthy check:', !!agencyId);

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

  // Removed agency validation - allow adding engineers without agency ID
  // The API will handle agency assignment if needed

  if (!isOpen) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError(null);

      // Prepare complete engineer data with all required fields
      const engineerData: CreateEngineerInput = {
        agency_id: agencyId || '', // Will be handled by API if empty
        name: formData.name || '',
        phone: formData.phone || '',
        email: formData.email,
        photo_url: formData.photo_url,
        skill_level: formData.skill_level || 3,
        specializations: formData.specializations || [],
        certifications: formData.certifications || [],
        employment_type: formData.employment_type || 'full_time'
      };

      const response = await fetch(`/api/agencies/${agencyId || 'unknown'}/engineers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(engineerData)
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
                  <option value="contract">Contract</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Certifications */}
          {step === 2 && (
            <div className="space-y-6">
              <h3 className="font-medium text-lg">Skills & Certifications</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Skill Level
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, skill_level: level as SkillLevel }))}
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        formData.skill_level === level
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  1: Beginner - 5: Expert
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specializations
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.specializations?.map((spec, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => {
                          const newSpecs = [...(formData.specializations || [])];
                          newSpecs.splice(index, 1);
                          setFormData(prev => ({ ...prev, specializations: newSpecs }));
                        }}
                        className="ml-1.5 inline-flex text-blue-600 hover:text-blue-800"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      e.preventDefault();
                      const newSpec = e.currentTarget.value.trim();
                      if (!formData.specializations?.includes(newSpec)) {
                        setFormData(prev => ({
                          ...prev,
                          specializations: [...(prev.specializations || []), newSpec]
                        }));
                      }
                      e.currentTarget.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type specialization and press Enter"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Certifications
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (certificationInput.type && certificationInput.cert_number) {
                        setFormData(prev => ({
                          ...prev,
                          certifications: [...(prev.certifications || []), {
                            type: certificationInput.type || 'ITI',
                            level: certificationInput.level || 1,
                            cert_number: certificationInput.cert_number || '',
                            verified: certificationInput.verified || false
                          }]
                        }));
                        setCertificationInput({
                          type: 'ITI',
                          level: 1,
                          cert_number: '',
                          verified: false
                        });
                      }
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Add Certification
                  </button>
                </div>
                
                {formData.certifications && formData.certifications.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {formData.certifications.map((cert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{cert.type}</span> - {cert.cert_number}
                          <span className="text-xs text-gray-500 ml-2">
                            Level {cert.level} {cert.verified && '(Verified)'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const newCerts = [...(formData.certifications || [])];
                            newCerts.splice(index, 1);
                            setFormData(prev => ({ ...prev, certifications: newCerts }));
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certification Type
                    </label>
                    <select
                      value={certificationInput.type}
                      onChange={(e) => setCertificationInput(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="PMKVY">PMKVY</option>
                      <option value="ITI">ITI</option>
                      <option value="NSDC">NSDC</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Level
                    </label>
                    <select
                      value={certificationInput.level}
                      onChange={(e) => setCertificationInput(prev => ({ ...prev, level: parseInt(e.target.value) as 1 | 2 | 3 }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value={1}>Level 1</option>
                      <option value={2}>Level 2</option>
                      <option value={3}>Level 3</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Certificate Number
                    </label>
                    <input
                      type="text"
                      value={certificationInput.cert_number}
                      onChange={(e) => setCertificationInput(prev => ({ ...prev, cert_number: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter certificate number"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={certificationInput.verified}
                        onChange={(e) => setCertificationInput(prev => ({ ...prev, verified: e.target.checked }))}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-600">Verified</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="font-medium text-lg">Review Information</h3>
              
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div>
                  <span className="text-sm text-gray-600">Name:</span>
                  <p className="font-medium">{formData.name}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Phone:</span>
                  <p className="font-medium">{formData.phone}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Email:</span>
                  <p className="font-medium">{formData.email || 'Not provided'}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Employment Type:</span>
                  <p className="font-medium">{formData.employment_type}</p>
                </div>
                
                <div>
                  <span className="text-sm text-gray-600">Skill Level:</span>
                  <p className="font-medium">{formData.skill_level}</p>
                </div>
                
                {formData.specializations && formData.specializations.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Specializations:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {formData.specializations.map((spec, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {formData.certifications && formData.certifications.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Certifications:</span>
                    <p className="font-medium">{formData.certifications.length} certification(s)</p>
                  </div>
                )}
              </div>
              
              <div className="text-sm text-gray-600">
                <p>Agency ID: {agencyId || 'Not specified'}</p>
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