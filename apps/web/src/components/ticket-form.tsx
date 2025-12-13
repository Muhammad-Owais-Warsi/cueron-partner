'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

// ticket-form-config.ts

export const TICKET_FORM_FIELDS = [
  {
    section: 'Company Details',
    fields: [
      { name: 'company_name', label: 'Company Name', type: 'text', required: true },
      { name: 'company_phone', label: 'Company Phone', type: 'text', required: true },
      { name: 'company_email', label: 'Company Email', type: 'email', required: true },
      { name: 'gst', label: 'GST Number', type: 'text', required: true },
      { name: 'billing_address', label: 'Billing Address', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
    ],
  },
  {
    section: 'Equipment Details',
    fields: [
      { name: 'equipment_type', label: 'Equipment Type', type: 'text', required: true },
      { name: 'equipment_sl_no', label: 'Equipment Serial No', type: 'text', required: true },
      { name: 'brand_name', label: 'Brand Name', type: 'text', required: true },
      {
        name: 'years_of_operation_in_equipment',
        label: 'Years of Operation',
        type: 'number',
        required: false,
      },
      { name: 'capacity', label: 'Capacity', type: 'number', required: false },
    ],
  },
  {
    section: 'Inspection Schedule',
    fields: [
      { name: 'inspection_date', label: 'Inspection Date', type: 'date', required: true },
      { name: 'inspection_time', label: 'Inspection Time', type: 'time', required: true },
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
    section: 'Problem Details',
    fields: [
      {
        name: 'problem_statement',
        label: 'Problem Statement',
        type: 'textarea',
        required: true,
      },
      {
        name: 'specification_plate_photo',
        label: 'Specification Plate Photo URL',
        type: 'text',
        required: false,
      },
    ],
  },
];

export default function CreateTicketForm() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Record<string, any>>({});

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = TICKET_FORM_FIELDS.every((section) =>
    section.fields.filter((f) => f.required).every((f) => formData[f.name])
  );

  const submit = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/tickets/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Failed to create ticket');
      }

      toast.success('Ticket created successfully');
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
        <CardHeader className="flex flex-row items-center gap-4 ">
          <div className="p-2 rounded-lg bg-muted">
            <FileText className="w-5 h-5 text-foreground" />
          </div>
          <div>
            <CardTitle className="text-xl">Create Ticket</CardTitle>
            <CardDescription>Fill in the details to raise a new inspection ticket</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-8 pt-6">
          {TICKET_FORM_FIELDS.map((section) => (
            <div key={section.section} className="rounded-lg bg-card p-5 space-y-4">
              {/* Section heading */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-foreground">{section.section}</h3>
              </div>

              {/* Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {section.fields.map(renderField)}
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button onClick={submit} disabled={!isValid || loading}>
              {loading ? <Spinner /> : 'Create Ticket'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
