'use client';

import { useState } from 'react';
import type { CreateEngineerInput, Certification, EmploymentType } from '@cueron/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { Spinner } from '../ui/spinner';
import { toast } from 'sonner';

interface SelectOption {
  value: string;
  label: string;
}

interface LevelOption {
  value: string;
  label: string;
}

interface FormField {
  name: keyof CreateEngineerInput;
  label: string;
  type: 'text' | 'select' | 'level_select' | 'multi_select';
  required?: boolean;
  placeholder?: string;
  options?: SelectOption[];
  default?: string;
  note?: string;
}

interface FormStep {
  step: number;
  title: string;
  fields: FormField[];
}

interface AddEngineerDialogProps {
  // isOpen: boolean;
  // onClose: () => void;
  // onSuccess: () => void;
  agencyId?: string;
}

const FORM_STEPS: FormStep[] = [
  {
    step: 1,
    title: 'Basic Information',
    fields: [
      {
        name: 'name',
        label: 'Full Name',
        type: 'text',
        required: true,
        placeholder: 'Enter full name',
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
        placeholder: 'engineer@example.com',
      },
      {
        name: 'employment_type',
        label: 'Employment Type',
        type: 'select',
        required: true,
        placeholder: 'Choose employment type',
        options: [
          { value: 'full_time', label: 'Full Time' },
          { value: 'part_time', label: 'Part Time' },
          { value: 'gig', label: 'Gig' },
          { value: 'apprentice', label: 'Apprentice' },
        ],
        default: 'full_time',
      },
    ],
  },

  {
    step: 2,
    title: 'Skills & Certifications',
    fields: [
      {
        name: 'skill_level',
        label: 'Skill Level',
        type: 'level_select',
        default: '3',
        note: '1: Beginner - 5: Expert',
      },
      {
        name: 'specializations',
        label: 'Specializations',
        type: 'multi_select',
        placeholder: 'Type specialization and press Enter',
      },
    ],
  },
  {
    step: 3,
    title: 'Preview & Submit',
    fields: [],
  },
];

const LEVEL_OPTIONS: LevelOption[] = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
];

const CERT_TYPES: SelectOption[] = [
  { value: 'PMKVY', label: 'PMKVY' },
  { value: 'ITI', label: 'ITI' },
  { value: 'NSDC', label: 'NSDC' },
  { value: 'Other', label: 'Other' },
];

const CERT_LEVELS: Array<{ value: number; label: string }> = [
  { value: 1, label: 'Level 1' },
  { value: 2, label: 'Level 2' },
  { value: 3, label: 'Level 3' },
  { value: 4, label: 'Level 4' },
  { value: 5, label: 'Level 5' },
];

export function AddEngineerDialog({ agencyId }: AddEngineerDialogProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Partial<CreateEngineerInput>>({
    name: '',
    phone: '',
    email: '',
    skill_level: 3,
    specializations: [],
    employment_type: 'full_time',
  });

  const [specialInput, setSpecialInput] = useState('');

  const [certifications, setCertifications] = useState<Certification[]>([
    { type: 'ITI', level: 1, cert_number: '', verified: false, issued_date: '' },
  ]);

  const handleField = (
    name: keyof CreateEngineerInput,
    value: string | number | string[] | EmploymentType
  ) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const addCertification = () => {
    setCertifications((prev) => [
      ...prev,
      { type: 'ITI', level: 1, cert_number: '', verified: false, issued_date: '' },
    ]);
  };

  const removeCertification = (index: number) => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  const updateCertification = (
    index: number,
    key: keyof Certification,
    value: string | number | boolean
  ) => {
    setCertifications((prev) =>
      prev.map((cert, i) => (i === index ? { ...cert, [key]: value } : cert))
    );
  };

  const handleSpecialKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && specialInput.trim() !== '') {
      e.preventDefault();
      handleField('specializations', [...(formData.specializations || []), specialInput.trim()]);
      setSpecialInput('');
    }
  };

  const removeTag = (tag: string) => {
    handleField('specializations', formData.specializations?.filter((t) => t !== tag) || []);
  };

  const submit = async () => {
    try {
      setLoading(true);

      const payload: CreateEngineerInput = {
        agency_id: agencyId || '',
        name: formData.name || '',
        phone: formData.phone || '',
        email: formData.email,
        skill_level: formData.skill_level || 3,
        specializations: formData.specializations || [],
        certifications,
        employment_type: formData.employment_type || 'full_time',
      };

      const safeAgencyId = agencyId ?? 'unknown';
      console.log('Payload:', payload);
      const res = await fetch(`/api/agencies/${safeAgencyId}/engineers`, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || 'Failed to create engineer');
      }

      toast.success('Engineer created successfully!');
      reset();
      onSuccess();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create engineer');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      skill_level: 3,
      specializations: [],
      employment_type: 'full_time',
    });
    setSpecialInput('');
    setCertifications([
      { type: 'ITI', level: 1, cert_number: '', verified: false, issued_date: '' },
    ]);
    setStep(1);

    onClose();
  };

  const renderField = (field: FormField): JSX.Element | null => {
    if (field.type === 'text') {
      return (
        <Input
          placeholder={field.placeholder}
          value={(formData[field.name] as string) || ''}
          onChange={(e) => handleField(field.name, e.target.value)}
        />
      );
    }

    if (field.type === 'select') {
      return (
        <Select
          value={(formData[field.name] as string) || field.default}
          onValueChange={(v) => handleField(field.name, v)}
        >
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {field.options?.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (field.type === 'level_select') {
      return (
        <div className="space-y-2">
          <div className="flex gap-2">
            {LEVEL_OPTIONS.map((option) => (
              <Button
                key={option.value}
                type="button"
                onClick={() => handleField(field.name, Number(option.value))}
                className={cn(
                  'w-8 h-8 rounded-full border',
                  formData[field.name] === Number(option.value)
                    ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-500'
                    : 'border-gray-300 bg-white text-black hover:bg-white'
                )}
              >
                {option.label}
              </Button>
            ))}
          </div>
          {field.note && <p className="text-xs text-gray-500">{field.note}</p>}
        </div>
      );
    }

    if (field.type === 'multi_select') {
      return (
        <div className="w-full">
          <div className="flex flex-wrap gap-1 mb-2">
            {(formData.specializations as string[])?.map((tag, i) => (
              <div key={i} className="px-2 py-0.5 bg-gray-100 text-xs rounded flex items-center">
                {tag}
                <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => removeTag(tag)} />
              </div>
            ))}
          </div>
          <Input
            placeholder={field.placeholder}
            value={specialInput}
            onChange={(e) => setSpecialInput(e.target.value)}
            onKeyDown={handleSpecialKey}
          />
        </div>
      );
    }

    return null;
  };

  const renderCertifications = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Label className="font-medium">Certifications</Label>
        <Button
          size="sm"
          onClick={addCertification}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          type="button"
        >
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>

      {certifications.length === 0 ? (
        <div className="text-center py-4 border rounded-lg border-dashed">
          <p className="text-sm text-gray-500 mb-2">No certifications added</p>
          <Button size="sm" variant="outline" onClick={addCertification} type="button">
            <Plus className="w-4 h-4 mr-1" /> Add First Certification
          </Button>
        </div>
      ) : (
        certifications.map((cert, i) => (
          <div key={i} className="p-4 border rounded-md space-y-3 relative">
            {/* Always show remove button, even for the first one */}
            <Button
              size="icon-sm"
              variant="ghost"
              className="absolute right-2 top-2 p-1 hover:bg-gray-100 rounded"
              onClick={() => removeCertification(i)}
              title="Remove certification"
            >
              <X className="w-4 h-4 " />
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Certificate Type</Label>
                <Select value={cert.type} onValueChange={(v) => updateCertification(i, 'type', v)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_TYPES.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Certificate Level</Label>
                <Select
                  value={String(cert.level)}
                  onValueChange={(v) => updateCertification(i, 'level', Number(v))}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CERT_LEVELS.map((option) => (
                      <SelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Certificate Number</Label>
              <Input
                className="h-9"
                placeholder="Enter certificate number (optional)"
                value={cert.cert_number}
                onChange={(e) => updateCertification(i, 'cert_number', e.target.value)}
              />
            </div>

            <div>
              <Label className="text-xs">Issued Date</Label>
              <Input
                className="h-9"
                type="date"
                value={cert.issued_date || ''}
                onChange={(e) => updateCertification(i, 'issued_date', e.target.value)}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                checked={cert.verified}
                onCheckedChange={(v) => updateCertification(i, 'verified', Boolean(v))}
              />
              <Label className="text-xs">Verified</Label>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderPreviewSection = () => {
    const getEmploymentTypeLabel = (value: string) => {
      const option = FORM_STEPS[0].fields
        .find((field) => field.name === 'employment_type')
        ?.options?.find((opt) => opt.value === value);
      return option?.label || value;
    };

    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-gray-600">Full Name</Label>
              <p className="text-sm font-medium">{formData.name || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Phone Number</Label>
              <p className="text-sm font-medium">{formData.phone || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Email</Label>
              <p className="text-sm font-medium">{formData.email || 'Not provided'}</p>
            </div>
            <div>
              <Label className="text-xs text-gray-600">Employment Type</Label>
              <p className="text-sm font-medium">
                {getEmploymentTypeLabel(formData.employment_type as string)}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Skills & Experience</h3>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-600">Skill Level</Label>
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {LEVEL_OPTIONS.map((option) => (
                    <div
                      key={option.value}
                      className={cn(
                        'w-6 h-6 rounded-full border text-xs flex items-center justify-center',
                        formData.skill_level === Number(option.value)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'border-gray-300 text-gray-400'
                      )}
                    >
                      {option.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Specializations</Label>
              {formData.specializations && formData.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-1 mt-1">
                  {formData.specializations.map((spec, i) => (
                    <Badge key={i} className="px-2 py-1  text-xs rounded">
                      {spec}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No specializations added</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-gray-900 border-b pb-2">Certifications</h3>
          {certifications.some((cert) => cert.cert_number && cert.type) ? (
            <div className="space-y-2">
              {certifications
                .filter((cert) => cert.cert_number && cert.type)
                .map((cert, i) => (
                  <div key={i} className="p-3 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-gray-600">Type</Label>
                        <p className="font-medium">{cert.type}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-gray-600">Level</Label>
                        <p className="font-medium">Level {cert.level}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <Label className="text-xs text-gray-600">Certificate Number</Label>
                      <p className="font-medium text-sm">{cert.cert_number}</p>
                    </div>
                    {cert.issued_date && (
                      <div>
                        <Label className="text-xs text-gray-600">Issued Date</Label>
                        <p className="font-medium text-sm">
                          {new Date(cert.issued_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}

                    {cert.verified && (
                      <div className="mt-2 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs text-green-600 font-medium">Verified</span>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No certifications added</p>
          )}
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-gray-500 mb-3">Need to make changes?</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep(1)} className="text-xs">
              Edit Basic Info
            </Button>
            <Button variant="outline" size="sm" onClick={() => setStep(2)} className="text-xs">
              Edit Skills & Certifications
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const currentStep = FORM_STEPS.find((s) => s.step === step);

  return (
    <Dialog>
      <DialogTrigger>
        <Button>
          <Plus />
          Add Engineer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Engineer</DialogTitle>
        </DialogHeader>

        <h2 className="text-lg font-semibold mb-4">{currentStep?.title}</h2>

        <div className="space-y-4">
          {step === 3 ? (
            renderPreviewSection()
          ) : (
            <>
              {currentStep?.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label className="text-sm font-medium">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}

              {step === 2 && renderCertifications()}
            </>
          )}
        </div>

        <DialogFooter className="mt-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)} disabled={loading}>
              Back
            </Button>
          )}

          {step < FORM_STEPS.length ? (
            <Button onClick={() => setStep(step + 1)} disabled={loading}>
              {step === 2 ? 'Preview' : 'Next'}
            </Button>
          ) : (
            <Button onClick={() => void submit()} disabled={loading}>
              {loading ? <Spinner /> : ''} Submit
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
