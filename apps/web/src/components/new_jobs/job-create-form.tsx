'use client';

import { useState } from 'react';
import {
  Briefcase,
  MapPin,
  Cpu,
  Contact,
  FileText,
  PlusCircle,
  IndianRupee,
  Phone,
  Mail,
  User,
  Eye,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

export const JOB_FORM_FIELDS = [
  {
    section: 'Job Location & Budget',
    icon: <MapPin className="h-4 w-4" />,
    fields: [
      {
        name: 'location',
        label: 'Service Location',
        type: 'text',
        required: true,
        icon: <MapPin className="h-3.5 w-3.5" />,
      },
      {
        name: 'price',
        label: 'Budget (₹)',
        type: 'number',
        required: false,
        icon: <IndianRupee className="h-3.5 w-3.5" />,
      },
    ],
  },
  {
    section: 'Equipment Details',
    icon: <Cpu className="h-4 w-4" />,
    fields: [
      { name: 'equipment_type', label: 'Equipment Type', type: 'text', required: true },
      { name: 'equipment_sl_no', label: 'Equipment Serial No', type: 'text', required: true },
    ],
  },
  {
    section: 'Point of Contact',
    icon: <Contact className="h-4 w-4" />,
    fields: [
      {
        name: 'poc_name',
        label: 'POC Name',
        type: 'text',
        required: true,
        icon: <User className="h-3.5 w-3.5" />,
      },
      {
        name: 'poc_phone',
        label: 'POC Phone',
        type: 'text',
        required: true,
        icon: <Phone className="h-3.5 w-3.5" />,
      },
      {
        name: 'poc_email',
        label: 'POC Email',
        type: 'email',
        required: true,
        icon: <Mail className="h-3.5 w-3.5" />,
      },
    ],
  },
  {
    section: 'Job Scope',
    icon: <FileText className="h-4 w-4" />,
    fields: [
      { name: 'problem_statement', label: 'Problem Statement', type: 'textarea', required: true },
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
      const res = await fetch('/api/new/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Failed to create job');

      toast.success('Job published successfully');
      setFormData({});
    } catch (err) {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-700">
      <Card className="border-border/60 shadow-xl bg-card">
        <CardHeader className="bg-muted/30 border-b py-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
              <Briefcase className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">
                Create New Job
              </CardTitle>
              <CardDescription className="font-medium text-muted-foreground">
                Post a service requirement to the marketplace
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="divide-y divide-border/40">
            {JOB_FORM_FIELDS.map((section) => (
              <div key={section.section} className="p-8 space-y-6">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-muted rounded-md text-muted-foreground">
                    {section.icon}
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-widest text-foreground/80">
                    {section.section}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {section.fields.map((field) => (
                    <div key={field.name} className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                        {field.label}{' '}
                        {field.required && <span className="text-destructive">*</span>}
                      </Label>
                      <div className="relative">
                        {field.icon && (
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                            {field.icon}
                          </div>
                        )}
                        {field.type === 'textarea' ? (
                          <Textarea
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(field.name, e.target.value)}
                            className="min-h-[100px] border-border/60 bg-background"
                          />
                        ) : (
                          <Input
                            type={field.type}
                            value={formData[field.name] || ''}
                            className={`${field.icon ? 'pl-9' : ''} border-border/60 h-11`}
                            onChange={(e) =>
                              handleChange(
                                field.name,
                                field.type === 'number' ? Number(e.target.value) : e.target.value
                              )
                            }
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="p-8 bg-muted/20 border-t flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div
                className={`h-2 w-2 rounded-full ${isValid ? 'bg-emerald-500' : 'bg-amber-500'}`}
              />
              {isValid ? 'Ready to publish' : 'Required fields missing'}
            </div>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="font-bold text-xs uppercase"
                onClick={() => setFormData({})}
              >
                Clear
              </Button>
              <Button
                onClick={submit}
                disabled={!isValid || loading}
                className="font-black uppercase tracking-widest text-xs px-8  shadow-lg shadow-primary/20"
              >
                {loading ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Publish Job
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
