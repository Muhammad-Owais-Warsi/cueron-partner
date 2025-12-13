'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
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
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

type UserRole = 'junior_engineer' | 'agency_engineer' | 'freelance_engineer';

export default function CreateEngineerForm() {
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '' as UserRole,
  });

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isValid = formData.name && formData.email && formData.phone && formData.role;

  const submit = async () => {
    try {
      setLoading(true);

      const res = await fetch('/api/new/engineers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to create engineer');
      }

      toast.success('Engineer created successfully');
      setFormData({ name: '', email: '', phone: '', role: '' as UserRole });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-100">
            <UserPlus className="w-5 h-5 text-slate-700" />
          </div>
          <div>
            <CardTitle>Create Engineer</CardTitle>
            <CardDescription>Add a new engineer or admin to the system</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Email <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="engineer@company.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
            />
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Phone <span className="text-red-500">*</span>
            </Label>
            <Input
              id="phone"
              placeholder="10 digit mobile number"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label>
              Role <span className="text-red-500">*</span>
            </Label>
            <Select value={formData.role} onValueChange={(v) => handleChange('role', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin (Cueron)</SelectItem>
                <SelectItem value="junior_engineer">Junior Engineer</SelectItem>
                <SelectItem value="agency_manager">Agency Manager</SelectItem>
                <SelectItem value="agency_engineer">Agency Engineer</SelectItem>
                <SelectItem value="freelance_engineer">Freelance Engineer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Submit */}
          <Button className="w-full" onClick={submit} disabled={!isValid || loading}>
            {loading ? <Spinner /> : 'Create Engineer'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
