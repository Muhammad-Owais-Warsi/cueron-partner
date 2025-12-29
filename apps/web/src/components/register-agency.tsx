'use client';
import React, { useState } from 'react';
import {
  X,
  MapPin,
  CheckCircle,
  Building2,
  Users,
  MapPinned,
  Handshake,
  CreditCard,
  Shield,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
// import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Spinner } from './ui/spinner';
import { CreateAgencyInput } from '@cueron/types';
import { toast } from 'sonner';
// import { Alert, AlertDescription } from '@/components/ui/alert';

type AgencyType = 'ITI' | 'Training' | 'Service' | 'Vendor';
type PartnershipTier = 'standard' | 'premium' | 'enterprise';
type PartnershipModel = 'job_placement' | 'dedicated_resource' | 'training_placement';
type AgencyStatus = 'pending_approval' | 'active' | 'suspended' | 'inactive';

const FORM_STEPS = [
  {
    step: 1,
    title: 'Basic Information',
    fields: [
      {
        name: 'name',
        label: 'Agency Name',
        type: 'text',
        required: true,
        placeholder: 'Enter agency name',
      },
      {
        name: 'type',
        label: 'Agency Type',
        type: 'select',
        required: true,
        options: [
          { value: 'ITI', label: 'ITI' },
          { value: 'Training', label: 'Training' },
          { value: 'Service', label: 'Service' },
          { value: 'Vendor', label: 'Vendor' },
        ],
      },
      {
        name: 'registration_number',
        label: 'Registration Number',
        type: 'text',
        required: true,
        placeholder: 'Registration number',
      },
      {
        name: 'gstn',
        label: 'GSTN',
        type: 'text',
        required: true,
        placeholder: 'GSTN of the agency',
      },
      {
        name: 'nsdc_code',
        label: 'NSDC Code',
        type: 'text',
        required: false,
        placeholder: 'Optional NSDC Code',
      },
    ],
  },
  {
    step: 2,
    title: 'Contact Information',
    fields: [
      {
        name: 'contact_person',
        label: 'Contact Person',
        type: 'text',
        required: true,
        placeholder: 'Enter contact person name',
      },
      {
        name: 'phone',
        label: 'Phone Number',
        type: 'text',
        required: true,
        placeholder: '10-digit phone number',
      },
      {
        name: 'email',
        label: 'Email',
        type: 'text',
        required: true,
        placeholder: 'agency@example.com',
      },
    ],
  },
  {
    step: 3,
    title: 'Primary Location',
    fields: [
      {
        name: 'address',
        label: 'Full Address',
        type: 'text',
        required: true,
        placeholder: 'Street, building, etc.',
      },
      { name: 'city', label: 'City', type: 'text', required: true, placeholder: 'City name' },
      { name: 'state', label: 'State', type: 'text', required: true, placeholder: 'State name' },
      {
        name: 'pincode',
        label: 'PIN Code',
        type: 'text',
        required: false,
        placeholder: 'Optional PIN code',
      },
      { name: 'lat', label: 'Latitude', type: 'number', required: true },
      { name: 'lng', label: 'Longitude', type: 'number', required: true },
      {
        name: 'service_areas',
        label: 'Service Areas',
        type: 'multi_select',
        placeholder: 'Add service area & press Enter',
        required: false,
      },
    ],
  },
  {
    step: 4,
    title: 'Partnership Details',
    fields: [
      {
        name: 'partnership_tier',
        label: 'Partnership Tier',
        type: 'select',
        required: true,
        options: [
          { value: 'standard', label: 'Standard' },
          { value: 'premium', label: 'Premium' },
          { value: 'enterprise', label: 'Enterprise' },
        ],
      },
      {
        name: 'partnership_model',
        label: 'Partnership Model',
        type: 'select',
        required: true,
        options: [
          { value: 'job_placement', label: 'Job Placement' },
          { value: 'dedicated_resource', label: 'Dedicated Resource' },
          { value: 'training_placement', label: 'Training + Placement' },
        ],
      },
      {
        name: 'engineer_capacity',
        label: 'Engineer Capacity',
        type: 'number',
        required: true,
        placeholder: 'How many engineers available?',
      },
    ],
  },
  {
    step: 5,
    title: 'Bank Details',
    fields: [
      { name: 'bank_account_name', label: 'Account Holder Name', type: 'text', required: false },
      { name: 'bank_account_number', label: 'Account Number', type: 'text', required: false },
      { name: 'bank_ifsc', label: 'IFSC Code', type: 'text', required: false },
      { name: 'pan_number', label: 'PAN Number', type: 'text', required: false },
    ],
  },
  {
    step: 6,
    title: 'Preview & Submit',
    fields: [],
  },
];

export default function RegisterAgency() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [serviceInput, setServiceInput] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    type: 'ITI' as AgencyType,
    registration_number: '',
    gstn: '',
    nsdc_code: '',
    contact_person: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    lat: 0,
    lng: 0,
    service_areas: [] as string[],
    partnership_tier: 'standard' as PartnershipTier,
    partnership_model: 'job_placement' as PartnershipModel,
    engineer_capacity: 0,
    bank_account_name: '',
    bank_account_number: '',
    bank_ifsc: '',
    pan_number: '',
    // status: 'pending_approval' as AgencyStatus,
  });

  const handleField = (key: string, value: any) => {
    // Auto-convert numbers
    const numberFields = ['lat', 'lng', 'engineer_capacity'];

    setFormData((prev) => ({
      ...prev,
      [key]: numberFields.includes(key) ? Number(value) : value,
    }));
  };

  const addServiceArea = () => {
    if (!serviceInput.trim()) return;
    handleField('service_areas', [...formData.service_areas, serviceInput.trim()]);
    setServiceInput('');
  };

  const removeServiceArea = (area: string) => {
    handleField(
      'service_areas',
      formData.service_areas.filter((s) => s !== area)
    );
  };

  const validateStep = () => {
    const currentStep = FORM_STEPS[step - 1];
    if (step === 7) return true;

    return currentStep.fields
      .filter((field) => field.required)
      .every((field) => {
        const value = formData[field.name as keyof typeof formData];
        if (field.type === 'multi_select') return true;
        return value && value !== '';
      });
  };

  const submit = async () => {
    try {
      setLoading(true);

      const payload: CreateAgencyInput = {
        name: formData.name,
        type: formData.type,
        registration_number: formData.registration_number,
        gstn: formData.gstn,
        nsdc_code: formData.nsdc_code,
        contact_person: formData.contact_person,
        phone: formData.phone,
        email: formData.email,
        primary_location: {
          address: formData.address,
          state: formData.state,
          city: formData.city,
          pincode: formData.pincode,
          lat: formData.lat,
          lng: formData.lng,
        },
        service_areas: formData.service_areas,
        partnership_tier: formData.partnership_tier,
        partnership_model: formData.partnership_model,
        engineer_capacity: formData.engineer_capacity,
        bank_account_name: formData.bank_account_name,
        bank_account_number: formData.bank_account_number,
        bank_ifsc: formData.bank_ifsc,
        pan_number: formData.pan_number || ' ',
      };
      console.log('Payload:', payload);
      const res = await fetch(`/api/new/create/agency`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create agency');
      }

      toast.success('Agency created successfully!');
      // reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create agency');
    } finally {
      setLoading(false);
    }
  };

  // const submit = async () => {
  //   setLoading(true);
  //   setTimeout(() => {
  //     console.log('Form submitted:', formData);
  //     alert('Agency registered successfully!');
  //     setLoading(false);
  //     setStep(1);
  //   }, 1500);
  // };

  const renderField = (field: any) => {
    const value = formData[field.name as keyof typeof formData];

    if (field.type === 'select') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          <Select value={value as string} onValueChange={(v) => handleField(field.name, v)}>
            <SelectTrigger id={field.name}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }

    if (field.type === 'location_lat' || field.type === 'location_lng') {
      return null;
    }

    if (field.type === 'multi_select') {
      return (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <div className="flex gap-2">
            <Input
              id={field.name}
              placeholder={field.placeholder}
              value={serviceInput}
              onChange={(e) => setServiceInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addServiceArea())}
            />
            <Button type="button" onClick={addServiceArea} variant="secondary">
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.service_areas.map((area) => (
              <Badge key={area} variant="secondary" className="pl-3 pr-1">
                {area}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-2 hover:bg-transparent"
                  onClick={() => removeServiceArea(area)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label htmlFor={field.name}>
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          id={field.name}
          type={field.type === 'text' ? 'text' : field.type}
          placeholder={field.placeholder}
          value={value as string}
          onChange={(e) => handleField(field.name, e.target.value)}
        />
      </div>
    );
  };

  const renderPreviewIcon = (idx: number) => {
    const icons = [Building2, Users, MapPinned, Handshake, CreditCard, Shield];
    const IconComponent = icons[idx];
    return <IconComponent className="w-5 h-5 text-slate-600" />;
  };

  const currentStepData = FORM_STEPS[step - 1];
  const stepIcons = [Building2, Users, MapPinned, Handshake, CreditCard, Shield, Eye];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Agency Registration</h1>
          <p className="text-slate-600">Complete all steps to register your agency</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div>
                <CardTitle>{currentStepData.title}</CardTitle>
                <CardDescription>
                  {step === 1 && 'Enter your agency basic information'}
                  {step === 2 && 'Provide primary contact details'}
                  {step === 3 && 'Specify your location and service areas'}
                  {step === 4 && 'Define partnership terms'}
                  {step === 5 && 'Optional bank account information'}
                  {step === 6 && 'Set agency status'}
                  {step === 7 && 'Review all information before submitting'}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {step === 6 ? (
              <div className="space-y-6">
                <div className="p-4 rounded-lg bg-blue-50 text-blue-700 flex items-center gap-2 border border-blue-200">
                  <CheckCircle className="w-4 h-4" />
                  <span>Please review all information below before submitting</span>
                </div>

                {FORM_STEPS.slice(0, 5).map((stepData, idx) => (
                  <div key={stepData.step}>
                    <div className="flex items-center gap-2 mb-3">
                      {renderPreviewIcon(idx)}
                      <h3 className="font-semibold text-slate-900">{stepData.title}</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 ml-7">
                      {stepData.fields.map((field) => {
                        const value = formData[field.name as keyof typeof formData];
                        if (!value || (Array.isArray(value) && value.length === 0)) return null;

                        return (
                          <div key={field.name} className="text-sm">
                            <span className="text-slate-600">{field.label}:</span>{' '}
                            <span className="font-medium text-slate-900">
                              {Array.isArray(value) ? (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {value.map((v) => (
                                    <Badge key={v} variant="outline">
                                      {v}
                                    </Badge>
                                  ))}
                                </div>
                              ) : field.options ? (
                                field.options.find((o: any) => o.value === value)?.label || value
                              ) : (
                                value
                              )}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    {idx < 5 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            ) : step === 3 ? (
              <div className="space-y-4">
                {currentStepData.fields
                  .filter((f) => !['lat', 'lng', 'service_areas'].includes(f.name))
                  .map((field) => renderField(field))}

                <Separator />

                <div className="space-y-4">
                  <Label>Location Coordinates *</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="lat" className="text-sm text-slate-600">
                        Latitude
                      </Label>
                      <Input
                        id="lat"
                        placeholder="Latitude"
                        value={formData.lat}
                        onChange={(e) => handleField('lat', e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lng" className="text-sm text-slate-600">
                        Longitude
                      </Label>
                      <Input
                        id="lng"
                        placeholder="Longitude"
                        value={formData.lng}
                        onChange={(e) => handleField('lng', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {renderField(currentStepData.fields.find((f) => f.name === 'service_areas'))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentStepData.fields.map((field) => renderField(field))}
              </div>
            )}

            <div className="flex justify-between pt-6 border-t">
              <Button onClick={() => setStep(step - 1)} disabled={step === 1} variant="outline">
                Back
              </Button>

              {step < FORM_STEPS.length ? (
                <Button onClick={() => setStep(step + 1)} disabled={!validateStep()}>
                  Next
                </Button>
              ) : (
                <Button onClick={submit} disabled={loading}>
                  {loading ? <Spinner /> : ''} Submit
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
