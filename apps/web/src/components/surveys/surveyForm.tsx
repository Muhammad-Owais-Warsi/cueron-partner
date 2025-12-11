'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { X } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateSurveyForm({
  agencyId,
  engineerId,
  onSuccess,
}: {
  agencyId: string;
  engineerId: string;
  onSuccess?: (survey: any) => void;
}) {
  const [jobNumber, setJobNumber] = useState('');
  const [description, setDescription] = useState('');

  const [equipmentInput, setEquipmentInput] = useState('');
  const [equipments, setEquipments] = useState<string[]>([]);

  const [amount, setAmount] = useState('');

  const [photoInput, setPhotoInput] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);

  const addEquipment = () => {
    if (!equipmentInput.trim()) return;
    setEquipments((prev) => [...prev, equipmentInput.trim()]);
    setEquipmentInput('');
  };

  const removeEquipment = (eq: string) => {
    setEquipments((prev) => prev.filter((x) => x !== eq));
  };

  const addPhoto = () => {
    if (!photoInput.trim()) return;
    setPhotoUrls((prev) => [...prev, photoInput.trim()]);
    setPhotoInput('');
  };

  const removePhoto = (p: string) => {
    setPhotoUrls((prev) => prev.filter((x) => x !== p));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/engineers/${agencyId}/surveys`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          engineer_id: engineerId,
          job_number: jobNumber,
          description,
          equipments_required: equipments,
          amount: amount ? Number(amount) : null,
          photos: photoUrls,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || 'Failed to create survey');
        throw new Error(data.error);
      }

      toast.success('Survey created successfully!');

      onSuccess?.(data.survey);

      // Reset
      setJobNumber('');
      setDescription('');
      setEquipments([]);
      setPhotoUrls([]);
      setAmount('');
    } catch (err: any) {
      console.error(err);
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-xl mx-auto p-4">
      <CardHeader>
        <h2 className="text-lg font-semibold">Create Survey</h2>
      </CardHeader>

      <CardContent>
        <form className="space-y-6" onSubmit={handleSubmit}>
          {/* Job ID */}
          <div className="space-y-2">
            <Label>Job ID</Label>
            <Input
              value={jobNumber}
              onChange={(e) => setJobNumber(e.target.value)}
              placeholder="JOB-1234"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the site survey..."
              required
            />
          </div>

          {/* Equipments */}
          <div className="space-y-2">
            <Label>Equipments Required</Label>
            <div className="flex gap-2">
              <Input
                value={equipmentInput}
                onChange={(e) => setEquipmentInput(e.target.value)}
                placeholder="Add equipment"
              />
              <Button type="button" onClick={addEquipment}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {equipments.map((eq) => (
                <Badge key={eq} variant="secondary" className="flex items-center gap-1">
                  {eq}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeEquipment(eq)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount (Optional)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1500"
            />
          </div>

          {/* Photos */}
          <div className="space-y-2">
            <Label>Photo URLs (Optional)</Label>
            <div className="flex gap-2">
              <Input
                value={photoInput}
                onChange={(e) => setPhotoInput(e.target.value)}
                placeholder="https://..."
              />
              <Button type="button" onClick={addPhoto}>
                Add
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {photoUrls.map((p) => (
                <Badge key={p} variant="outline" className="flex items-center gap-1">
                  {p}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removePhoto(p)} />
                </Badge>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Submitting...' : 'Create Survey'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
