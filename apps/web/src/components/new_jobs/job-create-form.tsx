'use client';

import { useState } from 'react';
import { Briefcase } from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

export const JOB_FORM_FIELDS = [
  {
    section: 'Job Details',
    fields: [
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'price', label: 'Price', type: 'number', required: false },
    ],
  },
  {
    section: 'Equipment Details',
    fields: [
      { name: 'equipment_type', label: 'Equipment Type', type: 'text', required: true },
      { name: 'equipment_sl_no', label: 'Equipment Serial No', type: 'text', required: true },
    ],
  },
  {
    section: 'Point of Contact',
    fields: [
      { name: 'poc_name', label: 'POC Name', type: 'text', required: true },
      { name: 'poc_phone', label: 'POC Phone', type: 'text', required: true },
      { name: 'poc_email', label: 'POC Email', type: 'email', required: true },
    ],
  },
  {
    section: 'Job Description',
    fields: [
      {
        name: 'problem_statement',
        label: 'Problem Statement',
        type: 'textarea',
        required: true,
      },
      {
        name: 'possible_solution',
        label: 'Possible Solution',
        type: 'textarea',
        required: false,
      },
      {
        name: 'photos',
        label: 'Photo URLs (comma separated)',
        type: 'textarea',
        required: false,
      },
    ],
  },
];

export default function CreateJobForm() {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = JOB_FORM_FIELDS.every((section) =>
    section.fields.filter((f) => f.required).every((f) => formData[f.name])
  );

  const submit = async () => {
    try {
      setLoading(true);

      const payload = {
        ...formData,
        photos: formData.photos ? formData.photos.split(',').map((p: string) => p.trim()) : null,
      };

      const res = await fetch('/api/new/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create job');
      }

      toast.success('Job created successfully');
      setFormData({});
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.name] ?? '';

    if (field.type === 'textarea') {
      return (
        <div key={field.name} className="space-y-2">
          <Label>
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </Label>
          <Textarea value={value} onChange={(e) => handleChange(field.name, e.target.value)} />
        </div>
      );
    }

    return (
      <div key={field.name} className="space-y-2">
        <Label>
          {field.label} {field.required && <span className="text-red-500">*</span>}
        </Label>
        <Input
          type={field.type}
          value={value}
          onChange={(e) =>
            handleChange(
              field.name,
              field.type === 'number' ? Number(e.target.value) : e.target.value
            )
          }
        />
      </div>
    );
  };

  return (
    <div className="w-full px-6 py-8">
      <Card className="max-w-6xl">
        <CardHeader className="flex flex-row items-center gap-4 border-b">
          <div className="p-2 rounded-lg bg-muted">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <CardTitle>Create Job</CardTitle>
            <CardDescription>Fill details to create a new job</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {JOB_FORM_FIELDS.map((section) => (
            <div key={section.section} className="p-5 space-y-4">
              <h3 className="font-semibold">{section.section}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map(renderField)}
              </div>
            </div>
          ))}

          <div className="flex justify-end">
            <Button onClick={submit} disabled={!isValid || loading}>
              {loading ? <Spinner /> : 'Create Job'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
